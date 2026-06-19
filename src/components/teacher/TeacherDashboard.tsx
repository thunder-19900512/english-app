import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { stages } from '../../data/stages';
import { supabase } from '../../lib/supabase';
import { STUDENTS } from '../../data/students';

interface StudentData {
  id: string;
  name: string;
  badges: number[];
  lastAccess: string;
  points: number;
  reflections: any[];
}

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  const fetchStudents = async () => {
    setLoading(true);
    
    // Fetch from Supabase
    const { data: supabaseData, error } = await supabase.from('students').select('*');
    if (error) {
      console.error('Failed to fetch from Supabase', error);
      setLoading(false);
      return;
    }

    const dataMap = new Map(supabaseData?.map(s => [s.id, s]) || []);

    const combinedData: StudentData[] = STUDENTS.map(student => {
      const dbEntry = dataMap.get(student.id);
      if (dbEntry) {
        return {
          id: student.id,
          name: student.name, // Keep static name or db name
          badges: dbEntry.badges || [],
          lastAccess: dbEntry.last_access || 'Never',
          points: dbEntry.points || 0,
          reflections: dbEntry.reflections || []
        };
      } else {
        return {
          id: student.id,
          name: student.name,
          badges: [],
          lastAccess: 'Never',
          points: 0,
          reflections: []
        };
      }
    });

    setStudentsData(combinedData);
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'teacher123') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-col flex-center" style={{ height: '100vh', gap: '2rem' }}>
        <h2 className="text-primary">先生用ログイン</h2>
        <form onSubmit={handleLogin} className="glass-card flex-col gap-md">
          <input 
            type="password" 
            placeholder="パスワードを入力" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '1rem', fontSize: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid #ccc' }}
          />
          <Button type="submit">ログイン</Button>
          <Button variant="outline" onClick={() => navigate('/')}>アプリにもどる</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-col gap-lg" style={{ padding: '2rem', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outline" onClick={() => navigate('/')} icon={ArrowLeft}>
          ダッシュボードを出る
        </Button>
        <h1 className="text-primary">先生用ダッシュボード</h1>
        <Button variant="outline" onClick={fetchStudents} disabled={loading}>
          {loading ? '更新中...' : '最新の情報に更新'}
        </Button>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-primary)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>名前</th>
              <th style={{ padding: '1rem' }}>ポイント</th>
              <th style={{ padding: '1rem' }}>Phonics進捗</th>
              <th style={{ padding: '1rem' }}>最終アクセス</th>
              <th style={{ padding: '1rem' }}>ステータス</th>
              <th style={{ padding: '1rem' }}>ふりかえり</th>
            </tr>
          </thead>
          <tbody>
            {studentsData.map((student) => {
              const allCleared = student.badges.length === stages.length;
              const hasStarted = student.badges.length > 0;
              const isStuck = hasStarted && !allCleared;

              return (
                <React.Fragment key={student.id}>
                  <tr 
                    style={{ 
                    borderBottom: '1px solid var(--glass-border)',
                    background: allCleared ? 'rgba(0, 184, 148, 0.1)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '1rem' }}>{student.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.name}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                    ★ {student.points}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {stages.map(s => (
                        <div 
                          key={s.id} 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            background: student.badges.includes(s.id) ? 'var(--color-success)' : '#e0e0e0',
                            display: 'inline-block'
                          }} 
                          title={`Stage ${s.id}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    {student.lastAccess !== 'Never' ? new Date(student.lastAccess).toLocaleString('ja-JP') : 'なし'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {allCleared ? (
                      <span className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check size={16} /> マスター！
                      </span>
                    ) : isStuck ? (
                      <span style={{ color: 'orange', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={16} /> 進行中
                      </span>
                    ) : (
                      <span className="text-muted">未開始</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Button 
                      variant="outline" 
                      onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                      disabled={student.reflections.length === 0}
                      style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                    >
                      {student.reflections.length > 0 ? `ふりかえり (${student.reflections.length})` : 'なし'}
                    </Button>
                  </td>
                </tr>
                {expandedStudentId === student.id && student.reflections.length > 0 && (
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <td colSpan={7} style={{ padding: '1rem 2rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>ふりかえり履歴</h4>
                        {student.reflections.map((r: any) => (
                          <div key={r.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <strong style={{ color: 'var(--color-text-muted)' }}>{new Date(r.date).toLocaleString('ja-JP')}</strong>
                              <span style={{ color: '#f39c12', fontSize: '1.2rem' }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.5 }}>{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
