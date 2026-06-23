import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { useAppSettings } from '../../../hooks/useAppSettings';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis';
import { usePoints } from '../../../hooks/usePoints';
import { Button } from '../../ui/Button';
import { MicButton } from '../../ui/MicButton';
import { ArrowLeft, Send, Sparkles, AlertTriangle, Coins, HelpCircle, Languages, Trophy } from 'lucide-react';
import { SAFETY_INSTRUCTION, isInappropriate } from '../../../lib/contentFilter';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  ja?: string;
}

interface Suggestion { en: string; ja: string; }
interface Scenario {
  emoji: string;
  title: string;
  desc: string;
  role: string;
  goal: string;
  goalLabel: string;
  greeting: { en: string; ja: string };
  suggestions: Suggestion[];
}

const SCENARIOS: Record<string, Scenario> = {
  restaurant: {
    emoji: '🍔', title: 'お店屋さんごっこ', desc: 'ハンバーガー屋さんでお買い物をしてみよう！',
    role: 'You are Alex, a friendly cashier at a fast food restaurant.',
    goal: 'The customer orders some food and/or drinks, you tell the total price, and the customer pays or says thank you/goodbye. That is the goal.',
    goalLabel: '🎯 ミッション：ごはんを注文して、お会計までしよう！',
    greeting: { en: 'Welcome! May I help you?', ja: 'いらっしゃいませ！ご注文は？' },
    suggestions: [
      { en: "I'd like a hamburger.", ja: 'ハンバーガーをください。' },
      { en: "Orange juice, please.", ja: 'オレンジジュースをください。' },
      { en: "How much is it?", ja: 'いくらですか？' },
      { en: "Here you are.", ja: 'はい、どうぞ。' },
      { en: "Thank you. Goodbye!", ja: 'ありがとう。さようなら！' },
    ],
  },
  directions: {
    emoji: '🗺️', title: '道案内', desc: '迷子の友だちに道を教えてあげよう！',
    role: 'You are Taylor, a tourist who is lost in a town in Japan and is looking for the station.',
    goal: 'The user gives you directions (go straight, turn right, turn left). When you arrive at the station thanks to their directions, that is the goal.',
    goalLabel: '🎯 ミッション：駅まで道案内してあげよう！',
    greeting: { en: 'Excuse me! Where is the station?', ja: 'すみません！駅はどこですか？' },
    suggestions: [
      { en: 'Go straight.', ja: 'まっすぐ行ってください。' },
      { en: 'Turn right.', ja: '右に曲がってください。' },
      { en: 'Turn left.', ja: '左に曲がってください。' },
      { en: "It's on your right.", ja: '右側にありますよ。' },
      { en: 'You can see it.', ja: '見えますよ。' },
    ],
  },
  freetalk: {
    emoji: '👋', title: 'フリートーク', desc: 'すきなことについて自由に話そう！',
    role: 'You are Jordan, a friendly 10-year-old talking with the user.',
    goal: 'Have a friendly chat. After several good exchanges, you may wrap up the conversation nicely.',
    goalLabel: '🎯 ミッション：すきなことを英語で話してみよう！',
    greeting: { en: 'Hi! I am Jordan. Nice to meet you!', ja: 'やあ！ジョーダンだよ。よろしく！' },
    suggestions: [
      { en: 'I like soccer.', ja: 'サッカーが好きです。' },
      { en: 'What sport do you like?', ja: 'どんなスポーツが好き？' },
      { en: 'My favorite food is pizza.', ja: '好きな食べ物はピザです。' },
      { en: 'I have a dog.', ja: '犬を飼っています。' },
      { en: 'How are you?', ja: '元気ですか？' },
    ],
  },
};

const ADAPTIVE_INSTRUCTION =
  'ADAPT to the user\'s level: estimate their English ability from their messages. ' +
  'If they write very short/simple text, make mistakes, or use Japanese, reply with VERY short and VERY simple English. ' +
  'If they write well, you may use slightly longer and more natural English. Always one short sentence is safest for beginners.';

const FORMAT_INSTRUCTION =
  'OUTPUT FORMAT: Reply with exactly ONE short English sentence. Then a new line starting with "JA:" and the natural Japanese translation. ' +
  'Nothing else. When the GOAL has been reached, add the token [CLEAR] at the very end (after the JA line).';

