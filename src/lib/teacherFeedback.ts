import { supabase } from './supabase';

// 先生が、ある児童のふりかえり1件にコメント／スタンプを付ける（ふりかえりの双方向化）。
// 対象児童の students 行の reflections 配列だけを更新する（他の列は触らない）。
export const saveTeacherFeedback = async (
  studentId: string,
  reflectionId: string,
  teacherComment: string,
  teacherStamp: string
): Promise<{ error: any; reflections: any[] }> => {
  if (!supabase) return { error: new Error('no supabase'), reflections: [] };
  const { data } = await supabase
    .from('students')
    .select('reflections')
    .eq('id', studentId)
    .single();
  const reflections = (data?.reflections || []).map((r: any) =>
    r.id === reflectionId
      ? { ...r, teacherComment: teacherComment.trim(), teacherStamp: teacherStamp || '' }
      : r
  );
  const { error } = await supabase.from('students').update({ reflections }).eq('id', studentId);
  return { error, reflections };
};
