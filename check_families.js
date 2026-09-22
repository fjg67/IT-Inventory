const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  const { data: articles, error } = await supabase
    .from('Article')
    .select('name, category, articleType, sousType')
    .limit(200);
    
  if (error) return;
  
  for (const a of articles) {
      const n = a.name.toLowerCase();
      if (n.includes('pc') || n.includes('ordinateur') || n.includes('mac') || a.articleType?.toLowerCase().includes('pc') || a.sousType?.toLowerCase().includes('pc')) {
          console.log(`- ${a.name}: category: '${a.category}', type: '${a.articleType}', sousType: '${a.sousType}'`);
      }
  }
}

checkAll();
