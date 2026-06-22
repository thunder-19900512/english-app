import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowLeft, Key, Save, Mic, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DIALOGUES } from '../dialogue/dialogueData';
import { DEFAULT_QUIZZES } from '../textbook/textbookQuizData';

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
  const [students, setStudents] = useState<any[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [missionRoute, setMissionRoute] = useState('');
  const [missionStatus, setMissionStatus] = useState('');
  const [currentMission, setCurrentMission] = useState<MissionOption | null>(null);

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
      if (data.dictionary_progress.todayMission) {
        setCurrentMission(data.dictionary_progress.todayMission);
        setMissionRoute(data.dictionary_progress.todayMission.route || '');
      }
    }

    // Fetch students data
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .neq('id', 'app_settings_v1')
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
      </div>

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h2>生徒の学習状況・ふりかえり</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          クラス全員の学習状況を一覧で確認できます。名前をクリックすると「ふりかえり」が読めます。
        </p>

        {students.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', color: '#666' }}>
            まだ生徒のデータがありません
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
