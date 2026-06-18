import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ifaqtjttrjskflgrebnh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYXF0anR0cmpza2ZsZ3JlYm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDQzOTEsImV4cCI6MjA5NzM4MDM5MX0.XgujUIpIz4S-deaA8MRITHTNN_Xmwkv0jo6km-Lb9GY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetAllData() {
  console.log('Resetting all student data...');
  const { data, error } = await supabase
    .from('students')
    .update({
      points: 0,
      badges: [],
      clear_counts: {},
      dictionary_progress: {},
      reflections: [],
      last_access: null
    })
    .neq('id', 'dummy'); // A condition that matches all rows (if id != 'dummy', which is basically all real users)
  
  if (error) {
    console.error('Error resetting data:', error);
  } else {
    console.log('Successfully reset all data in Supabase.');
  }
}

resetAllData();
