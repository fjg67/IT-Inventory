const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: siteData } = await supabase
    .from('Site')
    .select('id, name')
    .ilike('name', '%Comptoir%');
    
  console.log('Comptoir Sites:', siteData);
  const siteId = siteData[0].id;
  
  const { data: stockData, error: stockError } = await supabase
    .from('ArticleStock')
    .select('id, articleId, quantity')
    .eq('siteId', siteId)
    .eq('quantity', 0);
    
  console.log('Zero stock entries at Comptoir:', stockData?.length);
  
  if (stockData && stockData.length > 0) {
    console.log('Sample zero stock entry:', stockData[0]);
    // Check if these articles have stock elsewhere
    const { data: otherStocks } = await supabase
        .from('ArticleStock')
        .select('articleId, quantity, siteId')
        .eq('articleId', stockData[0].articleId);
    console.log('Other stocks for this article:', otherStocks);
  }
}

main();
