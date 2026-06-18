import { useState, useCallback } from 'react';

export const usePoints = () => {
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const studentId = localStorage.getItem('studentId');

  const getPoints = useCallback(() => {
    if (!studentId) return 0;
    const pts = localStorage.getItem(`points_${studentId}`);
    return pts ? parseInt(pts, 10) : 0;
  }, [studentId]);

  const addPoints = useCallback((
    stageKey: string, 
    options: { isPerfect?: boolean, isNewRecord?: boolean, multiplier?: number } = {}
  ) => {
    if (!studentId) return 0;

    // Load clear counts
    const countsKey = `clearCounts_${studentId}`;
    const countsStr = localStorage.getItem(countsKey);
    const clearCounts = countsStr ? JSON.parse(countsStr) : {};

    // Determine current clear count for this stage
    const currentCount = clearCounts[stageKey] || 0;
    
    // Calculate base points
    let earned = 0;
    if (currentCount === 0) earned += 20; // First time
    else if (currentCount === 1) earned += 10; // Second time
    else earned += 5; // Third time and beyond

    // Bonuses
    if (options.isPerfect) earned += 5;
    if (options.isNewRecord) earned += 10;

    // Apply multiplier if provided (for scaled down modes)
    if (options.multiplier !== undefined && options.multiplier < 1) {
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

    // Sync to Supabase in the background
    import('../lib/sync').then(({ pushToSupabase }) => {
      pushToSupabase(studentId);
    });

    return earned;
  }, [studentId, getPoints]);

  return { getPoints, addPoints, totalPoints, setTotalPoints };
};
