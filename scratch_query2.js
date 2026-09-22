const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: stockData, error: stockError } = await supabase
    .from('StockSite')
    .select('*')
    .limit(5);
    
  if (stockError) {
    console.log('Error StockSite:', stockError.message);
  } else {
    console.log('StockSite:', stockData);
  }
  
  const { data: siteData, error: siteError } = await supabase
    .from('Site')
    .select('*');
    
  if (siteError) console.log('Error Site:', siteError.message);
  else console.log('Site:', siteData);
}

main();
