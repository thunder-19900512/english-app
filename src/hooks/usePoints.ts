import { useState, useCallback, useEffect } from 'react';
import { pushToSupabase, pullFromSupabase } from '../lib/sync';
import { showToast } from '../components/ui/Toast';

export const usePoints = () => {
  const studentId = localStorage.getItem('studentId');

  const getPoints = useCallback(() => {
    if (!studentId) return 0;
    const pts = localStorage.getItem(`points_${studentId}`);
    return pts ? parseInt(pts, 10) : 0;
  }, [studentId]);

  const [totalPoints, setTotalPoints] = useState<number>(getPoints());

  useEffect(() => {
    const handlePointsUpdate = () => {
      setTotalPoints(getPoints());
    };
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate);
  }, [getPoints]);

  const consumePoints = useCallback(async (amount: number): Promise<boolean> => {
    if (!studentId) return false;
    
    // Always sync latest points first
    await pullFromSupabase(studentId);
    
    const currentPoints = getPoints();
    if (currentPoints < amount) {
      return false; // Not enough points
    }
    
    const newTotal = currentPoints - amount;
    localStorage.setItem(`points_${studentId}`, newTotal.toString());
    setTotalPoints(newTotal);
    window.dispatchEvent(new Event('pointsUpdated'));
    pushToSupabase(studentId);
    
    return true;
  }, [studentId, getPoints]);

  const addPoints = useCallback(async (
    stageKey: string, 
    options: { isPerfect?: boolean, isNewRecord?: boolean, multiplier?: number } = {}
  ) => {
    if (!studentId) return 0;

    // 先に最新データをSupabaseから取り込む。
    // （あとで clearCounts を更新するより前にやらないと、pullがDBの古い値で
    //   こちらの増分を上書きして「クリア記録が消える」バグになる）
    await pullFromSupabase(studentId);

    // Load clear counts（pull後の最新を読む）
    const countsKey = `clearCounts_${studentId}`;
    const countsStr = localStorage.getItem(countsKey);
    const clearCounts = countsStr ? JSON.parse(countsStr) : {};

    // Determine current clear count for this stage
    const currentCount = clearCounts[stageKey] || 0;

    // Calculate base points（繰り返すほど減り、最終的には0ポイントに＝荒稼ぎ防止）
    let earned = 0;
    if (currentCount === 0) earned = 20;       // 1回目
    else if (currentCount === 1) earned = 10;  // 2回目
    else if (currentCount === 2) earned = 5;   // 3回目
    else if (currentCount === 3) earned = 2;   // 4回目
    else if (currentCount === 4) earned = 1;   // 5回目
    else earned = 0;                           // 6回目以降は0ポイント

    // ボーナスは最初の2回まで（連打で荒稼ぎできないように）
    if (currentCount <= 1) {
      if (options.isPerfect) earned += 5;
      if (options.isNewRecord) earned += 10;
    }

    // Apply multiplier if provided (for scaled down modes)
    // ※ earnedが0のとき（逓減しきった後）はMath.maxで1に復活させない。
    if (options.multiplier !== undefined && options.multiplier < 1 && earned > 0) {
      earned = Math.max(1, Math.round(earned * options.multiplier));
    }

    // Update clear counts
    clearCounts[stageKey] = currentCount + 1;
    localStorage.setItem(countsKey, JSON.stringify(clearCounts));

    // Update total points
    const currentPoints = getPoints();
    const newTotal = currentPoints + earned;
    localStorage.setItem(`points_${studentId}`, newTotal.toString());
    setTotalPoints(newTotal);
    window.dispatchEvent(new Event('pointsUpdated'));

    // Sync to Supabase in the background
    pushToSupabase(studentId);

    // 「今見ている画面のそば」に必ず出る通知（画面上部まで戻らなくても分かるように）
    if (earned > 0) {
      showToast(`🎉 クリア！ ＋${earned}ポイント ゲット！`, 'points');
    } else {
      showToast('🎉 クリア！（くりかえしのため、今回はポイントなし）', 'success');
    }

    return earned;
  }, [studentId, getPoints]);

  return { getPoints, addPoints, consumePoints, totalPoints, setTotalPoints };
};
