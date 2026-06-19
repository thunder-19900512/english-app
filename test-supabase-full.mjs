import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('students').upsert({
    id: 'test_id_full',
    name: 'Test Name',
    points: 100,
    badges: [1, 2],
    clear_counts: {},
    dictionary_progress: {},
    reflections: [],
    last_access: new Date().toISOString()
  }, { onConflict: 'id' });
  console.log('Upsert result:', { data, error });
}

test();