const MESSAGE_COST = 5;
const REDIRECT_MESSAGE = "Let's keep it kind! 😊 そういう言葉はお返事できないよ。すきな食べ物やスポーツを英語で話してみよう！";

// AIの返答から英語・日本語訳・クリア判定を取り出す
const parseReply = (raw: string): { en: string; ja: string; cleared: boolean } => {
  const cleared = /\[CLEAR\]/i.test(raw);
  let t = raw.replace(/\[CLEAR\]/gi, '').trim();
  const parts = t.split(/\n?\s*JA[:：]/i);
  const en = (parts[0] || '').trim();
  const ja = parts.length > 1 ? parts.slice(1).join(' ').trim() : '';
  return { en, ja, cleared };
};

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { geminiApiKey } = useAppSettings();
  const { speak } = useSpeechSynthesis();
  const { transcript, isRecording, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { consumePoints, totalPoints, addPoints } = usePoints();
  const studentId = localStorage.getItem('studentId');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<keyof typeof SCENARIOS | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [situationInput, setSituationInput] = useState('');
  const [pendingFreetalk, setPendingFreetalk] = useState(false);
  const awardedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = async (selectedMode: keyof typeof SCENARIOS, situation?: string) => {
    if (!geminiApiKey) return;
    const scenario = SCENARIOS[selectedMode];
    setMode(selectedMode);
    setPendingFreetalk(false);
    setCleared(false);
    awardedRef.current = false;
    setShowHelp(false);

    const histKey = `ai_hist_${studentId}_${selectedMode}`;
    const savedHist = localStorage.getItem(histKey);
    let pastMessages: ChatMessage[] = [];
    if (savedHist) {
      try { pastMessages = JSON.parse(savedHist); } catch (e) {}
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
      for (const modelName of availableModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          await model.generateContent('test');
          targetModel = modelName;
          break;
        } catch (e: any) { lastError = e; }
      }
      if (!targetModel) throw lastError || new Error('利用可能なモデルが見つかりませんでした');

      const situationLine = situation && situation.trim()
        ? `The user set this situation (in Japanese): 「${situation.trim()}」. Play along with this situation.`
        : '';

      const systemText = [
        scenario.role,
        situationLine,
        `GOAL: ${scenario.goal}`,
        ADAPTIVE_INSTRUCTION,
        'Always reply in English only (never Japanese in the English line).',
        SAFETY_INSTRUCTION,
        FORMAT_INSTRUCTION,
      ].filter(Boolean).join('\n');

      const model = genAI.getGenerativeModel({ model: targetModel, systemInstruction: systemText });

      const greetSeed = `${scenario.greeting.en}\nJA: ${scenario.greeting.ja}`;
      let historyForGemini: any[];
      if (pastMessages.length === 0) {
        historyForGemini = [
          { role: 'user', parts: [{ text: `[SYSTEM]\n${systemText}` }] },
          { role: 'model', parts: [{ text: greetSeed }] },
        ];
      } else {
        historyForGemini = [
          { role: 'user', parts: [{ text: `[SYSTEM]\n${systemText}` }] },
          { role: 'model', parts: [{ text: greetSeed }] },
          ...pastMessages.slice(1).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        ];
      }

      const chat = model.startChat({ history: historyForGemini, generationConfig: { maxOutputTokens: 120, temperature: 0.7 } });
      setChatSession(chat);

      if (pastMessages.length === 0) {
        const initialMsg: ChatMessage = { role: 'model', text: scenario.greeting.en, ja: scenario.greeting.ja };
        setMessages([initialMsg]);
        localStorage.setItem(histKey, JSON.stringify([initialMsg]));
        speak(scenario.greeting.en);
      }
    } catch (err: any) {
      console.error('AI Init Error:', err);
      setMessages([{ role: 'model', text: err.message ? `[システムエラー] ${err.message}` : '[システムエラー] AIの初期化に失敗しました。APIキーを確認してください。' }]);
      setIsAiThinking(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !chatSession) return;

    if (isInappropriate(text)) {
      setMessages(prev => [...prev, { role: 'model', text: REDIRECT_MESSAGE }]);
      setTranscript(''); setInputText('');
      speak("Let's keep it kind!");
      return;
    }

    const ok = await consumePoints(MESSAGE_COST);
    if (!ok) { alert(`ポイントが足りないよ！（${MESSAGE_COST}P ひつよう）`); return; }

    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    setTranscript(''); setInputText(''); setShowHelp(false); setIsAiThinking(true);

    const histKey = `ai_hist_${studentId}_${mode}`;
    try {
      const result = await chatSession.sendMessage(text);
      const raw = result.response.text();
      const { en, ja, cleared: didClear } = parseReply(raw);
      const safeEn = isInappropriate(en) ? REDIRECT_MESSAGE : en;

      const updated: ChatMessage[] = [...newMessages, { role: 'model', text: safeEn, ja }];
      setMessages(updated);
      const savable = updated.filter(m => m.text !== "Oops, I didn't catch that. Can you say it again?");
      localStorage.setItem(histKey, JSON.stringify(savable));
      speak(safeEn);

      if (didClear && !awardedRef.current) {
        awardedRef.current = true;
        setCleared(true);
        addPoints(`ai_clear_${mode}`, {});
      }
    } catch (err: any) {
      console.error('AI Send Error:', err);
      setMessages([...newMessages, { role: 'model', text: err.message ? `[エラー] ${err.message}` : "Oops, I didn't catch that. Can you say it again?" }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  useEffect(() => {
    if (isRecording && transcript) setInputText(transcript);
  }, [transcript, isRecording]);

  const onMicClick = () => {
    if (isRecording) { stopListening(); }
    else { setTranscript(''); setInputText(''); startListening(); }
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

  // 状況設定（フリートーク）
  if (pendingFreetalk) {
    return (
      <div className="flex-col gap-lg" style={{ flex: 1, maxWidth: '600px', margin: '0 auto', width: '100%', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="outline" onClick={() => setPendingFreetalk(false)} icon={ArrowLeft}>もどる</Button>
          <h2 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0, marginRight: '80px' }}>👋 フリートーク</h2>
        </div>
        <div className="glass-card flex-col gap-md" style={{ padding: '2rem' }}>
          <h3 style={{ margin: 0 }}>どんな場面で話す？（にほんごでOK・なくてもOK）</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
            例：「はじめて会ったクラスメイトと自己しょうかい」「すきなアニメの話」など。AIがその場面で話してくれるよ。
          </p>
          <textarea
            value={situationInput}
            onChange={e => setSituationInput(e.target.value)}
            placeholder="（れい）休み時間に、すきなスポーツの話をする"
            style={{ width: '100%', minHeight: '90px', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }}
          />
          <Button size="lg" onClick={() => initChat('freetalk', situationInput)} icon={Sparkles} style={{ background: 'var(--color-accent)', color: 'black' }}>
            この場面ではじめる！
          </Button>
          <Button variant="outline" onClick={() => initChat('freetalk', '')}>場面なしではじめる</Button>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="flex-col gap-lg" style={{ flex: 1, paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>もどる</Button>
          <h1 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0, marginRight: '80px' }}>AIと英語で話そう！</h1>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {(Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]).map(key => {
            const s = SCENARIOS[key];
            return (
              <div key={key} className="glass-card flex-col flex-center hover-scale" style={{ cursor: 'pointer', padding: '2.5rem 2rem', border: '2px solid var(--color-primary)' }}
                onClick={() => key === 'freetalk' ? setPendingFreetalk(true) : initChat(key)}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{s.emoji}</div>
                <h2 style={{ textAlign: 'center', margin: 0 }}>{s.title}</h2>
                <p style={{ color: '#666', textAlign: 'center', marginTop: '0.5rem' }}>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const scenario = SCENARIOS[mode];

  return (
    <div className="flex-col" style={{ height: '100%', maxHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant="outline" onClick={() => { setMode(null); setMessages([]); }} icon={ArrowLeft}>もどる</Button>
        <h2 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '1.3rem' }}>{scenario.emoji} {scenario.title}</h2>
        <Button variant="outline" onClick={() => setShowTranslation(t => !t)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.7rem' }} icon={Languages}>
          {showTranslation ? '訳オフ' : '訳オン'}
        </Button>
        <Button variant="outline" onClick={() => { if (window.confirm('会話をリセットして最初からやり直しますか？')) { localStorage.removeItem(`ai_hist_${studentId}_${mode}`); mode === 'freetalk' ? setPendingFreetalk(true) : initChat(mode); } }} style={{ fontSize: '0.8rem', padding: '0.4rem' }}>リセット</Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
          <Coins size={18} color="#FFD700" />{totalPoints} P
        </div>
      </div>

      {/* ゴール表示 */}
      <div style={{ background: 'rgba(253, 203, 110, 0.25)', border: '1px solid var(--color-accent)', borderRadius: '12px', padding: '0.5rem 1rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#7a5a00', textAlign: 'center', fontSize: '0.95rem' }}>
        {scenario.goalLabel}
      </div>

      {cleared && (
        <div className="animate-pop" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid var(--color-success)', borderRadius: '12px', padding: '0.8rem', marginBottom: '0.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Trophy color="var(--color-accent)" />
          <span style={{ fontWeight: 'bold', color: 'var(--color-success)', fontSize: '1.2rem' }}>ミッションクリア！🎉 よくがんばったね！</span>
        </div>
      )}

      {/* Chat Area */}
      <div className="glass-card flex-col" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', gap: '1.2rem', marginBottom: '0.5rem', background: '#f8f9fa' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem' }}>
            {msg.role === 'model' && (
              <div style={{ fontSize: '2rem', background: '#fff', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>🤖</div>
            )}
            <div className="animate-pop" style={{ maxWidth: '72%' }}>
              <div
                onClick={() => msg.role === 'model' && speak(msg.text)}
                style={{ padding: '0.9rem 1.3rem', borderRadius: '20px', borderBottomLeftRadius: msg.role === 'model' ? '0' : '20px', borderBottomRightRadius: msg.role === 'user' ? '0' : '20px', background: msg.role === 'user' ? 'var(--color-primary)' : 'white', color: msg.role === 'user' ? 'white' : 'var(--color-text-main)', fontSize: '1.4rem', fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)', cursor: msg.role === 'model' ? 'pointer' : 'default' }}
              >
                {msg.text}
              </div>
              {showTranslation && msg.role === 'model' && msg.ja && (
                <div style={{ fontSize: '0.95rem', color: '#777', marginTop: '0.3rem', paddingLeft: '0.3rem' }}>🇯🇵 {msg.ja}</div>
              )}
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ fontSize: '2rem' }}>🤖</div>
            <div className="glass-card" style={{ padding: '0.8rem', display: 'flex', gap: '0.5rem' }}>
              <Sparkles className="animate-float" color="var(--color-accent)" /><span style={{ color: '#666' }}>考え中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ヘルプパネル */}
      {showHelp && (
        <div className="glass-card animate-pop" style={{ padding: '1rem', marginBottom: '0.5rem', background: 'rgba(72, 219, 251, 0.12)', border: '2px solid var(--color-primary)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>💡 こんなふうに言ってみよう！（タップで入力）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {scenario.suggestions.map((s, i) => (
              <button key={i} onClick={() => { setInputText(s.en); setShowHelp(false); }}
                style={{ textAlign: 'left', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cde', background: 'white', cursor: 'pointer' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{s.en}</span>
                <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '0.5rem' }}>{s.ja}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="glass-card" style={{ padding: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <MicButton isRecording={isRecording} onClick={onMicClick} />
          <Button variant="outline" onClick={() => setShowHelp(h => !h)} icon={HelpCircle} style={{ padding: '0.6rem 1rem' }}>ヘルプ</Button>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }} style={{ display: 'flex', flex: 1, gap: '0.5rem', minWidth: '220px' }}>
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="ここに入力 or マイク/ヘルプ"
              style={{ flex: 1, padding: '0.8rem 1rem', fontSize: '1.1rem', borderRadius: '20px', border: '1px solid #ccc' }} />
            <Button type="submit" disabled={isAiThinking || !inputText.trim()} style={{ borderRadius: '20px', padding: '0.8rem 1.2rem' }} icon={Send}>送る(5P)</Button>
          </form>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '0.4rem' }}>メッセージを送るたびに5ポイント消費します。</div>
      </div>
    </div>
  );
};
