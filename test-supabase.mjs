import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('students').upsert({
    id: 'test_id_123',
    name: 'Test Name',
    points: 100,
    badges: [1, 2],
    last_access: new Date().toISOString()
  }, { onConflict: 'id' });
  console.log('Upsert result:', { data, error });
  
  const { data: d2, error: e2 } = await supabase.from('students').select('*');
  console.log('Select result:', { data: d2, error: e2 });
}

test();
