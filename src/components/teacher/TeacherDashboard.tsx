import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowLeft, Key, Save, Mic, Target, Gauge } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { setCap, getUsage, DEFAULT_CAP } from '../../lib/apiUsage';
import { DIALOGUES } from '../dialogue/dialogueData';
import { DEFAULT_QUIZZES } from '../textbook/textbookQuizData';
import { stages } from '../../data/stages';
import { FREETALK_UNITS } from '../dictionary/games/AIAssistant';
import { fetchConversationLogs, type ConversationLog } from '../../lib/conversationLogs';
import { saveTeacherFeedback } from '../../lib/teacherFeedback';
import { WORLD_BENTO_QUIZZES } from '../textbook/worldBentoQuizData';

// 今日のミッションに設定できる候補（ダイアログ＋教科書の全Unit）
interface MissionOption { label: string; route: string; videoUrl?: string }
const MISSION_OPTIONS: MissionOption[] = [
  ...DIALOGUES.map(d => ({
    label: `ダイアログ ${d.grade}年 ${d.unitName.replace(/:.*/, '')}`,
    route: `/dialogue?grade=${d.grade}&id=${d.id}`,
  })),
  ...DEFAULT_QUIZZES.map(q => ({
    label: `教科書 ${q.grade}年 ${q.unitName.replace(/:.*/, '')}`,
    route: `/textbook?grade=${q.grade}&id=${q.id}`,
    videoUrl: q.url,
  })),
];

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [geminiKey, setGeminiKey] = useState('');
  const [azureKey, setAzureKey] = useState('');
  const [azureRegion, setAzureRegion] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [azureSaveStatus, setAzureSaveStatus] = useState('');
  const [azureIsError, setAzureIsError] = useState(false);
  const [showAzureKey, setShowAzureKey] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [customVocabEnabled, setCustomVocabEnabled] = useState(false);
  // AI英会話：Unitゴールの上書き（{id:{goal,missionJa}}）と保存メッセージ
  const [freetalkGoals, setFreetalkGoals] = useState<Record<string, { goal?: string; missionJa?: string }>>({});
  const [goalSaveMsg, setGoalSaveMsg] = useState('');
  // AI英会話：記録された会話ログ
  const [convLogs, setConvLogs] = useState<ConversationLog[] | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  // ふりかえりへの先生コメント/スタンプの下書き（reflectionIdごと）と保存中フラグ
  const [fbDrafts, setFbDrafts] = useState<Record<string, { comment: string; stamp: string }>>({});
  const [fbSavingId, setFbSavingId] = useState<string | null>(null);
  const STAMPS = ['👍', '🌟', '💯', '😊', '🎉', '🔥'];
  const [students, setStudents] = useState<any[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentView, setStudentView] = useState<'byStudent' | 'byDate' | 'map'>('byStudent');
  const [missionRoute, setMissionRoute] = useState('');
  const [missionStatus, setMissionStatus] = useState('');
  const [currentMission, setCurrentMission] = useState<MissionOption | null>(null);
  // 1日あたりのAPI利用上限（0以下＝無制限）。この端末の今日の利用数も参考表示する。
  const [geminiCap, setGeminiCap] = useState<number>(DEFAULT_CAP.gemini);
  const [azureCap, setAzureCap] = useState<number>(DEFAULT_CAP.azure);
  const [capStatus, setCapStatus] = useState('');

  // Handle PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '7777') {
      setIsAuthenticated(true);
      fetchSettings();
    } else {
      alert('PINが違います');
      setPin('');
    }
  };

  const fetchSettings = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('students')
      .select('dictionary_progress')
      .eq('id', 'app_settings_v1')
      .single();
      
    if (data && data.dictionary_progress) {
      if (data.dictionary_progress.geminiApiKey) {
        setGeminiKey(data.dictionary_progress.geminiApiKey);
      }
      if (data.dictionary_progress.azureSpeechKey) {
        setAzureKey(data.dictionary_progress.azureSpeechKey);
      }
      if (data.dictionary_progress.azureSpeechRegion) {
        setAzureRegion(data.dictionary_progress.azureSpeechRegion);
      }
      if (data.dictionary_progress.isScreenLocked !== undefined) {
        setIsScreenLocked(data.dictionary_progress.isScreenLocked);
      }
      if (data.dictionary_progress.customVocabEnabled !== undefined) {
        setCustomVocabEnabled(data.dictionary_progress.customVocabEnabled);
      }
      if (data.dictionary_progress.freetalkGoals !== undefined) {
        setFreetalkGoals(data.dictionary_progress.freetalkGoals || {});
      }
      if (data.dictionary_progress.todayMission) {
        setCurrentMission(data.dictionary_progress.todayMission);
        setMissionRoute(data.dictionary_progress.todayMission.route || '');
      }
      if (data.dictionary_progress.geminiDailyCap !== undefined) {
        setGeminiCap(data.dictionary_progress.geminiDailyCap);
        setCap('gemini', data.dictionary_progress.geminiDailyCap);
      }
      if (data.dictionary_progress.azureDailyCap !== undefined) {
        setAzureCap(data.dictionary_progress.azureDailyCap);
        setCap('azure', data.dictionary_progress.azureDailyCap);
      }
    }

    // Fetch students data
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .neq('id', 'app_settings_v1')
      .neq('id', 'conversation_logs_v1') // 会話ログ用の行は生徒一覧から除外
      .order('last_access', { ascending: false });
      
    if (studentsData) {
      setStudents(studentsData);
    }
  };

  // Saves the full settings object so individual saves/toggles never wipe other fields.
  const persistSettings = async (overrides: Record<string, any> = {}) => {
    if (!supabase) return { error: new Error('no supabase') };
    return supabase
      .from('students')
      .upsert({
        id: 'app_settings_v1',
        name: 'System Settings',
        dictionary_progress: {
          geminiApiKey: geminiKey.trim(),
          azureSpeechKey: azureKey.trim(),
          azureSpeechRegion: azureRegion.trim(),
          isScreenLocked: isScreenLocked,
          todayMission: currentMission,
          geminiDailyCap: geminiCap,
          azureDailyCap: azureCap,
          customVocabEnabled: customVocabEnabled,
          freetalkGoals: freetalkGoals,
          ...overrides
        }
      }, { onConflict: 'id' });
  };

  const handleSetMission = async () => {
    // 空（「ミッションなし」）を選んだ場合は解除として扱う
    const opt = MISSION_OPTIONS.find(o => o.route === missionRoute) || null;
    setCurrentMission(opt);
    const { error } = await persistSettings({ todayMission: opt });
    if (error) setMissionStatus('通信エラー');
    else setMissionStatus(opt ? `設定しました：${opt.label}` : 'ミッションなしにしました');
    setTimeout(() => setMissionStatus(''), 4000);
  };

  const handleClearMission = async () => {
    setCurrentMission(null);
    setMissionRoute('');
    const { error } = await persistSettings({ todayMission: null });
    setMissionStatus(error ? '通信エラー' : 'ミッションを解除しました');
    setTimeout(() => setMissionStatus(''), 4000);
  };

  const handleSaveGoals = async () => {
    const { error } = await persistSettings({ freetalkGoals });
    setGoalSaveMsg(error ? '通信エラー' : 'ゴールを保存しました');
    setTimeout(() => setGoalSaveMsg(''), 4000);
  };

  // ふりかえり1件に先生コメント/スタンプを保存し、画面にも即反映
  const handleSaveFeedback = async (studentId: string, ref: any) => {
    const draft = fbDrafts[ref.id] || { comment: ref.teacherComment || '', stamp: ref.teacherStamp || '' };
    setFbSavingId(ref.id);
    const { error } = await saveTeacherFeedback(studentId, ref.id, draft.comment, draft.stamp);
    setFbSavingId(null);
    if (error) return;
    setStudents(prev => prev.map(s => s.id !== studentId ? s : {
      ...s,
      reflections: (s.reflections || []).map((r: any) => r.id === ref.id ? { ...r, teacherComment: draft.comment.trim(), teacherStamp: draft.stamp } : r),
    }));
  };

  const loadConvLogs = async () => {
    setLogsLoading(true);
    const logs = await fetchConversationLogs();
    setConvLogs(logs);
    setLogsLoading(false);
  };

  const handleSaveCaps = async () => {
    setCap('gemini', geminiCap);
    setCap('azure', azureCap);
    const { error } = await persistSettings({ geminiDailyCap: geminiCap, azureDailyCap: azureCap });
    setCapStatus(error ? '通信エラー' : '上限を保存しました');
    setTimeout(() => setCapStatus(''), 4000);
  };

  const handleSave = async () => {
    if (!supabase) return;

    const cleanedKey = geminiKey.trim();
    if (cleanedKey === '') {
      setIsError(true);
      setSaveStatus('エラー: APIキーを入力してください。');
      return;
    }

    if (cleanedKey.startsWith('ya29')) {
      setIsError(true);
      setSaveStatus('エラー: これはOAuthトークンです。APIキーを入力してください。');
      return;
    }

    setSaveStatus('保存中...');
    setIsError(false);

    const { error } = await persistSettings({ geminiApiKey: cleanedKey });

    if (error) {
      setIsError(true);
      setSaveStatus('通信エラーが発生しました');
      console.error(error);
    } else {
      setIsError(false);
      setSaveStatus('保存しました！');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleAzureSave = async () => {
    if (!supabase) return;

    const cleanedKey = azureKey.trim();
    const cleanedRegion = azureRegion.trim();
    if (cleanedKey === '' || cleanedRegion === '') {
      setAzureIsError(true);
      setAzureSaveStatus('エラー: キーとリージョンの両方を入力してください。');
      return;
    }

    setAzureSaveStatus('保存中...');
    setAzureIsError(false);

    const { error } = await persistSettings({
      azureSpeechKey: cleanedKey,
      azureSpeechRegion: cleanedRegion
    });

    if (error) {
      setAzureIsError(true);
      setAzureSaveStatus('通信エラーが発生しました');
      console.error(error);
    } else {
      setAzureIsError(false);
      setAzureSaveStatus('保存しました！');
      setTimeout(() => setAzureSaveStatus(''), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-col flex-center" style={{ flex: 1 }}>
        <div className="glass-card flex-col flex-center" style={{ padding: '3rem', gap: '1rem' }}>
          <h2 className="text-primary">先生用ダッシュボード</h2>
          <p>PINコードを入力してください</p>
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="password" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={{ fontSize: '2rem', textAlign: 'center', width: '150px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
              maxLength={4}
              autoComplete="one-time-code"
              name="teacher_pin"
            />
            <Button type="submit">ログイン</Button>
          </form>
          <Button variant="outline" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>戻る</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col gap-lg" style={{ flex: 1, padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => navigate(-1)} icon={ArrowLeft}>もどる</Button>
        <h1 className="text-primary" style={{ margin: 0 }}>先生用ダッシュボード</h1>
      </div>

      {/* 今日のミッション設定 */}
      <div className="glass-card" style={{ border: '2px solid #ee5253' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Target color="#ee5253" />
          <h2 style={{ margin: 0 }}>今日のミッション</h2>
        </div>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          設定すると、児童のホーム画面の一番上に大きく表示され、ワンクリックでそのページに飛べます。
        </p>
        {currentMission && (
          <div style={{ padding: '0.6rem 1rem', background: 'rgba(238,82,83,0.1)', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold', color: '#c0392b' }}>
            🎯 いま設定中：{currentMission.label}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={missionRoute}
            onChange={e => setMissionRoute(e.target.value)}
            style={{ flex: 1, minWidth: '240px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
          >
            <option value="">（ミッションなし）</option>
            {MISSION_OPTIONS.map(o => (
              <option key={o.route} value={o.route}>{o.label}</option>
            ))}
          </select>
          <Button onClick={handleSetMission} icon={Save}>設定する</Button>
          <Button variant="outline" onClick={handleClearMission}>解除</Button>
        </div>
        {missionStatus && <span style={{ display: 'block', marginTop: '0.8rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{missionStatus}</span>}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Key color="var(--color-accent)" />
            <h2 style={{ margin: 0 }}>AI機能設定 (Gemini API)</h2>
          </div>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            GitHub等にパスワードが漏れないように、ここにAPIキーを入力してデータベースに保存します。<br/>
            Google AI Studioで取得したキーを入力してください。
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type={showKey ? "text" : "password"}
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'monospace' }}
              autoComplete="new-password"
              name="gemini_api_key"
            />
            <Button variant="outline" onClick={() => setShowKey(!showKey)}>
              {showKey ? '隠す' : '見る'}
            </Button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button onClick={handleSave} icon={Save}>APIキーを保存する</Button>
            {saveStatus && <span style={{ color: isError ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 'bold' }}>{saveStatus}</span>}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Mic color="var(--color-accent)" />
            <h2 style={{ margin: 0 }}>発音判定設定 (Azure Speech)</h2>
          </div>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            「発音バトル」で発音の正確さを採点するために使います。<br/>
            Azureの「キーとエンドポイント」からコピーした<strong>キー</strong>と<strong>リージョン</strong>（例: japaneast）を入力してください。
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <input
              type={showAzureKey ? "text" : "password"}
              value={azureKey}
              onChange={e => setAzureKey(e.target.value)}
              placeholder="Azure Speech キー"
              style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'monospace' }}
              autoComplete="new-password"
              name="azure_speech_key"
            />
            <Button variant="outline" onClick={() => setShowAzureKey(!showAzureKey)}>
              {showAzureKey ? '隠す' : '見る'}
            </Button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={azureRegion}
              onChange={e => setAzureRegion(e.target.value)}
              placeholder="リージョン (例: japaneast)"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'monospace', boxSizing: 'border-box' }}
              autoComplete="off"
              name="azure_speech_region"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button onClick={handleAzureSave} icon={Save}>発音判定の設定を保存</Button>
            {azureSaveStatus && <span style={{ color: azureIsError ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 'bold' }}>{azureSaveStatus}</span>}
          </div>
        </div>

        <div className="glass-card">
          <h2>クラス管理機能</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            全員の画面を強制的に切り替えて、先生の指示に注目させることができます。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>画面ロック状態</span>
              <span style={{ color: isScreenLocked ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 'bold' }}>
                {isScreenLocked ? '🔒 ロック中（注目モード）' : '🔓 解除中'}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button 
                style={{ flex: 1, background: isScreenLocked ? '#ccc' : 'var(--color-error)' }}
                disabled={isScreenLocked}
                onClick={async () => {
                  setIsScreenLocked(true);
                  await persistSettings({ isScreenLocked: true });
                }}
              >
                🔒 全員をロックする
              </Button>
              <Button 
                style={{ flex: 1, background: !isScreenLocked ? '#ccc' : 'var(--color-success)' }}
                disabled={!isScreenLocked}
                onClick={async () => {
                  setIsScreenLocked(false);
                  await persistSettings({ isScreenLocked: false });
                }}
              >
                🔓 ロックを解除する
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h2>🧪 マイ単語ついか機能（準備中）</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            子どもや先生が「地域の言葉（懐古園など）」をPicture Dictionaryに追加できる機能です。
            運用を決めてからONにしてください。<b>OFFの間は子どもの画面には出ません。</b>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>いまの状態</span>
            <span style={{ color: customVocabEnabled ? 'var(--color-success)' : '#94a3b8', fontWeight: 'bold' }}>
              {customVocabEnabled ? '🟢 ON（子どもも追加できる）' : '⚪️ OFF（子どもには非表示）'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              style={{ flex: 1, background: customVocabEnabled ? '#ccc' : 'var(--color-success)' }}
              disabled={customVocabEnabled}
              onClick={async () => { setCustomVocabEnabled(true); await persistSettings({ customVocabEnabled: true }); }}
            >
              🟢 ONにする
            </Button>
            <Button
              style={{ flex: 1, background: !customVocabEnabled ? '#ccc' : 'var(--color-error)' }}
              disabled={!customVocabEnabled}
              onClick={async () => { setCustomVocabEnabled(false); await persistSettings({ customVocabEnabled: false }); }}
            >
              ⚪️ OFFにする
            </Button>
          </div>
        </div>

        <div className="glass-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Gauge size={22} /> APIの1日あたり上限（コスト対策）</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            1台の端末が1日に使えるAIの回数の上限です。上限に達すると、その日はやさしいメッセージが出て止まります（翌日リセット）。
            <br />Gemini＝AI英会話・お話づくり、Azure＝発音チェックの回数。<b>0にすると無制限</b>になります。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>🤖 Gemini（AI英会話・お話づくり）</label>
              <input type="number" min={0} value={geminiCap}
                onChange={e => setGeminiCap(Number(e.target.value))}
                style={{ width: '100%', padding: '0.6rem', fontSize: '1.1rem', borderRadius: '8px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }} />
              <span style={{ fontSize: '0.8rem', color: '#888' }}>この端末の今日の利用：{getUsage('gemini')} 回</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>🎤 Azure（発音チェック）</label>
              <input type="number" min={0} value={azureCap}
                onChange={e => setAzureCap(Number(e.target.value))}
                style={{ width: '100%', padding: '0.6rem', fontSize: '1.1rem', borderRadius: '8px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }} />
              <span style={{ fontSize: '0.8rem', color: '#888' }}>この端末の今日の利用：{getUsage('azure')} 回</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <Button onClick={handleSaveCaps} icon={Save}>上限を保存</Button>
            {capStatus && <span style={{ color: capStatus === '通信エラー' ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 'bold' }}>{capStatus}</span>}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h2>🗣️ AI英会話：Unitゴールの編集</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          各Unitの「ミッション（子ども向け表示）」と「ゴール（AIが[CLEAR]を判定する条件・英語）」を編集できます。
          空欄のままなら既定の文が使われます。U6の注文〜会計など、判定を厳しく/ゆるくしたいときに調整してください。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {FREETALK_UNITS.map(u => (
            <div key={u.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.8rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.4rem' }}>{u.label}</div>
              <label style={{ fontSize: '0.8rem', color: '#64748b' }}>ミッション（子ども向け）
                <input
                  value={freetalkGoals[u.id]?.missionJa ?? u.missionJa}
                  onChange={e => setFreetalkGoals(p => ({ ...p, [u.id]: { ...p[u.id], missionJa: e.target.value } }))}
                  style={{ display: 'block', width: '100%', marginTop: '0.2rem', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.9rem' }} />
              </label>
              <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '0.4rem' }}>ゴール（AI判定・英語）
                <textarea
                  value={freetalkGoals[u.id]?.goal ?? u.goal}
                  onChange={e => setFreetalkGoals(p => ({ ...p, [u.id]: { ...p[u.id], goal: e.target.value } }))}
                  style={{ display: 'block', width: '100%', marginTop: '0.2rem', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem', minHeight: '48px' }} />
              </label>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <Button onClick={handleSaveGoals} icon={Save}>ゴールを保存</Button>
          {goalSaveMsg && <span style={{ color: goalSaveMsg === '通信エラー' ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 'bold' }}>{goalSaveMsg}</span>}
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h2>📒 AI英会話の記録（チーム／個人）</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          子どもが「📝 記録」を押した会話だけが残ります（自動では残りません）。班名つきはチームの記録です。
          ✅はそのときゴール（[CLEAR]）に到達していたことを示します。
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Button onClick={loadConvLogs} disabled={logsLoading}>{logsLoading ? '読み込み中…' : '記録を読み込む'}</Button>
          {convLogs && <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{convLogs.length}件</span>}
        </div>
        {convLogs && convLogs.length === 0 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', color: '#666' }}>まだ記録はありません</div>
        )}
        {convLogs && convLogs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {convLogs.map(log => (
              <div key={log.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  style={{ padding: '0.7rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', background: expandedLogId === log.id ? '#f8fafc' : 'white' }}>
                  {log.cleared ? <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✅クリア</span> : <span style={{ color: '#94a3b8' }}>―</span>}
                  {log.team ? <span style={{ background: '#eef2ff', color: '#4338ca', borderRadius: '6px', padding: '0.1rem 0.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>班：{log.team}</span> : <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{log.studentName}</span>}
                  <span style={{ fontWeight: 'bold' }}>{log.unitTitle}</span>
                  <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(log.ts).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {expandedLogId === log.id && (
                  <div style={{ padding: '0.8rem 1rem', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {log.lines.map((l, i) => (
                      <div key={i} style={{ fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 'bold', color: l.role === 'model' ? 'var(--color-primary)' : '#0984e3' }}>{l.role === 'model' ? 'AI' : (l.speaker || '子ども')}：</span>
                        <span>{l.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h2>生徒の学習状況・ふりかえり</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          クラス全員の学習状況を一覧で確認できます。「生徒ごと」「日ごと」「到達マップ（誰が未達か＋ペア提案）」で切り替えられます。
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {([['byStudent', '👤 生徒ごと'], ['byDate', '📅 日ごと'], ['map', '📊 到達マップ']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setStudentView(v)}
              style={{ padding: '0.5rem 1.2rem', borderRadius: '999px', border: '2px solid var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', background: studentView === v ? 'var(--color-primary)' : 'white', color: studentView === v ? 'white' : 'var(--color-primary)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {students.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', color: '#666' }}>
            まだ生徒のデータがありません
          </div>
        ) : studentView === 'byStudent' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {students.map(student => {
              const isExpanded = expandedStudentId === student.id;
              const lastAccess = student.last_access ? new Date(student.last_access).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '未アクセス';
              const reflections = student.reflections || [];

              return (
                <div key={student.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Summary Header */}
                  <div 
                    style={{ padding: '1rem 1.5rem', background: isExpanded ? '#f8fafc' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                    className="hover-scale"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '150px' }}>
                        {student.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 'bold' }}>
                        ★ {student.points || 0} P
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 'bold' }}>
                        🏅 バッジ {student.badges?.length || 0}個
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                      最終アクセス: {lastAccess}
                      <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </div>
                  </div>

                  {/* Expanded Content: Reflections */}
                  {isExpanded && (
                    <div style={{ padding: '1.5rem', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#475569' }}>ふりかえりノート</h3>
                      {reflections.length === 0 ? (
                        <p style={{ color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>まだふりかえりを書いていません</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {reflections.map((ref: any) => (
                            <div key={ref.id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: '#64748b' }}>{new Date(ref.date).toLocaleDateString('ja-JP')}</span>
                                <span style={{ letterSpacing: '2px' }}>
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} style={{ color: i < ref.stars ? '#f59e0b' : '#cbd5e1' }}>★</span>
                                  ))}
                                </span>
                              </div>
                              <p style={{ margin: 0, color: '#334155', lineHeight: '1.5' }}>{ref.comment}</p>
                              {/* 先生からのコメント／スタンプ（双方向） */}
                              {(() => {
                                const draft = fbDrafts[ref.id] || { comment: ref.teacherComment || '', stamp: ref.teacherStamp || '' };
                                const setDraft = (d: { comment: string; stamp: string }) => setFbDrafts(p => ({ ...p, [ref.id]: d }));
                                return (
                                  <div style={{ marginTop: '0.7rem', paddingTop: '0.7rem', borderTop: '1px dashed #cbd5e1' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#0891b2', fontWeight: 'bold', marginBottom: '0.3rem' }}>先生から（子どもに見えます）</div>
                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                      {STAMPS.map(st => (
                                        <button key={st} onClick={() => setDraft({ ...draft, stamp: draft.stamp === st ? '' : st })}
                                          style={{ fontSize: '1.2rem', padding: '0.1rem 0.4rem', borderRadius: '8px', cursor: 'pointer', background: draft.stamp === st ? '#cffafe' : 'white', border: `2px solid ${draft.stamp === st ? '#0891b2' : '#e2e8f0'}` }}>
                                          {st}
                                        </button>
                                      ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                      <input value={draft.comment} onChange={e => setDraft({ ...draft, comment: e.target.value })} placeholder="一言コメント（任意）"
                                        style={{ flex: 1, minWidth: '180px', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '0.9rem' }} />
                                      <Button onClick={() => handleSaveFeedback(student.id, ref)} disabled={fbSavingId === ref.id} style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
                                        {fbSavingId === ref.id ? '保存中…' : 'おくる'}
                                      </Button>
                                    </div>
                                    {(ref.teacherComment || ref.teacherStamp) && (
                                      <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#16a34a' }}>送信済み：{ref.teacherStamp} {ref.teacherComment}</div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : studentView === 'byDate' ? (
          (() => {
            // 全生徒のふりかえりを日付ごとにまとめる（新しい日付が上）
            const byDate: Record<string, { name: string; comment: string; stars: number }[]> = {};
            students.forEach(s => {
              (s.reflections || []).forEach((r: any) => {
                const d = new Date(r.date).toLocaleDateString('ja-JP');
                (byDate[d] = byDate[d] || []).push({ name: s.name, comment: r.comment, stars: r.stars });
              });
            });
            const dates = Object.keys(byDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            if (dates.length === 0) {
              return <div style={{ padding: '2rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', color: '#666' }}>まだふりかえりがありません</div>;
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {dates.map(date => (
                  <div key={date} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '0.8rem 1.2rem', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📅 {date}</span>
                      <span>{byDate[date].length}件</span>
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {byDate[date].map((r, i) => (
                        <div key={i} style={{ background: '#f8fafc', padding: '0.8rem 1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <span style={{ fontWeight: 'bold', color: '#334155' }}>{r.name}</span>
                            <span style={{ letterSpacing: '2px' }}>
                              {Array.from({ length: 5 }).map((_, j) => (
                                <span key={j} style={{ color: j < r.stars ? '#f59e0b' : '#cbd5e1' }}>★</span>
                              ))}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.5' }}>{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        ) : (
          (() => {
            // 各生徒の到達状況を集計（students行のclear_counts/badges/dictionary_progress/pronunciation_historyから）
            const dialogueClear = (cc: any, id: string) => (cc?.[`dialogue_${id}`] || 0) > 0;
            const dialogueTotal = DIALOGUES.length;
            const phonicsTotal = stages.length;
            const wbTotal = WORLD_BENTO_QUIZZES.length;
            const rows = students.map(s => {
              const cc = s.clear_counts || {};
              const badges: number[] = s.badges || [];
              const dict = s.dictionary_progress || {};
              const dialogueCount = DIALOGUES.filter(d => dialogueClear(cc, d.id)).length;
              const phonicsCount = badges.length;
              const wbCount = WORLD_BENTO_QUIZZES.filter(q => (cc[`textbook_quiz_${q.id}`] || 0) > 0).length;
              const dictCount = Object.values(dict).filter((p: any) => p && (p.practice || p.spelling || p.speedKaruta || p.memoryGame)).length;
              const pron = s.pronunciation_history || [];
              const pronAvg = pron.length ? Math.round(pron.reduce((a: number, r: any) => a + (r.score || 0), 0) / pron.length) : null;
              const mastery = phonicsCount + dialogueCount + wbCount + dictCount;
              return { s, cc, badges, dialogueCount, phonicsCount, wbCount, dictCount, pronAvg, pronCount: pron.length, mastery, points: s.points || 0 };
            });
            // ペア提案：到達スコア順にならべ、上位（ヘルパー）×下位（サポート）でペアに
            const sorted = [...rows].sort((a, b) => b.mastery - a.mastery);
            const pairs: { helper: typeof rows[0]; support: typeof rows[0] }[] = [];
            let i = 0, j = sorted.length - 1;
            while (i < j) { pairs.push({ helper: sorted[i], support: sorted[j] }); i++; j--; }
            const leftover = i === j ? sorted[i] : null;

            // 「○/○」を色付きセルで（0=赤、満=緑、途中=オレンジ）
            const fracCell = (n: number, total: number) => {
              const color = n === 0 ? '#dc2626' : n >= total ? '#16a34a' : '#d97706';
              const bg = n === 0 ? '#fef2f2' : n >= total ? '#dcfce7' : '#fffbeb';
              return <td style={{ textAlign: 'center', padding: '0.35rem 0.4rem', borderRight: '1px solid #f1f5f9', background: bg, color, fontWeight: 'bold', whiteSpace: 'nowrap' }}>{n}/{total}</td>;
            };
            const th = (label: string) => <th style={{ padding: '0.4rem 0.4rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{label}</th>;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* ペア提案 */}
                <div className="glass-card" style={{ padding: '1.2rem', background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                  <h3 style={{ margin: '0 0 0.3rem 0', color: '#4338ca' }}>🤝 ペア提案（教え合い）</h3>
                  <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: '#6366f1' }}>
                    到達スコア（フォニックス＋ダイアログ＋World Bento＋辞書のクリア数）が高い子（ヘルパー）と、サポートが要る子を組み合わせた案です。
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {pairs.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', background: 'white', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#16a34a' }}>🦸 {p.helper.s.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>(到達{p.helper.mastery})</span>
                        <span style={{ color: '#94a3b8' }}>×</span>
                        <span style={{ fontWeight: 'bold', color: '#2563eb' }}>🌱 {p.support.s.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>(到達{p.support.mastery})</span>
                      </div>
                    ))}
                    {leftover && (
                      <div style={{ background: 'white', padding: '0.5rem 0.8rem', borderRadius: '8px', color: '#64748b' }}>
                        あまり：{leftover.s.name}（到達{leftover.mastery}）— 3人組にするか先生とペアに
                      </div>
                    )}
                  </div>
                </div>

                {/* 人ごと 全モード一覧 */}
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.4rem 0' }}>
                    各モードの「クリア数／全体」。<span style={{ color: '#dc2626', fontWeight: 'bold' }}>赤=0（要支援）</span>・<span style={{ color: '#d97706', fontWeight: 'bold' }}>オレンジ=途中</span>・<span style={{ color: '#16a34a', fontWeight: 'bold' }}>緑=ぜんぶ</span>。発音は平均点（回数）。
                  </p>
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem', width: '100%' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', position: 'sticky', left: 0, background: '#f8fafc', minWidth: '110px' }}>生徒</th>
                          {th('🔤 フォニックス')}{th('🗣️ ダイアログ')}{th('🍱 World Bento')}{th('📖 辞書')}{th('🎤 発音')}{th('🏅 到達')}{th('⭐ P')}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.3rem 0.6rem', position: 'sticky', left: 0, background: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{r.s.name}</td>
                            {fracCell(r.phonicsCount, phonicsTotal)}
                            {fracCell(r.dialogueCount, dialogueTotal)}
                            {fracCell(r.wbCount, wbTotal)}
                            <td style={{ textAlign: 'center', padding: '0.35rem 0.4rem', borderRight: '1px solid #f1f5f9', fontWeight: 'bold', color: r.dictCount === 0 ? '#dc2626' : '#334155' }}>{r.dictCount}</td>
                            <td style={{ textAlign: 'center', padding: '0.35rem 0.4rem', borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                              {r.pronAvg !== null
                                ? <span style={{ fontWeight: 'bold', color: r.pronAvg >= 80 ? '#16a34a' : r.pronAvg >= 60 ? '#d97706' : '#dc2626' }}>{r.pronAvg}<span style={{ color: '#94a3b8', fontWeight: 'normal' }}>点({r.pronCount})</span></span>
                                : <span style={{ color: '#cbd5e1' }}>―</span>}
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.35rem 0.4rem', borderRight: '1px solid #f1f5f9', fontWeight: 'bold', color: 'var(--color-primary)' }}>{r.mastery}</td>
                            <td style={{ textAlign: 'center', padding: '0.35rem 0.4rem', color: '#f59e0b', fontWeight: 'bold' }}>{r.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};
