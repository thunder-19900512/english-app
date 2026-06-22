import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { useAppSettings } from '../../../hooks/useAppSettings';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis';
import { usePoints } from '../../../hooks/usePoints';
import { Button } from '../../ui/Button';
import { MicButton } from '../../ui/MicButton';
import { ArrowLeft, Send, Sparkles, AlertTriangle, Coins } from 'lucide-react';
import { SAFETY_INSTRUCTION, isInappropriate } from '../../../lib/contentFilter';

// 不適切な入力・出力のときに出す、やさしい切り返し
const REDIRECT_MESSAGE = "Let's keep it kind! 😊 そういう言葉はお返事できないよ。すきな食べ物やスポーツを英語で話してみよう！";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_PROMPTS = {
  restaurant: "You are Alex, a cashier at a fast food restaurant. Your very first message MUST be: 'Welcome! May I help you?'. The user will order food. Reply with simple English phrases like 'Here you are', 'Anything else?', 'That is 5 dollars'. Keep your responses to exactly one short sentence. Do not use emojis.",
  directions: "You are Taylor, a tourist who is lost in a town in Japan. Your very first message MUST be: 'Excuse me! I am lost. Where is the station?'. The user will give you directions (e.g. Go straight, Turn right). Reply with 'Thank you!' or ask for another place like 'Where is the park?'. Keep your responses to exactly one short sentence. Do not use emojis.",
  freetalk: "You are Jordan, a friendly 10-year-old. Your very first message MUST be: 'Hi! I am Jordan. Nice to meet you!'. Ask the user simple questions about their favorite sports, food, or colors. Keep your responses to exactly one short sentence. Do not use emojis."
};

