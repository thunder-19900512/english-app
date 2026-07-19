import { supabase } from './supabase';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export const pushToSupabase = async (studentId: string): Promise<void> => {
  if (!supabase) return;

  // Capture current state synchronously before debounce
  const name = localStorage.getItem('studentName') || 'ゲスト';
  const points = parseInt(localStorage.getItem(`points_${studentId}`) || '0', 10);
  
  const countsStr = localStorage.getItem(`clearCounts_${studentId}`);
  const clear_counts = countsStr ? JSON.parse(countsStr) : {};
  
  const refStr = localStorage.getItem(`reflections_${studentId}`);
  const reflections = refStr ? JSON.parse(refStr) : [];

  const studentDataStr = localStorage.getItem(`student_${studentId}`);
  const parsedStudentData = studentDataStr ? JSON.parse(studentDataStr) : {};
  const badges = parsedStudentData.badges || [];
  // Dictionary progress is stored inside the student_<id> object (see useDictionaryProgress)
  const dictionary_progress = parsedStudentData.dictProgress || {};

  // 発音スコアの履歴（メタ認知・推移グラフ用）
  const pronStr = localStorage.getItem(`pronHistory_${studentId}`);
  const pronunciation_history = pronStr ? JSON.parse(pronStr) : [];

  // Debounce the actual push logic
  return new Promise((resolve) => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(async () => {
      try {
        // ★保存は「上書き」ではなく「マージ」。まずDBの現在値を読み、ローカルと統合してから書く。
        //   こうしないと、ローカルが空/古い状態でpushが走ったときにDBのふりかえり等を
        //   まるごと消してしまう（実際に複数の児童のふりかえりが消えた原因）。
        const { data: dbRow, error: readErr } = await supabase!
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();

        if (readErr && readErr.code !== 'PGRST116') {
          // 読み込み失敗（通信エラー等）：DBを壊さないため、空のコレクションは送らない
          //   （＝そのカラムはDBの値を維持）。値のあるものだけ更新する。
          const safe: Record<string, any> = { id: studentId, name, points, last_access: new Date().toISOString() };
          if (badges.length) safe.badges = badges;
          if (Object.keys(clear_counts).length) safe.clear_counts = clear_counts;
          if (Object.keys(dictionary_progress).length) safe.dictionary_progress = dictionary_progress;
          if (reflections.length) safe.reflections = reflections;
          if (pronunciation_history.length) safe.pronunciation_history = pronunciation_history;
          const { error } = await supabase!.from('students').upsert(safe, { onConflict: 'id' });
          if (error) console.error('Failed to sync to Supabase (safe mode)', error);
          resolve();
          return;
        }

        const db: any = dbRow || {};

        // ポイント：多いほうを採用（減らさない）
        const mergedPoints = Math.max(points, db.points || 0);

        // バッジ：和集合
        const mergedBadges = Array.from(new Set([...(db.badges || []), ...badges]));

        // クリア回数：キーごとに大きいほう
        const mergedClearCounts: Record<string, number> = { ...(db.clear_counts || {}) };
        for (const [k, v] of Object.entries(clear_counts)) {
          mergedClearCounts[k] = Math.max(Number(v) || 0, mergedClearCounts[k] || 0);
        }

        // 辞書進捗：カテゴリ×フラグのOR（バッジは一度ついたら消えない）＋ベストタイムは速いほう
        const FLAG_KEYS = ['learn', 'practice', 'spelling', 'voice', 'wordsearch'] as const;
        const dbDict = db.dictionary_progress || {};
        const mergedDict: Record<string, any> = { ...dbDict };
        for (const cat of new Set([...Object.keys(dictionary_progress), ...Object.keys(dbDict)])) {
          const l = dictionary_progress[cat] || {};
          const d = dbDict[cat] || {};
          const m: Record<string, any> = { ...d, ...l };
          for (const fk of FLAG_KEYS) m[fk] = !!(l[fk] || d[fk]);
          const times = [l.wordsearch_best_time, d.wordsearch_best_time].filter((t: any) => typeof t === 'number');
          if (times.length) m.wordsearch_best_time = Math.min(...times);
          mergedDict[cat] = m;
        }

        // ふりかえり：id（＝作成時刻）で和集合。先生コメント/スタンプは持っているほうを優先して残す
        //   （子ども側のpushが先生の記入を消す、逆向きの消失も防ぐ）。
        const reflMap = new Map<string, any>();
        for (const r of (db.reflections || [])) if (r && r.id) reflMap.set(r.id, r);
        for (const r of reflections) {
          if (!r || !r.id) continue;
          const prev = reflMap.get(r.id) || {};
          reflMap.set(r.id, {
            ...prev, ...r,
            teacherComment: r.teacherComment || prev.teacherComment || '',
            teacherStamp: r.teacherStamp || prev.teacherStamp || '',
          });
        }
        const mergedReflections = Array.from(reflMap.values())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 発音履歴：tsで和集合、古い順、直近300件
        const pronMap = new Map<number, any>();
        for (const p of [...(db.pronunciation_history || []), ...pronunciation_history]) {
          if (p && typeof p.ts === 'number') pronMap.set(p.ts, p);
        }
        const mergedPron = Array.from(pronMap.values()).sort((a, b) => a.ts - b.ts).slice(-300);

        const { error } = await supabase!
          .from('students')
          .upsert({
            id: studentId,
            name,
            points: mergedPoints,
            badges: mergedBadges,
            clear_counts: mergedClearCounts,
            dictionary_progress: mergedDict,
            reflections: mergedReflections,
            pronunciation_history: mergedPron,
            last_access: new Date().toISOString()
          }, { onConflict: 'id' });

        if (error) {
          console.error('Failed to sync to Supabase', error);
        }
      } catch (err) {
        console.error('Network error during sync', err);
      }
      resolve();
    }, 500); // 500ms debounce
  });
};

