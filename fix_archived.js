const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data: archived } = await supabase
    .from('Article')
    .select('id')
    .eq('isArchived', true);
    
  if (!archived || archived.length === 0) return;
  const archivedIds = archived.map(a => a.id);
  
  const { data: stocks } = await supabase
    .from('ArticleStock')
    .select('articleId, quantity')
    .in('articleId', archivedIds)
    .gt('quantity', 0);
    
  if (!stocks || stocks.length === 0) {
      console.log('No archived articles with positive stock found.');
      return;
  }
  
  const toUnarchive = [...new Set(stocks.map(s => s.articleId))];
  console.log(`Found ${toUnarchive.length} archived articles that actually have positive stock. Unarchiving them...`);
  
  const { error } = await supabase
    .from('Article')
    .update({ isArchived: false })
    .in('id', toUnarchive);
    
  if (error) {
      console.log('Error unarchiving:', error.message);
  } else {
      console.log('Successfully unarchived.');
  }
}

fix();