const MESSAGE_COST = 5;

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { geminiApiKey } = useAppSettings();
  const { speak } = useSpeechSynthesis();
  const { transcript, isRecording, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { consumePoints, totalPoints } = usePoints();
  const studentId = localStorage.getItem('studentId');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<keyof typeof SYSTEM_PROMPTS | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initChat = async (selectedMode: keyof typeof SYSTEM_PROMPTS) => {
    if (!geminiApiKey) return;
    setMode(selectedMode);
    
    const histKey = `ai_hist_${studentId}_${selectedMode}`;
    const savedHist = localStorage.getItem(histKey);
    let pastMessages: ChatMessage[] = [];
    if (savedHist) {
      try {
        pastMessages = JSON.parse(savedHist);
      } catch (e) {}
    }
    
    setMessages(pastMessages);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
      const data = await response.json();
      
      const availableModels = data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash'))
        .map((m: any) => m.name.replace('models/', ''))
        .sort((a: string, b: string) => b.localeCompare(a));

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      let targetModel = '';
      let lastError: any = null;

      // Find the first working model
      for (const modelName of availableModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          await model.generateContent("test"); // dry run to check for 404
          targetModel = modelName;
          break;
        } catch (e: any) {
          console.warn(`Model ${modelName} failed dry run:`, e);
          lastError = e;
        }
      }

      if (!targetModel) {
        throw lastError || new Error("利用可能なモデルが見つかりませんでした");
      }

      const model = genAI.getGenerativeModel({
        model: targetModel,
        systemInstruction: `${SYSTEM_PROMPTS[selectedMode]}\n${SAFETY_INSTRUCTION}`
      });

      const sysPrompt = `[SYSTEM INSTRUCTION]:\n${SYSTEM_PROMPTS[selectedMode]}\n${SAFETY_INSTRUCTION}\nSpeak English only. Respond with exactly ONE short sentence.`;
      
      const initialGreeting = selectedMode === 'restaurant' ? 'Welcome! May I help you?' 
                            : selectedMode === 'directions' ? 'Excuse me! I am lost. Where is the station?' 
                            : 'Hi! I am Jordan. Nice to meet you!';

      let historyForGemini: any[] = [];
      
      if (pastMessages.length === 0) {
        // Seed new conversation
        historyForGemini = [
          { role: 'user', parts: [{ text: sysPrompt }] },
          { role: 'model', parts: [{ text: initialGreeting }] }
        ];
      } else {
        // Reload existing conversation
        historyForGemini = [
          { role: 'user', parts: [{ text: sysPrompt }] },
          { role: 'model', parts: [{ text: initialGreeting }] },
          // Skip the first model message in pastMessages since we just prepended it
          ...pastMessages.slice(1).map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }))
        ];
      }
      
      const chat = model.startChat({
        history: historyForGemini,
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.7,
        },
      });
      
      setChatSession(chat);
      
      if (pastMessages.length === 0) {
        const initialMsg: ChatMessage = { role: 'model', text: initialGreeting };
        setMessages([initialMsg]);
        localStorage.setItem(`ai_hist_${studentId}_${selectedMode}`, JSON.stringify([initialMsg]));
        speak(initialGreeting);
      }
    } catch (err: any) {
      console.error("AI Init Error:", err);
      const errorMessage = err.message ? `[システムエラー] ${err.message}` : "[システムエラー] AIの初期化に失敗しました。APIキーが正しいか確認してください。";
      setMessages([{ role: 'model', text: errorMessage }]);
      setIsAiThinking(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !chatSession) return;

    // 安全装置：不適切な入力はAIに送らず、ポイントも消費せず、やさしく切り返す。
    if (isInappropriate(text)) {
      setMessages(prev => [...prev, { role: 'model', text: REDIRECT_MESSAGE }]);
      setTranscript('');
      setInputText('');
      speak("Let's keep it kind!");
      return;
    }

    // Check points
    const ok = await consumePoints(MESSAGE_COST);
    if (!ok) {
      alert(`ポイントが足りないよ！（${MESSAGE_COST}P ひつよう）`);
      return;
    }
    
    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    setTranscript('');
    setInputText('');
    setIsAiThinking(true);

    const histKey = `ai_hist_${studentId}_${mode}`;

    try {
      const result = await chatSession.sendMessage(text);
      const rawResponse = result.response.text();
      // 安全装置：万一AIの返答が不適切なら、安全な定型文に差し替える。
      const responseText = isInappropriate(rawResponse) ? REDIRECT_MESSAGE : rawResponse;

      const updatedMessages: ChatMessage[] = [...newMessages, { role: 'model', text: responseText }];
      setMessages(updatedMessages);
      
      // Save valid alternating history
      const savedMessages = updatedMessages.filter(m => m.text !== "Oops, I didn't catch that. Can you say it again?");
      localStorage.setItem(histKey, JSON.stringify(savedMessages));
      speak(responseText);
    } catch (err: any) {
      console.error("AI Send Error:", err);
      const errorMessage = err.message ? `[エラー] ${err.message}` : "Oops, I didn't catch that. Can you say it again?";
      const errMessages: ChatMessage[] = [...newMessages, { role: 'model', text: errorMessage }];
      setMessages(errMessages);
      // Do not save error messages to history
    } finally {
      setIsAiThinking(false);
    }
  };

  useEffect(() => {
    if (isRecording && transcript) {
      setInputText(transcript);
    }
  }, [transcript, isRecording]);

  const onMicClick = () => {
    if (isRecording) {
      stopListening();
    } else {
      setTranscript('');
      setInputText('');
      startListening();
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputText);
  };

  if (!geminiApiKey) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle size={60} color="var(--color-error)" />
        <h2 className="text-primary">AIのじゅんびができていません</h2>
        <p>先生用ダッシュボードから、APIキーを設定してください。</p>
        <Button onClick={() => navigate('/home')}>ホームにもどる</Button>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="flex-col gap-lg" style={{ flex: 1, paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>もどる</Button>
          <h1 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0, marginRight: '80px' }}>AIとえいごではなそう！</h1>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          <div className="glass-card flex-col flex-center hover-scale" style={{ cursor: 'pointer', padding: '3rem 2rem' }} onClick={() => initChat('restaurant')}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍔</div>
            <h2>お店屋さんごっこ</h2>
            <p style={{ color: '#666', textAlign: 'center' }}>ハンバーガー屋さんでお買い物をしてみよう！</p>
          </div>
          
          <div className="glass-card flex-col flex-center hover-scale" style={{ cursor: 'pointer', padding: '3rem 2rem' }} onClick={() => initChat('directions')}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
            <h2>道あんない</h2>
            <p style={{ color: '#666', textAlign: 'center' }}>迷子の友だちに道を教えてあげよう！</p>
          </div>
          
          <div className="glass-card flex-col flex-center hover-scale" style={{ cursor: 'pointer', padding: '3rem 2rem' }} onClick={() => initChat('freetalk')}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👋</div>
            <h2>フリートーク</h2>
            <p style={{ color: '#666', textAlign: 'center' }}>スポーツや好きなことについて自由に話そう！</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col" style={{ height: '100%', maxHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <Button variant="outline" onClick={() => setMode(null)} icon={ArrowLeft}>もどる</Button>
        <h2 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0 }}>
          {mode === 'restaurant' ? '🍔 お店屋さん' : mode === 'directions' ? '🗺️ 道あんない' : '👋 フリートーク'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button 
            variant="outline" 
            onClick={() => {
              if (window.confirm('会話をリセットして最初からやり直しますか？')) {
                const histKey = `ai_hist_${studentId}_${mode}`;
                localStorage.removeItem(histKey);
                initChat(mode);
              }
            }}
            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
          >
            リセット
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold' }}>
            <Coins size={20} color="#FFD700" />
            {totalPoints} P
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="glass-card flex-col" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', gap: '1.5rem', marginBottom: '1rem', background: '#f8f9fa' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: '0.5rem'
          }}>
            {msg.role === 'model' && (
              <div style={{ fontSize: '2.5rem', background: '#fff', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                🤖
              </div>
            )}
            
            <div className="animate-pop" style={{
              maxWidth: '70%',
              padding: '1rem 1.5rem',
              borderRadius: '20px',
              borderBottomLeftRadius: msg.role === 'model' ? '0' : '20px',
              borderBottomRightRadius: msg.role === 'user' ? '0' : '20px',
              background: msg.role === 'user' ? 'var(--color-primary)' : 'white',
              color: msg.role === 'user' ? 'white' : 'var(--color-text-main)',
              fontSize: '1.5rem',
              fontFamily: 'var(--font-heading)',
              boxShadow: 'var(--shadow-sm)',
              cursor: msg.role === 'model' ? 'pointer' : 'default'
            }}
            onClick={() => msg.role === 'model' && speak(msg.text)}
            >
              {msg.text}
            </div>
            
            {msg.role === 'model' && (
               <div style={{ fontSize: '0.8rem', color: '#999', cursor: 'pointer' }} onClick={() => speak(msg.text)}>
                 🔈 もう一度聞く
               </div>
            )}
          </div>
        ))}
        
        {isAiThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ fontSize: '2.5rem' }}>🤖</div>
            <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
              <Sparkles className="animate-float" color="var(--color-accent)" />
              <span style={{ color: '#666' }}>かんがえ中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
          <MicButton isRecording={isRecording} onClick={onMicClick} />
          
          <div style={{ width: '2px', height: '40px', background: '#ccc' }}></div>
          
          <form onSubmit={onFormSubmit} style={{ display: 'flex', flex: 1, gap: '0.5rem', maxWidth: '500px' }}>
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="ここに入力してね"
              style={{ flex: 1, padding: '0.8rem 1rem', fontSize: '1.2rem', borderRadius: '20px', border: '1px solid #ccc' }}
            />
            <Button type="submit" disabled={isAiThinking || !inputText.trim()} style={{ borderRadius: '20px', padding: '0.8rem 1.5rem' }} icon={Send}>
              送る (5P)
            </Button>
          </form>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
          メッセージを送るたびに5ポイント消費します。
        </div>
      </div>
    </div>
  );
};
