import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from '../../ui/Button';
import { useAppSettings } from '../../../hooks/useAppSettings';
import { usePoints } from '../../../hooks/usePoints';
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { usePronunciationAssessment } from '../../../hooks/usePronunciationAssessment';
import { usePronunciationHistory } from '../../../hooks/usePronunciationHistory';
import { useDictionaryProgress } from '../../../hooks/useDictionaryProgress';
import { MicButton } from '../../ui/MicButton';
import { useVocabulary } from '../../../hooks/useVocabulary';
import type { Vocabulary } from '../../../data/vocabulary';
import { SAFETY_INSTRUCTION, isInappropriate } from '../../../lib/contentFilter';
import { isOverCap, incUsage } from '../../../lib/apiUsage';
import { useSafeBack } from '../../../hooks/useSafeBack';
import { getPreferredVoice } from '../../../lib/voice';

type GameState = 'config' | 'generating' | 'playing' | 'completed';

interface StoryFragment {
  type: 'text' | 'blank' | 'newline';
  content: string;
  wordId?: string;
  filledWith?: string; // wordId
}

const DIFFICULTY_LEVELS = [
  { level: 1, label: 'レベル1: 超かんたん (小学1〜3年生)', prompt: 'Extremely simple English for beginners. Use ONLY short SVO (Subject-Verb-Object) or SVC sentences (max 5-6 words). Ensure the sentences connect logically to tell a cohesive, easy-to-understand mini-story.' },
  { level: 2, label: 'レベル2: 英検5級レベル (中1程度)', prompt: 'Eiken Grade 5 level (CEFR A1). Basic beginner English, simple present/past tense, very basic vocabulary.' },
  { level: 3, label: 'レベル3: 英検4級レベル (中2程度)', prompt: 'Eiken Grade 4 level (CEFR A1-A2). Elementary English, basic conjunctions, future tense, basic daily life vocabulary.' },
  { level: 4, label: 'レベル4: 英検3級レベル (中卒程度)', prompt: 'Eiken Grade 3 level (CEFR A2). Pre-intermediate English, present perfect, relative pronouns, standard middle school vocabulary.' },
  { level: 5, label: 'レベル5: 英検2級レベル (高卒程度)', prompt: 'Eiken Grade 2 level (CEFR B1). Intermediate English, complex sentences, high school level vocabulary, social topics.' },
  { level: 6, label: 'レベル6: 英検1級レベル (大学上級程度)', prompt: 'Eiken Grade 1 level (CEFR C1). Highly advanced English, sophisticated vocabulary, complex grammar, academic or abstract concepts.' },
];

// 音読の合格ライン（Azure発音判定の総合スコア 0-100）。小学生向けにやさしめ。
const READ_PASS_SCORE = 60;

