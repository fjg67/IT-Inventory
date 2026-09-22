const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidentPC() {
  const { data: articles, error } = await supabase
    .from('Article')
    .select('name, reference, barcode')
    .eq('category', 'Incident PC');
    
  if (error) {
      console.error(error);
      return;
  }
  
  console.log('Articles in Incident PC:');
  for (const a of articles) {
      console.log(`- ${a.name}: reference='${a.reference}', barcode='${a.barcode}'`);
  }
}

checkIncidentPC();
