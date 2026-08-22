import { supabase } from '../lib/supabase';

export interface Student {
  id: string;
  name: string;
  grade: number;
  home?: number;        // ホーム（組）番号
  cls?: 'A' | 'B';      // 英語の A/B クラス（5・6年）
}

// ★重要：名簿（実名）は、このファイルにも、どのソースコードにも書かない。
//   ここに書くと、ビルドされたJSに含まれて公開URLから誰でも読めてしまう。
//   名簿はSupabaseの students テーブルにあり、
//   「あいことば」でログインした人だけが読める（RLSで保護）。
//
//   この配列は起動直後は空で、ClassGateを通過したあと loadRoster() が中身を入れる。
//   中身を入れ替えるだけで配列そのものは作り直さないので、
//   すでに import している画面はこれまでどおり STUDENTS を使える。
export const STUDENTS: Student[] = [];

export const isRosterLoaded = (): boolean => STUDENTS.length > 0;

/** Supabaseから名簿を読み込む。ClassGate通過後に一度だけ呼ぶ。 */
export async function loadRoster(): Promise<void> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, grade, home, cls')
    .not('grade', 'is', null)   // 設定用の行（app_settings_v1 など）を除く
    .order('id');

  if (error) throw error;

  STUDENTS.length = 0;
  for (const r of data ?? []) {
    STUDENTS.push({
      id: r.id as string,
      name: r.name as string,
      grade: r.grade as number,
      home: (r.home ?? undefined) as number | undefined,
      cls: (r.cls ?? undefined) as 'A' | 'B' | undefined,
    });
  }
}
