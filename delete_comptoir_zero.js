const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const siteId = 'cmlvlagsi00015d2s5kn6k1he'; // Comptoir
  
  const { data: stockData } = await supabase
    .from('ArticleStock')
    .select('id, articleId, quantity')
    .eq('siteId', siteId)
    .eq('quantity', 0);
    
  console.log(`Found ${stockData.length} articles with 0 stock at Comptoir.`);
  
  if (stockData.length === 0) return;
  
  const articleIds = stockData.map(s => s.articleId);
  
  // Try to archive them instead of deleting to avoid foreign key issues
  const { error: archiveError, count } = await supabase
    .from('Article')
    .update({ isArchived: true })
    .in('id', articleIds);
    
  if (archiveError) {
    console.log('Error archiving articles:', archiveError.message);
  } else {
    console.log(`Successfully archived ${articleIds.length} articles.`);
  }
  
  // Also delete the ArticleStock entry? Maybe not needed if archived, but let's do it to keep it clean.
  const { error: delError } = await supabase
    .from('ArticleStock')
    .delete()
    .in('id', stockData.map(s => s.id));
    
  if (delError) {
    console.log('Error deleting ArticleStock:', delError.message);
  } else {
    console.log(`Successfully deleted ${stockData.length} ArticleStock entries.`);
  }
}

main();
