import { useState, useCallback, useEffect } from 'react';
import { pushToSupabase, pullFromSupabase } from '../lib/sync';
import { showToast } from '../components/ui/Toast';
import { currentMission, MISSION_MULTIPLIER } from '../lib/missionBonus';
import { isTrialId } from '../lib/trial';

// ボーナスの重ねがけの上限（ミッション×やりきり等）
const MAX_MULTIPLIER = 2;

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

    // お試しアカウント（Test／おためし）はポイントをためない。
    // 代わりに「子どもならいくらもらえるか（1回目の点）」を見せる。サーバとのやり取りもしない
    if (isTrialId(studentId)) {
      const mission = currentMission();
      const mul = Math.min((options.multiplier !== undefined ? options.multiplier : 1) * (mission ? MISSION_MULTIPLIER : 1), MAX_MULTIPLIER);
      let earned = 20 + (options.isPerfect ? 5 : 0) + (options.isNewRecord ? 10 : 0);
      if (mul !== 1) earned = Math.max(1, Math.round(earned * mul));
      showToast(`🎉 クリア！ 子どもたちには ＋${earned}ポイント たまります（お試しでは たまりません）`, 'success');
      return 0;
    }

    // 先に最新データをSupabaseから取り込む。
    // （あとで clearCounts を更新するより前にやらないと、pullがDBの古い値で
    //   こちらの増分を上書きして「クリア記録が消える」バグになる）
    //
    // ★pullが失敗（通信断など）したときは、この端末のローカル値が古い可能性がある。
    //   そのまま加点してpushすると、他端末で貯めた記録を古い値で塗り替えかねないので、
    //   1回だけ待って再試行する。それでもダメなら加点はするが、その旨を伝える。
    let synced = await pullFromSupabase(studentId);
    if (!synced) {
      await new Promise(r => setTimeout(r, 800));
      synced = await pullFromSupabase(studentId);
    }

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

    // 倍率をかける。正答率のような「減らす倍率」と、今日のミッションのような
    // 「増やす倍率」の両方に効く。
    // ※ earnedが0のとき（逓減しきった後）はMath.maxで1に復活させない＝連打で稼げない。
    const mission = currentMission();
    const missionMul = mission ? MISSION_MULTIPLIER : 1;
    // ボーナスが重なっても最大2倍まで。1回のクリアで稼ぎすぎて、
    // 他の活動やショップ・町のバランスが壊れないようにする。
    const raw = (options.multiplier !== undefined ? options.multiplier : 1) * missionMul;
    const mul = Math.min(raw, MAX_MULTIPLIER);
    if (mul !== 1 && earned > 0) {
      earned = Math.max(1, Math.round(earned * mul));
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

    if (!synced) {
      // 記録はローカルに残る（次に通信できたときpushされる）が、子どもに気づかせる
      showToast('📶 通信が 不安定です。先生に 伝えてね', 'fail');
    }

    // 「今見ている画面のそば」に必ず出る通知（画面上部まで戻らなくても分かるように）
    if (earned > 0) {
      showToast(
        mission
          ? `🎯 今日のミッション！ ＋${earned}ポイント（${MISSION_MULTIPLIER}倍ボーナス）`
          : `🎉 クリア！ ＋${earned}ポイント ゲット！`,
        'points');
    } else {
      showToast('🎉 クリア！（くり返しのため、今回はポイントなし）', 'success');
    }

    return earned;
  }, [studentId, getPoints]);

  // 逓減ルールに乗せない「固定ポイント」。毎日書く「ふりかえり」のように、
  // くり返すこと自体が目的の活動に使う（addPoints だと5日目以降は1→0Pになり、
  // がんばって書いたのに1P、という状態になっていた）。
  // 回数の上限（1日1回など）は呼び出し側で守ること。points は累計・単調増加のまま。
  const addFixedPoints = useCallback(async (stageKey: string, amount: number): Promise<number> => {
    if (!studentId || amount <= 0) return 0;
    if (isTrialId(studentId)) {
      showToast(`🎉 子どもたちには ＋${Math.round(amount)}ポイント たまります（お試しでは たまりません）`, 'success');
      return 0;
    }
    let synced = await pullFromSupabase(studentId);
    if (!synced) { await new Promise(r => setTimeout(r, 800)); synced = await pullFromSupabase(studentId); }
    const countsKey = `clearCounts_${studentId}`;
    const clearCounts = JSON.parse(localStorage.getItem(countsKey) || '{}');
    clearCounts[stageKey] = (clearCounts[stageKey] || 0) + 1; // 記録としては数える
    localStorage.setItem(countsKey, JSON.stringify(clearCounts));
    const newTotal = getPoints() + Math.round(amount);
    localStorage.setItem(`points_${studentId}`, newTotal.toString());
    setTotalPoints(newTotal);
    window.dispatchEvent(new Event('pointsUpdated'));
    pushToSupabase(studentId);
    if (!synced) showToast('📶 通信が 不安定です。先生に 伝えてね', 'fail');
    return Math.round(amount);
  }, [studentId, getPoints]);

  return { getPoints, addPoints, addFixedPoints, consumePoints, totalPoints, setTotalPoints };
};
