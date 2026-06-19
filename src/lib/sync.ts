import { supabase } from './supabase';

export const pushToSupabase = async (studentId: string) => {
  if (!supabase) return;

  const name = localStorage.getItem('studentName') || 'ゲスト';
  const points = parseInt(localStorage.getItem(`points_${studentId}`) || '0', 10);
  
  const studentDataStr = localStorage.getItem(`student_${studentId}`);
  const badges = studentDataStr ? JSON.parse(studentDataStr).badges || [] : [];
  
  const clearCountsStr = localStorage.getItem(`clearCounts_${studentId}`);
  const clearCounts = clearCountsStr ? JSON.parse(clearCountsStr) : {};
  
  const dictProgressStr = localStorage.getItem(`dict_progress_${studentId}`);
  const dictionaryProgress = dictProgressStr ? JSON.parse(dictProgressStr) : {};
  
  const reflectionsStr = localStorage.getItem(`reflections_${studentId}`);
  const reflections = reflectionsStr ? JSON.parse(reflectionsStr) : [];

  const { error } = await supabase
    .from('students')
    .upsert({
      id: studentId,
      name,
      points,
      badges,
      clear_counts: clearCounts,
      dictionary_progress: dictionaryProgress,
      reflections,
      last_access: new Date().toISOString()
    }, { onConflict: 'id' });
    
  if (error) console.error('Failed to sync to Supabase', error);
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
    
    // Merge badges (union)
    const localStudentDataStr = localStorage.getItem(`student_${studentId}`);
    const localBadges = localStudentDataStr ? JSON.parse(localStudentDataStr).badges || [] : [];
    const dbBadges = data.badges || [];
    const mergedBadges = Array.from(new Set([...localBadges, ...dbBadges]));
    
    const studentData = { id: studentId, name: currentName, badges: mergedBadges, lastAccess: data.last_access };
    localStorage.setItem(`student_${studentId}`, JSON.stringify(studentData));
    
    // For clear_counts, dictionary_progress, reflections, we ideally merge deeply, 
    // but for simplicity we will just overwrite if local is empty, or keep local if it has data but DB is empty.
    // A robust way is to just use DB data, but since points and badges are the most critical, they are merged.
    if (data.clear_counts && Object.keys(data.clear_counts).length > 0) localStorage.setItem(`clearCounts_${studentId}`, JSON.stringify(data.clear_counts));
    if (data.dictionary_progress && Object.keys(data.dictionary_progress).length > 0) localStorage.setItem(`dict_progress_${studentId}`, JSON.stringify(data.dictionary_progress));
    
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
