import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { useAppSettings } from '../../../hooks/useAppSettings';
import { saveConversationLog } from '../../../lib/conversationLogs';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis';
import { usePoints } from '../../../hooks/usePoints';
import { Button } from '../../ui/Button';
import { MicButton } from '../../ui/MicButton';
import { ArrowLeft, Send, Sparkles, AlertTriangle, Coins, HelpCircle, Languages, Trophy } from 'lucide-react';
import { SAFETY_INSTRUCTION, isInappropriate } from '../../../lib/contentFilter';
import { DIALOGUES } from '../../dialogue/dialogueData';
import { isOverCap, incUsage } from '../../../lib/apiUsage';
import { useSafeBack } from '../../../hooks/useSafeBack';

// 教科書の各Unitに紐づくフリートークの場面とゴール。
// goal は英語（AIがこの条件を満たしたら最後に [CLEAR] を付ける＝クリア判定の基準）。
// missionJa は子ども向けの「クリア条件」表示。situation は場面（日本語）。
interface FreetalkUnit { id: string; label: string; situation: string; goal: string; missionJa: string; greeting: { en: string; ja: string }; }
export const FREETALK_UNITS: FreetalkUnit[] = [
  { id: 'g5-u1', label: '5年 U1 好きな教科', situation: '休み時間に、好きな教科について話す', goal: 'The goal is reached only after the user has BOTH asked you what subject you like AND told you their own favorite subject.', missionJa: 'すきな教科をたずねて、自分のすきな教科も伝えよう！', greeting: { en: 'Hi! What subject do you like?', ja: 'やあ！何の教科が好き？' } },
  { id: 'g5-u2', label: '5年 U2 誕生日', situation: '友だちの誕生日とほしいものを聞き合う', goal: 'The goal is reached only after the user has asked when your birthday is AND told you their own birthday AND said one thing they want.', missionJa: '誕生日をたずね合って、ほしいものも伝えよう！', greeting: { en: 'Hi! When is your birthday?', ja: 'やあ！誕生日はいつ？' } },
  { id: 'g5-u3', label: '5年 U3 できること', situation: 'お互いにできること（楽器・スポーツ）を聞き合う', goal: 'The goal is reached only after the user has asked what you can do AND told you one thing they can do.', missionJa: 'おたがいの「できること」をたずね合おう！', greeting: { en: 'Can you play the piano?', ja: 'ピアノは弾ける？' } },
  { id: 'g5-u4', label: '5年 U4 友だちの特技', situation: '友だちが上手にできることを紹介し合う', goal: 'The goal is reached only after the user has introduced what their friend can do well using "He can ..." or "She can ...".', missionJa: '友だちが上手にできることをしょうかいしよう！', greeting: { en: 'My friend can run fast. How about your friend?', ja: '友だちは速く走れるよ。きみの友だちは？' } },
  { id: 'g5-u5', label: '5年 U5 道案内', situation: '町で道をたずねて案内する', goal: 'You are lost and looking for the station. The goal is reached only after the user gives directions (go straight / turn right / turn left) and you arrive at the station.', missionJa: '駅まで道案内しよう！（まっすぐ・右・左）', greeting: { en: 'Excuse me. Where is the station?', ja: 'すみません、駅はどこ？' } },
  { id: 'g5-u6', label: '5年 U6 レストラン注文', situation: 'レストランで食べ物や飲み物を注文する', goal: 'You are a cashier. The goal is reached only after the user orders food and/or drink, hears the price, and pays or says thank you/goodbye.', missionJa: 'ごはんを注文して、お会計までしよう！', greeting: { en: 'What would you like?', ja: '何にする？' } },
  { id: 'g5-u7', label: '5年 U7 行きたい場所', situation: '行きたい場所とその理由を話す', goal: 'The goal is reached only after the user has said where they want to go AND given a reason (because ...).', missionJa: '行きたい場所と、その理由をつたえよう！', greeting: { en: 'Where do you want to go?', ja: 'どこに行きたい？' } },
  { id: 'g5-u8', label: '5年 U8 ヒーロー', situation: '自分のヒーローについて紹介する', goal: 'The goal is reached only after the user has told you who their hero is AND why (what the hero can do or is good at).', missionJa: '自分のヒーローと、その理由をしょうかいしよう！', greeting: { en: 'Who is your hero?', ja: 'あなたのヒーローは誰？' } },
  { id: 'g6-u1', label: '6年 U1 自己紹介', situation: 'はじめて会った人に自己紹介する', goal: 'The goal is reached only after the user has told you their name AND one thing they can do.', missionJa: '名前と、できることをしょうかいしよう！', greeting: { en: "Hi! I'm Jordan. What can you do?", ja: 'やあ！ジョーダンだよ。何ができる？' } },
  { id: 'g6-u2', label: '6年 U2 一日の生活', situation: '毎日の生活（起きる時間など）を聞き合う', goal: 'The goal is reached only after the user has asked about your daily routine AND told you what time they do something (get up / go to bed, etc.).', missionJa: '毎日の生活（起きる時間など）をたずね合おう！', greeting: { en: 'What time do you get up?', ja: '何時に起きる？' } },
  { id: 'g6-u3', label: '6年 U3 週末のこと', situation: '週末にしたことを話す', goal: 'The goal is reached only after the user has told you TWO things they did on the weekend in the past tense (I went / I played ...).', missionJa: '週末にしたことを2つ伝えよう！（過去形）', greeting: { en: 'How was your weekend?', ja: '週末はどうだった？' } },
  { id: 'g6-u4', label: '6年 U4 行きたい国', situation: '行きたい国と見られるものを話す', goal: 'The goal is reached only after the user has said which country they want to visit AND what they can see or do there.', missionJa: '行きたい国と、そこで見られるものを伝えよう！', greeting: { en: 'Where do you want to go?', ja: 'どこの国に行きたい？' } },
  { id: 'g6-u5', label: '6年 U5 ○○産', situation: '持ち物がどこの国から来たか話す', goal: 'The goal is reached only after the user has said where an item is from using "It\'s from ...".', missionJa: '持ち物がどこの国から来たか伝えよう！', greeting: { en: 'Nice bag! Where is it from?', ja: 'いいかばん！どこ産？' } },
  { id: 'g6-u6', label: '6年 U6 環境', situation: '危機にある動物や環境のためにできることを話す', goal: 'The goal is reached only after the user has named an animal or environmental problem AND said one thing we can do about it.', missionJa: '危機にある動物と、自分たちにできることを伝えよう！', greeting: { en: 'Sea turtles are in danger. What can we do?', ja: 'ウミガメが危ないよ。何ができるかな？' } },
  { id: 'g6-u7', label: '6年 U7 一番の思い出', situation: '小学校の一番の思い出を話す', goal: 'The goal is reached only after the user has told you their best school memory AND what they did, in the past tense.', missionJa: '小学校の一番の思い出を伝えよう！（過去形）', greeting: { en: 'What is your best memory?', ja: '一番の思い出は？' } },
  { id: 'g6-u8', label: '6年 U8 将来の夢', situation: '将来なりたいものとその理由を話す', goal: 'The goal is reached only after the user has said what they want to be AND why.', missionJa: '将来なりたいものと、その理由を伝えよう！', greeting: { en: 'What do you want to be?', ja: '将来何になりたい？' } },
];

