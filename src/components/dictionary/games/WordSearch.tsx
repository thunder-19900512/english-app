import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vocabulary } from '../../../data/vocabulary';
import { Button } from '../../ui/Button';
import { ArrowLeft, Trophy, RefreshCw, Volume2 } from 'lucide-react';
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis';
import { usePoints } from '../../../hooks/usePoints';
import { useDictionaryProgress } from '../../../hooks/useDictionaryProgress';
import { useLeaderboard } from '../../../hooks/useLeaderboard';
import { Timer, Crown } from 'lucide-react';

// --- Logic to Generate the Word Search Grid ---
const GRID_SIZE = 8;
const DIRS = [
  { dr: 0, dc: 1 }, // Horizontal right
  { dr: 1, dc: 0 }  // Vertical down
];

interface CellInfo {
  letter: string;
  isTarget: boolean;
}

interface WordLocation {
  word: string;
  startR: number;
  startC: number;
  endR: number;
  endC: number;
}

const generateGrid = (words: string[]) => {
  const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  const locations: WordLocation[] = [];

  for (const word of words) {
    const w = word.toUpperCase().replace(/\s/g, ''); // ignore spaces
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      attempts++;
      const dir = DIRS[Math.floor(Math.random() * DIRS.length)];
      const startR = Math.floor(Math.random() * GRID_SIZE);
      const startC = Math.floor(Math.random() * GRID_SIZE);

      const endR = startR + dir.dr * (w.length - 1);
      const endC = startC + dir.dc * (w.length - 1);

      if (endR < GRID_SIZE && endC < GRID_SIZE) {
        // Check if path is clear
        let clear = true;
        for (let i = 0; i < w.length; i++) {
          const r = startR + dir.dr * i;
          const c = startC + dir.dc * i;
          if (grid[r][c] !== '' && grid[r][c] !== w[i]) {
            clear = false;
            break;
          }
        }

        // Place word
        if (clear) {
          for (let i = 0; i < w.length; i++) {
            const r = startR + dir.dr * i;
            const c = startC + dir.dc * i;
            grid[r][c] = w[i];
          }
          locations.push({
            word: w,
            startR,
            startC,
            endR,
            endC
          });
          placed = true;
        }
      }
    }
  }

  // Fill empty spaces
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const finalGrid: CellInfo[][] = grid.map(row => 
    row.map(cell => ({
      letter: cell === '' ? letters[Math.floor(Math.random() * letters.length)] : cell,
      isTarget: false // will be used for UI highlighting
    }))
  );

  return { grid: finalGrid, locations };
};

