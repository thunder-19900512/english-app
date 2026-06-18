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
    if (data.name) localStorage.setItem('studentName', data.name);
    if (data.points !== undefined) localStorage.setItem(`points_${studentId}`, data.points.toString());
    
    const studentData = { id: studentId, name: data.name, badges: data.badges || [], lastAccess: data.last_access };
    localStorage.setItem(`student_${studentId}`, JSON.stringify(studentData));
    
    if (data.clear_counts) localStorage.setItem(`clearCounts_${studentId}`, JSON.stringify(data.clear_counts));
    if (data.dictionary_progress) localStorage.setItem(`dict_progress_${studentId}`, JSON.stringify(data.dictionary_progress));
    if (data.reflections) localStorage.setItem(`reflections_${studentId}`, JSON.stringify(data.reflections));
    
    return true;
  }
  return false;
};