const stripSlots = (s: string) => s.replace(/[{}]/g, '');

interface InitOpts {
  situation?: string;
  goal?: string;
  goalLabel?: string;
  greeting?: { en: string; ja: string };
  suggestions?: Suggestion[];
  title?: string;
  histSuffix?: string;
}

// Unit別フリートークを開始するための opts を組み立てる（例文サジェストはダイアログから流用）
const buildUnitOpts = (u: FreetalkUnit): InitOpts => {
  const d = DIALOGUES.find(x => x.id === u.id);
  const suggestions = d ? d.lines.map(l => ({ en: stripSlots(l.en), ja: l.ja })) : undefined;
  return {
    situation: u.situation,
    goal: u.goal,
    goalLabel: `🎯 ミッション：${u.missionJa}`,
    greeting: u.greeting,
    suggestions,
    title: u.label,
    histSuffix: u.id,
  };
};

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
  const goBack = useSafeBack();
  const { geminiApiKey, freetalkGoals } = useAppSettings();
  const studentName = localStorage.getItem('studentName') || 'ゲスト';
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
  const [pendingFreetalk, setPendingFreetalk] = useState(true);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  // 「この会話を記録する」用（記録はオプトイン。班名を入れるとチームの記録になる）
  const [showRecord, setShowRecord] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [recordMsg, setRecordMsg] = useState('');

  // 先生がダッシュボードで編集したUnitゴールがあれば上書きする
  const withGoalOverride = (opts: InitOpts, unitId: string): InitOpts => {
    const ov = freetalkGoals?.[unitId];
    if (!ov) return opts;
    return {
      ...opts,
      goal: ov.goal || opts.goal,
      goalLabel: ov.missionJa ? `🎯 ミッション：${ov.missionJa}` : opts.goalLabel,
    };
  };

  // 今の会話を記録する（班名があればチーム記録＝チーム[CLEAR]の証跡になる）
  const handleRecord = async () => {
    const log = {
      id: `log_${Date.now()}`,
      ts: Date.now(),
      studentId,
      studentName,
      unitId: activeOptsRef.current?.histSuffix || mode || 'freetalk',
      unitTitle: (activeScenario || (mode ? SCENARIOS[mode] : null))?.title || 'AI英会話',
      team: teamName.trim(),
      cleared,
      lines: messages.map(m => ({ role: m.role, text: m.text })),
    };
    const { error } = await saveConversationLog(log);
    setRecordMsg(error ? '記録できなかった…通信を確認してね' : (teamName.trim() ? `班「${teamName.trim()}」の会話を記録したよ！` : '会話を記録したよ！'));
    if (!error) { setShowRecord(false); setTeamName(''); }
    setTimeout(() => setRecordMsg(''), 4000);
  };
  const awardedRef = useRef(false);
  const activeOptsRef = useRef<InitOpts | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = async (selectedMode: keyof typeof SCENARIOS, opts?: InitOpts) => {
    if (!geminiApiKey) return;
    // 基本シナリオに、Unit別フリートーク等の上書きを適用した「実シナリオ」を作る
    const base = SCENARIOS[selectedMode];
    const scenario: Scenario = {
      ...base,
      goal: opts?.goal || base.goal,
      goalLabel: opts?.goalLabel || base.goalLabel,
      greeting: opts?.greeting || base.greeting,
      suggestions: opts?.suggestions || base.suggestions,
      title: opts?.title || base.title,
    };
    setActiveScenario(scenario);
    activeOptsRef.current = opts;
    setMode(selectedMode);
    setPendingFreetalk(false);
    setCleared(false);
    awardedRef.current = false;
    setShowHelp(false);

    const histKey = `ai_hist_${studentId}_${selectedMode}_${opts?.histSuffix || 'default'}`;
    const savedHist = localStorage.getItem(histKey);
    let pastMessages: ChatMessage[] = [];
    if (savedHist) {
      try { pastMessages = JSON.parse(savedHist); } catch (e) {}
    }
    setMessages(pastMessages);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
      const data = await response.json();
      const flashModels = data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash'))
        .map((m: any) => m.name.replace('models/', ''))
        .sort((a: string, b: string) => b.localeCompare(a));
      // コスト固定のため、安価で十分な品質の flash-lite を優先。使えない/混雑時は従来どおり新しいflashへフォールバック。
      const PREFERRED = ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.0-flash-lite'];
      const availableModels = [
        ...PREFERRED.filter(m => flashModels.includes(m)),
        ...flashModels.filter((m: string) => !PREFERRED.includes(m)),
      ];

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

      const situationLine = opts?.situation && opts.situation.trim()
        ? `The user set this situation (in Japanese): 「${opts.situation.trim()}」. Play along with this situation.`
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

    // トーク中は日本語NG。日本語が含まれていたら送らず（ポイントも消費せず）英語をうながす。
    if (/[぀-ヿ㐀-鿿]/.test(text)) {
      setMessages(prev => [...prev, { role: 'model', text: 'English, please! 英語で話してみよう。こまったら 💡ヘルプ を見てね。' }]);
      setShowHelp(true);
      speak('In English, please!');
      return;
    }

    // 1日のAI会話の上限に達していたら、Gemini を呼ばずに止める（課金の安全装置）。
    if (isOverCap('gemini')) {
      setMessages(prev => [...prev, { role: 'model', text: '今日はここまで！🌙 AIとのおしゃべりは1日のじょうげんに達したよ。また明日ね！' }]);
      return;
    }

    const ok = await consumePoints(MESSAGE_COST);
    if (!ok) { alert(`ポイントが足りないよ！（${MESSAGE_COST}P ひつよう）`); return; }

    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    setTranscript(''); setInputText(''); setShowHelp(false); setIsAiThinking(true);

    const histKey = `ai_hist_${studentId}_${mode}_${activeOptsRef.current?.histSuffix || 'default'}`;
    try {
      incUsage('gemini'); // Geminiを実際に呼ぶので1回ぶん計上する
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
          <Button variant="outline" onClick={goBack} icon={ArrowLeft}>もどる</Button>
          <h2 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0, marginRight: '80px' }}>🤖 AIと英語で話そう！</h2>
        </div>
        {/* 教科書のUnitから場面をえらぶ */}
        <div className="glass-card flex-col gap-md" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>📖 教科書のUnitから場面をえらぶ</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>そのUnitの表現を使って、AIと会話の練習ができるよ。</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem' }}>
            {FREETALK_UNITS.map(u => (
              <button key={u.id} className="hover-scale"
                onClick={() => initChat('freetalk', withGoalOverride(buildUnitOpts(u), u.id))}
                style={{ padding: '0.7rem', borderRadius: '10px', border: '2px solid var(--color-primary)', background: 'white', color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'center' }}>
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* 自由に場面を決める */}
        <div className="glass-card flex-col gap-md" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>✏️ 自由に場面を決める（日本語OK・なくてもOK）</h3>
          <textarea
            value={situationInput}
            onChange={e => setSituationInput(e.target.value)}
            placeholder="（れい）休み時間に、すきなスポーツの話をする"
            style={{ width: '100%', minHeight: '70px', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }}
          />
          <Button size="lg" onClick={() => initChat('freetalk', { situation: situationInput })} icon={Sparkles} style={{ background: 'var(--color-accent)', color: 'black' }}>
            この場面ではじめる！
          </Button>
          <Button variant="outline" onClick={() => initChat('freetalk', {})}>場面なしではじめる</Button>
        </div>
      </div>
    );
  }

  // mode未選択のときは必ず上の「場面えらび」画面を表示しているので、ここは型ガード兼フォールバック
  if (!mode) {
    return null;
  }

  const scenario = activeScenario || SCENARIOS[mode];

  return (
    <div className="flex-col" style={{ height: '100%', maxHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant="outline" onClick={() => { setMode(null); setMessages([]); setPendingFreetalk(true); }} icon={ArrowLeft}>もどる</Button>
        <h2 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '1.3rem' }}>{scenario.emoji} {scenario.title}</h2>
        <Button variant="outline" onClick={() => setShowTranslation(t => !t)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.7rem' }} icon={Languages}>
          {showTranslation ? '訳オフ' : '訳オン'}
        </Button>
        <Button variant="outline" onClick={() => { if (window.confirm('会話をリセットして最初からやり直しますか？')) { localStorage.removeItem(`ai_hist_${studentId}_${mode}_${activeOptsRef.current?.histSuffix || 'default'}`); initChat(mode, activeOptsRef.current); } }} style={{ fontSize: '0.8rem', padding: '0.4rem' }}>リセット</Button>
        <Button variant="outline" onClick={() => setShowRecord(s => !s)} style={{ fontSize: '0.8rem', padding: '0.4rem' }} disabled={messages.length === 0}>📝 記録</Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
          <Coins size={18} color="#FFD700" />{totalPoints} P
        </div>
      </div>

      {/* 会話を記録（オプトイン。班名を入れるとチームの記録＝チーム[CLEAR]の証跡に） */}
      {showRecord && (
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '0.7rem 1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#4338ca', fontWeight: 'bold' }}>この会話を先生に記録：</span>
          <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="班名（個人なら空でOK）"
            style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', border: '2px solid #c7d2fe', fontSize: '0.9rem' }} />
          <Button onClick={handleRecord} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{cleared ? '✅ クリアを記録' : '記録する'}</Button>
          <Button variant="outline" onClick={() => setShowRecord(false)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>やめる</Button>
        </div>
      )}
      {recordMsg && <div style={{ color: recordMsg.includes('記録した') ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' }}>{recordMsg}</div>}

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