export const WordSearch: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { speak } = useSpeechSynthesis();
  const { addPoints } = usePoints();
  const { progress, saveProgress } = useDictionaryProgress();
  const { classBest } = useLeaderboard(category || '', 'wordsearch');

  const [grid, setGrid] = useState<CellInfo[][]>([]);
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  
  // Selection state
  const [selectionStart, setSelectionStart] = useState<{r: number, c: number} | null>(null);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  // Time Attack State
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const initGame = useCallback(() => {
    const catWords = vocabulary.filter(v => v.category === category);
    // Pick 3-4 random short words
    const shuffled = [...catWords]
      .filter(w => w.english.length >= 3 && w.english.length <= 7) // keep it simple
      .sort(() => 0.5 - Math.random());
    
    const selected = shuffled.slice(0, 4).map(v => v.english);
    const { grid: newGrid } = generateGrid(selected);
    
    setTargetWords(selected.map(w => w.toUpperCase().replace(/\s/g, '')));
    setGrid(newGrid);
    setFoundWords([]);
    setSelectionStart(null);
    setShowCelebration(false);
    setEarnedPoints(null);
    setStartTime(Date.now());
    setElapsedMs(0);
    setFinalTime(null);
    setIsNewRecord(false);
  }, [category]);

  // Timer loop
  useEffect(() => {
    if (!startTime || showCelebration) return;
    
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
    
    return () => clearInterval(interval);
  }, [startTime, showCelebration]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCellClick = async (r: number, c: number) => {
    if (showCelebration) return;

    if (!selectionStart) {
      setSelectionStart({ r, c });
      return;
    }

    // Second tap: Check if path is valid
    const r1 = selectionStart.r;
    const c1 = selectionStart.c;
    const r2 = r;
    const c2 = c;

    // Check if horizontal or vertical
    if (r1 !== r2 && c1 !== c2) {
      // Invalid diagonal selection, reset
      setSelectionStart(null);
      return;
    }

    // Build the string from (r1,c1) to (r2,c2)
    const dr = r1 === r2 ? 0 : (r2 > r1 ? 1 : -1);
    const dc = c1 === c2 ? 0 : (c2 > c1 ? 1 : -1);
    
    let pathString = '';
    const pathCells = [];
    
    let currR = r1;
    let currC = c1;
    
    // Safety break to prevent infinite loop
    let steps = 0;
    while (steps < 20) {
      pathString += grid[currR][currC].letter;
      pathCells.push({r: currR, c: currC});
      if (currR === r2 && currC === c2) break;
      currR += dr;
      currC += dc;
      steps++;
    }

    // Check if pathString matches any target word
    // Also check reverse because kids might select from end to start
    const reversePathString = pathString.split('').reverse().join('');
    
    let matchedWord = targetWords.find(w => w === pathString);
    let matchedCells = pathCells;

    if (!matchedWord) {
      matchedWord = targetWords.find(w => w === reversePathString);
      if (matchedWord) {
        matchedCells = [...pathCells].reverse();
      }
    }

        if (matchedWord && !foundWords.includes(matchedWord)) {
      // Found a word!
      const originalWord = vocabulary.find(v => v.english.toUpperCase().replace(/\s/g, '') === matchedWord)?.english;
      if (originalWord) speak(originalWord);

      setFoundWords(prev => {
        const next = [...prev, matchedWord as string];
        checkWinCondition(next);
        return next;
      });

      setGrid(prev => {
        const newGrid = [...prev];
        for (const cell of matchedCells) {
          newGrid[cell.r][cell.c] = { ...newGrid[cell.r][cell.c], isTarget: true };
        }
        return newGrid;
      });
    }

    setSelectionStart(null); // Reset selection
  };

  const checkWinCondition = async (found: string[]) => {
    if (found.length === targetWords.length) {
      const endTime = Date.now();
      const totalSeconds = startTime ? (endTime - startTime) / 1000 : 0;
      setFinalTime(totalSeconds);

      const pts = await addPoints(`dictionary_${category}_wordsearch`, { isPerfect: true });
      setEarnedPoints(pts);

      // Check for personal best
      const currentBest = progress[category || '']?.wordsearch_best_time;
      let newBest = currentBest;

      if (!currentBest || totalSeconds < currentBest) {
        newBest = totalSeconds;
        setIsNewRecord(true);
      }

      saveProgress(category || '', { 
        wordsearch: true, 
        ...(newBest ? { wordsearch_best_time: newBest } : {})
      });
      
      setShowCelebration(true);
    }
  };

  if (showCelebration) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>クリア！</h1>
        <div className="animate-float">
          <Trophy size={100} color="var(--color-accent)" />
        </div>
        
        {finalTime !== null && (
          <div className="glass-card flex-col flex-center animate-pop" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.9)', border: isNewRecord ? '3px solid var(--color-accent)' : 'none' }}>
            <div style={{ fontSize: '1.2rem', color: '#666' }}>クリアタイム</div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
              {finalTime.toFixed(1)}秒
            </div>
            {isNewRecord && (
              <div style={{ color: 'var(--color-accent)', fontWeight: 'bold', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Crown size={20} /> NEW RECORD! 自己ベスト更新！
              </div>
            )}
          </div>
        )}

        {earnedPoints !== null && (
          <div className="animate-pop" style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
            +{earnedPoints} ポイントゲット！✨
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button onClick={initGame} variant="outline" icon={RefreshCw}>もう一度</Button>
          <Button onClick={() => navigate('/home')}>ホームにもどる</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col gap-md" style={{ flex: 1, paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>
          もどる
        </Button>
        <h1 className="text-primary" style={{ margin: 0 }}>言葉さがし</h1>
        
        {/* Timer UI */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white' }}>
          <Timer size={24} color="var(--color-primary)" />
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', minWidth: '80px', textAlign: 'right' }}>
            {(elapsedMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      {classBest && (
        <div className="animate-pop" style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
            color: 'white', 
            padding: '0.5rem 1.5rem', 
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <Crown size={20} />
            クラス記録: {classBest.time.toFixed(1)}秒 ({classBest.name}さん)
          </div>
        </div>
      )}

      <div className="glass-card flex-col flex-center" style={{ gap: '1rem' }}>
        <p style={{ fontSize: '1.2rem', textAlign: 'center' }}>
          最初の文字と最後の文字をタップして、隠れた単語を見つけよう！
        </p>
        
        {/* Target Words List */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
          {targetWords.map(word => {
            const isFound = foundWords.includes(word);
            const orig = vocabulary.find(v => v.english.toUpperCase().replace(/\s/g, '') === word);
            return (
              <div 
                key={word}
                className="glass-card hover-scale"
                style={{ 
                  padding: '0.5rem 1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  background: isFound ? 'var(--color-success)' : 'white',
                  color: isFound ? 'white' : 'black',
                  cursor: 'pointer'
                }}
                onClick={() => orig && speak(orig.english)}
              >
                <span style={{ fontWeight: 'bold' }}>{word}</span>
                {isFound && <span>✅</span>}
                {!isFound && <Volume2 size={16} />}
              </div>
            );
          })}
        </div>

        {/* The Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, 
            gap: '0.5rem',
            background: 'var(--color-primary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {grid.map((row, r) => 
            row.map((cell, c) => {
              const isSelected = selectionStart?.r === r && selectionStart?.c === c;
              return (
                <button
                  key={`${r}-${c}`}
                  className="hover-scale"
                  style={{
                    width: '3rem',
                    height: '3rem',
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    background: cell.isTarget 
                      ? 'var(--color-success)' 
                      : isSelected 
                        ? 'var(--color-accent)' 
                        : 'white',
                    color: cell.isTarget || isSelected ? 'white' : 'var(--color-text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell.letter}
                </button>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
