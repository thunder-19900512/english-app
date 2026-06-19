import React from 'react';
import { useNavigate } from 'react-router-dom';
import { STUDENTS } from '../../data/students';
import { pullFromSupabase, pushToSupabase } from '../../lib/sync';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = async (studentId: string, studentName: string) => {
    localStorage.setItem('studentId', studentId);
    localStorage.setItem('studentName', studentName);
    
    // Pull existing data from Supabase
    const hasData = await pullFromSupabase(studentId);
    
    // Initialize local entry if new
    const dataKey = `student_${studentId}`;
    if (!hasData && !localStorage.getItem(dataKey)) {
      localStorage.setItem(dataKey, JSON.stringify({
        id: studentId,
        name: studentName,
        badges: [],
        lastAccess: new Date().toISOString()
      }));
    } else {
      const dataStr = localStorage.getItem(dataKey);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        data.lastAccess = new Date().toISOString();
        localStorage.setItem(dataKey, JSON.stringify(data));
      }
    }
    
    // Push the updated lastAccess (or new profile) back to Supabase
    await pushToSupabase(studentId);

    navigate('/home');
  };

  return (
    <div className="flex-col gap-lg" style={{ flex: 1, padding: '2rem' }}>
      <div className="flex-col flex-center gap-sm">
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>Phonics Master</h1>
        <p style={{ fontSize: '1.2rem' }}>なまえをタップしてはじめよう！</p>
      </div>

      <div className="student-grid" style={{ marginTop: '2rem' }}>
        {STUDENTS.map((student) => (
          <button
            key={student.id}
            className="btn"
            style={{ 
              padding: '1rem', 
              fontSize: '1rem', 
              borderRadius: 'var(--radius-sm)',
              background: student.grade === 5 ? 'var(--color-secondary)' : 'var(--color-primary)',
              color: 'white',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => handleLogin(student.id, student.name)}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            {student.id}. {student.name}
          </button>
        ))}
      </div>

      <div className="flex-center" style={{ marginTop: '4rem' }}>
        <button 
          className="btn btn-outline" 
          onClick={() => navigate('/teacher')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          先生用画面 (Teacher)
        </button>
      </div>
    </div>
  );
};