export const pullFromSupabase = async (studentId: string) => {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
    
  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 means zero rows returned (not found)
      console.error('Failed to pull from Supabase', error);
    }
    return false;
  }
  
  if (data) {
    // Restore to local storage
    const currentName = localStorage.getItem('studentName') || data.name;
    if (!localStorage.getItem('studentName') && data.name) {
      localStorage.setItem('studentName', data.name);
    }
    
    // Merge points (take the max)
    const localPoints = parseInt(localStorage.getItem(`points_${studentId}`) || '0', 10);
    const dbPoints = data.points || 0;
    const maxPoints = Math.max(localPoints, dbPoints);
    localStorage.setItem(`points_${studentId}`, maxPoints.toString());
    
    // Read existing local student object once
    const localStudentDataStr = localStorage.getItem(`student_${studentId}`);
    const localStudentData = localStudentDataStr ? JSON.parse(localStudentDataStr) : {};

    // Merge badges (union)
    const localBadges = localStudentData.badges || [];
    const dbBadges = data.badges || [];
    const mergedBadges = Array.from(new Set([...localBadges, ...dbBadges]));

    // Merge dictionary progress (stored inside the student_<id> object as dictProgress).
    // ★クリア印（モードごとのバッジ）は「一度ついたら消えない」が正しい意味なので、
    //   カテゴリ単位の上書きではなく、フラグ単位のOR（どちらかがtrueならtrue）でマージする。
    //   こうしないと、push(500msデバウンス)が反映される前にaddPointsのpullが走ったとき、
    //   DBの古いカテゴリ値がローカルの新しいバッジを丸ごと消してしまう（バッジ消失バグ）。
    const localDictProgress = localStudentData.dictProgress || {};
    const dbDictProgress = data.dictionary_progress || {};
    const FLAG_KEYS = ['learn', 'practice', 'spelling', 'voice', 'wordsearch'] as const;
    const mergedDictProgress: Record<string, any> = { ...localDictProgress };
    for (const cat of new Set([...Object.keys(localDictProgress), ...Object.keys(dbDictProgress)])) {
      const localVal = localDictProgress[cat] || {};
      const dbVal = dbDictProgress[cat] || {};
      const merged: Record<string, any> = { ...localVal, ...dbVal };
      // クリアフラグはOR（trueが勝つ）＝片方が古くてもバッジを落とさない
      for (const k of FLAG_KEYS) merged[k] = !!(localVal[k] || dbVal[k]);
      // ワードサーチのベストタイムは速いほう（小さいほう）を残す
      const times = [localVal.wordsearch_best_time, dbVal.wordsearch_best_time].filter((t: any) => typeof t === 'number');
      if (times.length) merged.wordsearch_best_time = Math.min(...times);
      mergedDictProgress[cat] = merged;
    }

    const studentData = {
      id: studentId,
      name: currentName,
      badges: mergedBadges,
      dictProgress: mergedDictProgress,
      lastAccess: data.last_access,
    };
    localStorage.setItem(`student_${studentId}`, JSON.stringify(studentData));

    // For clear_counts and reflections we keep DB data if present.
    if (data.clear_counts && Object.keys(data.clear_counts).length > 0) localStorage.setItem(`clearCounts_${studentId}`, JSON.stringify(data.clear_counts));
    
    // Merge reflections
    const localReflectionsStr = localStorage.getItem(`reflections_${studentId}`);
    const localReflections = localReflectionsStr ? JSON.parse(localReflectionsStr) : [];
    const dbReflections = data.reflections || [];
    const mergedReflectionsMap = new Map();
    [...localReflections, ...dbReflections].forEach(r => mergedReflectionsMap.set(r.id, r));
    const mergedReflections = Array.from(mergedReflectionsMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(`reflections_${studentId}`, JSON.stringify(mergedReflections));

    // Merge pronunciation history (dedupe by ts, sort oldest→newest, cap to last 300)
    const localPronStr = localStorage.getItem(`pronHistory_${studentId}`);
    const localPron = localPronStr ? JSON.parse(localPronStr) : [];
    const dbPron = data.pronunciation_history || [];
    const pronMap = new Map<number, any>();
    [...localPron, ...dbPron].forEach((r: any) => { if (r && typeof r.ts === 'number') pronMap.set(r.ts, r); });
    const mergedPron = Array.from(pronMap.values())
      .sort((a, b) => a.ts - b.ts)
      .slice(-300);
    localStorage.setItem(`pronHistory_${studentId}`, JSON.stringify(mergedPron));

    return true;
  }
  return false;
};
