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

  // Debounce the actual push logic
  return new Promise((resolve) => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    syncTimeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('students')
          .upsert({
            id: studentId,
            name,
            points,
            badges,
            clear_counts,
            dictionary_progress,
            reflections,
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
    // Prefer DB values per category, but keep any local categories the DB doesn't have.
    const localDictProgress = localStudentData.dictProgress || {};
    const dbDictProgress = data.dictionary_progress || {};
    const mergedDictProgress = { ...localDictProgress, ...dbDictProgress };

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
    
    return true;
  }
  return false;
};