export const StoryMode: React.FC = () => {
  const navigate = useNavigate();
  const goBack = useSafeBack();
  const vocabulary = useVocabulary();
  const { geminiApiKey, azureSpeechKey, azureSpeechRegion } = useAppSettings();
  const { addPoints } = usePoints();
  const { speak } = useSpeechSynthesis();
  const { progress } = useDictionaryProgress();
  const {
    assess,
    isAssessing,
    isAvailable: azureAvailable,
    lastRecordingUrl,
  } = usePronunciationAssessment(azureSpeechKey, azureSpeechRegion);
  const { addScore } = usePronunciationHistory();
  // 音読のAzureスコア（表示用）
  const [readScore, setReadScore] = useState<number | null>(null);

  const [gameState, setGameState] = useState<GameState>('config');
  const [difficulty, setDifficulty] = useState(1);
  const [sentenceCount, setSentenceCount] = useState(3);
  
  const [storyFragments, setStoryFragments] = useState<StoryFragment[]>([]);
  const [targetWords, setTargetWords] = useState<Vocabulary[]>([]);
  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);
  const [japaneseTranslation, setJapaneseTranslation] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [wordTip, setWordTip] = useState<{ word: string; ja: string } | null>(null);
  
  const { transcript, isRecording, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const [hasReadAloud, setHasReadAloud] = useState(false);
  const [storySentences, setStorySentences] = useState<string[]>([]);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
  const [readAloudFeedback, setReadAloudFeedback] = useState<'success' | 'fail' | null>(null);

  const normalizeText = (text: string) => text.toLowerCase().replace(/[.,!?'" ]/g, '').trim();

  const giveReadAloudBonus = () => {
    const bonus = sentenceCount * difficulty * 3;
    addPoints('story_mode_reading', { multiplier: bonus / 10 });
    setHasReadAloud(true);
  };

  // Web Speech APIでの音読判定はAzure未設定のときだけ動かす（文字が大体合っているか）。
  // ボーナス取得後も「れんしゅう」として判定は出すが、ポイントは一度だけ。
  useEffect(() => {
    if (!azureAvailable && !isRecording && transcript && gameState === 'completed' && selectedSentenceIndex !== null) {
      const targetSentence = storySentences[selectedSentenceIndex];
      const normInput = normalizeText(transcript);
      const normTarget = normalizeText(targetSentence);

      // Check if they are somewhat similar (e.g., includes or > 70% match or simple inclusion)
      // For leniency, if it includes a significant portion or vice versa
      const isCorrect = normInput === normTarget || normInput.includes(normTarget) || normTarget.includes(normInput) ||
                        (normInput.length > normTarget.length * 0.6 && normTarget.includes(normInput.slice(0, normTarget.length * 0.6)));

      if (isCorrect) {
        setReadAloudFeedback('success');
        if (!hasReadAloud) giveReadAloudBonus();
      } else {
        setReadAloudFeedback('fail');
      }
    }
  }, [azureAvailable, isRecording, transcript, gameState, hasReadAloud, selectedSentenceIndex, storySentences]);

  // Azureの発音採点で音読を1回チャレンジする（Azure設定があるときのみ）。
  const handleAzureRead = async () => {
    if (selectedSentenceIndex === null || isAssessing) return;
    const targetSentence = storySentences[selectedSentenceIndex];
    const result = await assess(targetSentence);
    if (!result) return; // 通信エラー等。ノーカウントで再挑戦。

    setReadScore(result.pronunciationScore);
    setTranscript(result.recognizedText);
    addScore('story', result.pronunciationScore, targetSentence);

    if (result.pronunciationScore >= READ_PASS_SCORE) {
      setReadAloudFeedback('success');
      if (!hasReadAloud) giveReadAloudBonus(); // ボーナスは一度だけ
    } else {
      setReadAloudFeedback('fail');
    }
  };

  // Pick mastered words based on progress
  const getMasteredWords = () => {
    const masteredCategories = Object.keys(progress).filter(cat => 
      progress[cat].spelling || progress[cat].wordsearch || progress[cat].practice
    );
    
    let pool = vocabulary.filter(v => masteredCategories.includes(v.category));
    if (pool.length < 5) {
      // Fallback if not enough mastered words
      pool = vocabulary; 
    }
    
    // Pick random words depending on length
    const wordCount = Math.min(pool.length, Math.max(3, Math.floor(sentenceCount / 2)));
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, wordCount);
  };

  const generateStory = async () => {
    if (!geminiApiKey) return;
    // 1日のお話づくり（AI生成）の上限に達していたら止める（課金の安全装置）。
    if (isOverCap('gemini')) {
      alert('今日のお話づくりは1日のじょうげんに達したよ。また明日つくろうね！');
      return;
    }
    setGameState('generating');
    setHasReadAloud(false);
    setTranscript('');
    
    const wordsToUse = getMasteredWords();
    setTargetWords(wordsToUse);
    const wordListEn = wordsToUse.map(w => w.english);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
      const data = await response.json();
      
      const flashModels = data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash'))
        .map((m: any) => m.name.replace('models/', ''))
        .sort((a: string, b: string) => b.localeCompare(a)); // Sort descending to try newer models first
      // コスト固定のため flash-lite を優先。使えない/混雑時は従来どおり新しいflashへフォールバック。
      const PREFERRED = ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.0-flash-lite'];
      const availableModels = [
        ...PREFERRED.filter(m => flashModels.includes(m)),
        ...flashModels.filter((m: string) => !PREFERRED.includes(m)),
      ];

      const genAI = new GoogleGenerativeAI(geminiApiKey);

      const prompt = `You are writing an interactive English story for a Japanese student.
      
RULES:
1. The story MUST be exactly ${sentenceCount} sentences long.
2. Output EACH sentence on a NEW LINE.
3. The sentences MUST connect logically to form a clear, cohesive narrative. Do NOT just write disconnected sentences. The story must make sense as a whole.
4. CRITICAL: Provide STRONG CONTEXT CLUES so that there is ONLY ONE logically correct target word for each blank. Do NOT make the words interchangeable (e.g. avoid "I eat {apple}" and "I eat {banana}").
5. The difficulty level is: ${DIFFICULTY_LEVELS[difficulty - 1].prompt}
6. You MUST include these specific words in the story: ${wordListEn.join(', ')}
7. Whenever you use one of those specific words, you MUST enclose it in curly braces, exactly as provided. Example: {${wordListEn[0]}}
8. Do NOT use curly braces for any other words.
9. Output the English story text first. Then write exactly "---" on a new line. Then provide the natural Japanese translation of the story, also with each sentence on a new line.

${SAFETY_INSTRUCTION}`;

      let text = '';
      let success = false;
      let lastError: any = null;

      for (const modelName of availableModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          incUsage('gemini'); // Geminiを実際に呼ぶので1回ぶん計上する
          const result = await model.generateContent(prompt);
          text = result.response.text();
          success = true;
          console.log(`Successfully generated using ${modelName}`);
          break;
        } catch (e: any) {
          console.warn(`Model ${modelName} failed:`, e);
          lastError = e;
        }
      }

      if (!success) {
        throw lastError || new Error("利用可能なモデルが見つかりませんでした");
      }
      
      // 安全装置：万一不適切な内容が生成されたら、表示せずに作り直しを促す。
      if (isInappropriate(text)) {
        alert('うまく作れませんでした。もう一度「おはなしをつくる」を押してみてね。');
        setGameState('config');
        return;
      }

      const parts = text.split('---');
      const englishText = parts[0].trim();
      const japaneseText = parts.length > 1 ? parts[1].trim() : '';
      
      setJapaneseTranslation(japaneseText);
      setShowTranslation(false);
      parseStory(englishText, wordsToUse);
      setGameState('playing');
    } catch (err: any) {
      console.error(err);
      alert(`システムエラー: ${err.message || '不明なエラー'} (APIキーが正しいか、制限されていないか確認してください)`);
      setGameState('config');
    }
  };

  const parseStory = (text: string, words: Vocabulary[]) => {
    // Regex to split by {word}
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const fragments: StoryFragment[] = [];
    
    lines.forEach((line, lineIdx) => {
      const parts = line.split(/(\{.*?\})/g);
      
      parts.forEach(part => {
        if (part.startsWith('{') && part.endsWith('}')) {
          const wordText = part.slice(1, -1).toLowerCase().trim();
          const matchedWord = words.find(w => w.english.toLowerCase() === wordText);
          if (matchedWord) {
            fragments.push({ type: 'blank', content: wordText, wordId: matchedWord.id });
          } else {
            // If AI hallucinated a braced word, just treat it as text
            fragments.push({ type: 'text', content: part.replace(/[{}]/g, '') });
          }
        } else if (part) {
          fragments.push({ type: 'text', content: part });
        }
      });
      
      if (lineIdx < lines.length - 1) {
        fragments.push({ type: 'newline', content: '' });
      }
    });
    
    setStoryFragments(fragments);
    
    // Auto-select the first blank
    const firstBlankIndex = fragments.findIndex(f => f.type === 'blank');
    if (firstBlankIndex !== -1) {
      setActiveBlankIndex(firstBlankIndex);
    }
  };

  const handleBlankClick = (index: number) => {
    if (gameState !== 'playing') return;
    
    // If clicking a filled blank, clear it so user can choose again
    const newFragments = [...storyFragments];
    if (newFragments[index].filledWith) {
      newFragments[index].filledWith = undefined;
      setStoryFragments(newFragments);
    }
    
    setActiveBlankIndex(index);
  };

  const handleWordSelect = (wordId: string) => {
    if (activeBlankIndex === null) return;
    
    const newFragments = [...storyFragments];
    newFragments[activeBlankIndex].filledWith = wordId;
    setStoryFragments(newFragments);
    
    // Check if completed
    const allBlanks = newFragments.filter(f => f.type === 'blank');
    const isCompleted = allBlanks.every(f => f.filledWith);
    
    if (isCompleted) {
      const isCorrect = allBlanks.every(f => f.filledWith === f.wordId);
      if (isCorrect) {
        setActiveBlankIndex(null);
        handleWin(newFragments);
      } else {
        // Do not use timeouts to clear blanks automatically as it causes overlapping state bugs.
        // Instead, find the first incorrect blank and set it as active so the user can choose again.
        const firstIncorrect = newFragments.findIndex(f => f.type === 'blank' && f.filledWith !== f.wordId);
        if (firstIncorrect !== -1) {
          setActiveBlankIndex(firstIncorrect);
        }
      }
    } else {
      // Auto-select the next unfilled blank
      const nextBlankIndex = newFragments.findIndex((f, idx) => idx > activeBlankIndex && f.type === 'blank' && !f.filledWith);
      if (nextBlankIndex !== -1) {
        setActiveBlankIndex(nextBlankIndex);
      } else {
        // If no more blanks after this one, wrap around to the beginning
        const firstUnfilledIndex = newFragments.findIndex(f => f.type === 'blank' && !f.filledWith);
        setActiveBlankIndex(firstUnfilledIndex !== -1 ? firstUnfilledIndex : null);
      }
    }
  };

  const handleWin = (fragments: StoryFragment[]) => {
    setGameState('completed');
    // Calculate points based on difficulty and length
    const earned = sentenceCount * difficulty * 2;
    addPoints('story_mode', { multiplier: earned / 10 }); // scale points
    
    // Construct full text to speak
    const fullText = fragments.map(f => f.type === 'blank' ? targetWords.find(w => w.id === f.wordId)?.english : f.content).join('');
    speak(fullText);

    const sentences: string[] = [];
    let current = '';
    fragments.forEach(f => {
      if (f.type === 'newline') {
         if (current.trim()) sentences.push(current.trim());
         current = '';
      } else {
         current += f.type === 'blank' ? targetWords.find(w => w.id === f.wordId)?.english : f.content;
      }
    });
    if (current.trim()) sentences.push(current.trim());
    setStorySentences(sentences);
  };

  // 単語の訳を辞書（Picture Dictionary）から引く（あれば）
  const jaForWord = (w: string): string | null => {
    const key = w.toLowerCase().replace(/[.,!?'"]/g, '').trim();
    if (!key) return null;
    const v = vocabulary.find(x => x.english.toLowerCase() === key);
    return v ? v.japanese : null;
  };

  // 単語タップ：発音を聞く＋訳をふきだし表示
  const handleWordTap = (w: string) => {
    const clean = w.replace(/[.,!?]/g, '');
    if (clean) speak(clean);
    const ja = jaForWord(clean);
    setWordTip(ja ? { word: clean, ja } : null);
  };

  // 文を読み上げる。穴埋め部分は無音（少し間をあける）。
  const speakSentenceWithGaps = (parts: { f: StoryFragment; idx: number }[]) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const segments: ({ kind: 'speak'; text: string } | { kind: 'gap' })[] = [];
    let buf = '';
    parts.forEach(({ f }) => {
      if (f.type === 'text') buf += f.content;
      else if (f.type === 'blank') {
        if (buf.trim()) { segments.push({ kind: 'speak', text: buf }); buf = ''; }
        segments.push({ kind: 'gap' }); // 穴埋め＝無音
      }
    });
    if (buf.trim()) segments.push({ kind: 'speak', text: buf });
    const voice = getPreferredVoice();
    let i = 0;
    const next = () => {
      if (i >= segments.length) return;
      const seg = segments[i++];
      if (seg.kind === 'gap') { setTimeout(next, 700); return; }
      const u = new SpeechSynthesisUtterance(seg.text);
      u.lang = 'en-US'; u.rate = 0.85; if (voice) u.voice = voice;
      u.onend = () => setTimeout(next, 120);
      window.speechSynthesis.speak(u);
    };
    next();
  };

  // 1つのフラグメント（単語/穴埋め）を描画
  const renderFragment = (fragment: StoryFragment, idx: number) => {
    if (fragment.type === 'text') {
      const wordsAndSpaces = fragment.content.split(/(\s+)/);
      return (
        <span key={idx}>
          {wordsAndSpaces.map((ws, i) => {
            if (!ws.trim()) return <span key={i}>{ws}</span>;
            const cleanWord = ws.replace(/[.,!?]/g, '');
            return (
              <span
                key={i}
                onClick={() => handleWordTap(ws)}
                style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                title={jaForWord(cleanWord) ? `${cleanWord}：${jaForWord(cleanWord)}（クリックで発音＆訳）` : 'クリックして発音を聞く'}
              >
                {ws}
              </span>
            );
          })}
        </span>
      );
    }
    // blank
    const isFilled = !!fragment.filledWith;
    const filledWord = isFilled ? targetWords.find(w => w.id === fragment.filledWith) : null;
    const isCorrect = gameState === 'completed' && fragment.filledWith === fragment.wordId;
    const isError = gameState === 'playing' && isFilled && fragment.filledWith !== fragment.wordId;
    return (
      <span
        key={idx}
        onClick={() => {
          if (isFilled && filledWord) { speak(filledWord.english); setWordTip({ word: filledWord.english, ja: filledWord.japanese }); }
          handleBlankClick(idx);
        }}
        className="animate-pop"
        style={{
          display: 'inline-block', minWidth: '100px', height: '40px', margin: '0 0.5rem',
          borderBottom: isFilled ? 'none' : `3px dashed ${activeBlankIndex === idx ? 'var(--color-primary)' : '#ccc'}`,
          background: isCorrect ? 'var(--color-success)' : isError ? 'var(--color-error)' : isFilled ? 'var(--color-primary)' : 'transparent',
          color: isFilled ? 'white' : 'transparent', borderRadius: isFilled ? '20px' : '0', padding: isFilled ? '0 1rem' : '0',
          textAlign: 'center', cursor: 'pointer', verticalAlign: 'middle', lineHeight: '40px',
          boxShadow: isFilled ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s', position: 'relative'
        }}
      >
        {isFilled ? filledWord?.english : ''}
        {activeBlankIndex === idx && !isFilled && (
          <div className="animate-pulse" style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', fontSize: '1rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
            ここをえらぶ
          </div>
        )}
      </span>
    );
  };

  // フラグメントを文ごとにグループ化（newlineで区切る）。文の訳も対応づけ。
  const sentenceGroups: { f: StoryFragment; idx: number }[][] = [];
  { let cur: { f: StoryFragment; idx: number }[] = [];
    storyFragments.forEach((f, idx) => {
      if (f.type === 'newline') { if (cur.length) { sentenceGroups.push(cur); cur = []; } }
      else cur.push({ f, idx });
    });
    if (cur.length) sentenceGroups.push(cur);
  }
  const jaLines = japaneseTranslation.split('\n').map(l => l.trim().replace(/[{}]/g, '')).filter(Boolean);

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

  return (
    <div className="flex-col" style={{ flex: 1, paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <Button variant="outline" onClick={goBack} icon={ArrowLeft}>もどる</Button>
        <h1 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0 }}>📖 AIおはなしづくり</h1>
        <div style={{ width: '80px' }}></div>
      </div>

      {gameState === 'config' && (
        <div className="glass-card flex-col gap-lg" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ textAlign: 'center', margin: 0 }}>どんなおはなしをつくる？</h2>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>文章の長さ（{sentenceCount}文）</label>
            <input 
              type="range" 
              min="3" 
              max="10" 
              value={sentenceCount} 
              onChange={e => setSentenceCount(Number(e.target.value))}
              style={{ width: '100%', marginBottom: '1rem', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
              <span>短い (3文)</span>
              <span>長い (10文)</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>難易度</label>
            <select 
              value={difficulty} 
              onChange={e => setDifficulty(Number(e.target.value))}
              style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              {DIFFICULTY_LEVELS.map(lvl => (
                <option key={lvl.level} value={lvl.level}>{lvl.label}</option>
              ))}
            </select>
          </div>

          <Button 
            size="lg" 
            onClick={generateStory} 
            icon={Sparkles}
            style={{ marginTop: '1rem', background: 'var(--color-accent)', color: 'black' }}
          >
            おはなしをつくる！
          </Button>
        </div>
      )}

      {gameState === 'generating' && (
        <div className="flex-col flex-center gap-md" style={{ flex: 1 }}>
          <Sparkles className="animate-pulse" size={60} color="var(--color-accent)" />
          <h2 className="text-primary">AIがおはなしを作っています...</h2>
          <p>あなたの習った単語を使っているよ！</p>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'completed') && (
        <div className="flex-col gap-lg" style={{ flex: 1, maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
            {/* ツールバー：単語の訳ふきだし＋文ごとの訳トグル */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.95rem', color: '#475569', minHeight: '1.6rem' }}>
                {wordTip ? <span>📖 <b>{wordTip.word}</b> ＝ {wordTip.ja}</span> : <span style={{ color: '#94a3b8' }}>🔊文ボタンで読み上げ／単語タップで発音＆訳</span>}
              </div>
              <Button variant={showTranslation ? 'primary' : 'outline'} onClick={() => setShowTranslation(t => !t)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
                {showTranslation ? '🇯🇵 訳をかくす' : '🇯🇵 文の訳をみる'}
              </Button>
            </div>

            {/* 文ごとに表示：🔊読み上げ（穴埋めは無音）＋本文＋訳 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {sentenceGroups.map((sent, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', padding: '0.6rem 0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => speakSentenceWithGaps(sent)}
                    className="hover-scale"
                    title="この文を読み上げる（穴埋めは無音）"
                    style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: 'var(--shadow-sm)', marginTop: '0.3rem' }}
                  >
                    🔊
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.4rem', lineHeight: '2.2', fontFamily: 'var(--font-heading)' }}>
                      {sent.map(({ f, idx }) => renderFragment(f, idx))}
                    </div>
                    {showTranslation && jaLines[sIdx] && (
                      <div style={{ fontSize: '1rem', color: '#0891b2', marginTop: '0.2rem' }}>🇯🇵 {jaLines[sIdx]}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {gameState === 'completed' ? (
            <div className="glass-card flex-col flex-center animate-pop" style={{ padding: '2rem', background: '#f0fdf4', border: '2px solid var(--color-success)' }}>
              <CheckCircle size={60} color="var(--color-success)" />
              <h2 style={{ color: 'var(--color-success)', margin: '1rem 0' }}>Perfect! おはなしが完成したよ！</h2>
              
              {hasReadAloud && (
                <div className="animate-pop" style={{ background: '#fffbeb', padding: '0.8rem 1.5rem', borderRadius: '20px', color: '#b45309', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem', border: '2px solid #fde68a' }}>
                  🎉 音読ボーナスポイント獲得ずみ！
                </div>
              )}

              {(
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)', width: '100%' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>🎤 声に出して読んでみよう！</h3>
                  <p style={{ color: '#666', margin: 0, textAlign: 'center' }}>
                    {hasReadAloud
                      ? '好きな文を選んで、何度でも発音練習できるよ！🔈で見本も聞けるよ。'
                      : '読みたい文を選んでから、マイクを押して読んでみてね。上手に読めたらボーナスポイント！'}
                  </p>

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1rem 0', padding: '1rem', background: '#f8f9fa', borderRadius: '12px' }}>
                    {storySentences.map((sentenceText, sIdx) => (
                      <div 
                        key={sIdx} 
                        onClick={() => setSelectedSentenceIndex(sIdx)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '1rem', 
                          padding: '0.8rem', borderRadius: '8px', cursor: 'pointer',
                          background: selectedSentenceIndex === sIdx ? 'rgba(0, 184, 148, 0.1)' : 'transparent',
                          border: selectedSentenceIndex === sIdx ? '2px solid var(--color-primary)' : '2px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); speak(sentenceText); }}
                          className="hover-scale"
                          style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}
                        >
                          🔈
                        </button>
                        <span style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: '#333' }}>
                          {sentenceText}
                        </span>
                      </div>
                    ))}
                  </div>

                  {azureAvailable && readScore !== null && (
                    <div
                      className="animate-pop"
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        color: readScore >= READ_PASS_SCORE ? 'var(--color-success)' : 'var(--color-error)'
                      }}
                    >
                      音読スコア: {Math.round(readScore)} 点 {readScore >= READ_PASS_SCORE ? '✅' : '（もう一回！）'}
                    </div>
                  )}

                  {readAloudFeedback === 'fail' && !isRecording && !isAssessing && transcript && (
                    <div style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>
                      ❌ もう少し！もう一度チャレンジしてね。
                    </div>
                  )}

                  {transcript && (
                    <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid var(--color-success)', borderRadius: '8px', color: '#444', fontStyle: 'italic', width: '100%', textAlign: 'center' }}>
                      あなたの声: 「 {transcript} 」
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <MicButton
                      isRecording={azureAvailable ? isAssessing : isRecording}
                      disabled={selectedSentenceIndex === null || (azureAvailable && isAssessing)}
                      onClick={() => {
                        if (selectedSentenceIndex === null) {
                          alert('まずは読みたい文をえらんでね！');
                          return;
                        }
                        if (azureAvailable) {
                          setTranscript('');
                          setReadScore(null);
                          setReadAloudFeedback(null);
                          handleAzureRead();
                          return;
                        }
                        if (isRecording) {
                          stopListening();
                        } else {
                          setTranscript('');
                          setReadAloudFeedback(null);
                          startListening();
                        }
                      }}
                    />
                    {azureAvailable && lastRecordingUrl && !isAssessing && (
                      <button
                        onClick={() => new Audio(lastRecordingUrl).play()}
                        title="さっきの自分の声を聞く"
                        className="hover-scale"
                        style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--color-primary)', background: 'white', color: 'var(--color-primary)', fontSize: '1.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  {selectedSentenceIndex === null && (
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>※上の文をタップしてえらんでね</div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <Button onClick={() => setGameState('config')}>もう一度遊ぶ</Button>
                <Button variant="outline" onClick={() => speak(storyFragments.map(f => f.type === 'blank' ? targetWords.find(w => w.id === f.wordId)?.english : f.content).join(''))}>
                  🔈 もう一度聞く
                </Button>
              </div>
              
              {japaneseTranslation && (
                <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(255,255,255,0.8)', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>🇯🇵 おはなしの意味</h3>
                    <Button variant="outline" onClick={() => setShowTranslation(!showTranslation)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                      {showTranslation ? 'かくす' : '意味を見る'}
                    </Button>
                  </div>
                  {showTranslation && (
                    <div className="animate-pop" style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#444', whiteSpace: 'pre-wrap' }}>
                      {japaneseTranslation}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginTop: 0, textAlign: 'center' }}>下から単語を選んでね</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                {targetWords.map(word => {
                  const isUsed = storyFragments.some(f => f.type === 'blank' && f.filledWith === word.id);
                  return (
                    <button
                      key={word.id}
                      onClick={() => {
                        if (!isUsed) speak(word.english);
                        handleWordSelect(word.id);
                      }}
                      disabled={isUsed || activeBlankIndex === null}
                      className="hover-scale"
                      style={{
                        padding: '1rem 1.5rem',
                        fontSize: '1.2rem',
                        borderRadius: '20px',
                        border: '2px solid var(--color-primary)',
                        background: isUsed ? '#f0f0f0' : 'white',
                        color: isUsed ? '#ccc' : 'var(--color-primary)',
                        cursor: isUsed || activeBlankIndex === null ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: isUsed ? 0.5 : 1
                      }}
                    >
                      <span>{word.emoji}</span>
                      <span>{word.english}</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>({word.japanese})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
