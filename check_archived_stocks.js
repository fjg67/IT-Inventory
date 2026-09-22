const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: archived } = await supabase
    .from('Article')
    .select('id')
    .eq('isArchived', true);
    
  if (!archived) return;
  const archivedIds = archived.map(a => a.id);
  
  const { data: stocks } = await supabase
    .from('ArticleStock')
    .select('articleId, siteId, quantity')
    .in('articleId', archivedIds);
    
  let otherStocks = 0;
  if (stocks) {
      for (const stock of stocks) {
          if (stock.quantity > 0) {
              otherStocks++;
              console.log(`Archived article ${stock.articleId} has ${stock.quantity} stock at site ${stock.siteId}`);
          }
      }
  }
  console.log(`Found ${otherStocks} positive stock entries for archived articles.`);
}

check();
