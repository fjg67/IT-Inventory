const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_tables'); // rpc might not exist, wait
  // let's just query a known REST endpoint or postgrest
  // Actually, I'll fetch Article table and maybe the stock is inside Article?
  // Wait, I fetched `Article` and saw `minStock` but no `quantity` or `stock` field.
  const { data: d2, error: e2 } = await supabase
      .from('Article')
      .select('*')
      .limit(1);
  console.log(d2);
}

main();
