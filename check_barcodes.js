const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHighestBarcode() {
  const { data: articles, error } = await supabase
    .from('Article')
    .select('barcode')
    .not('barcode', 'is', null)
    .like('barcode', 'AO%');
    
  if (error) {
      console.error(error);
      return;
  }
  
  let max = 0;
  for (const a of articles) {
      const numStr = a.barcode.substring(2);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > max) {
          max = num;
      }
  }
  
  console.log(`Highest AO barcode number: AO${max}`);
}

checkHighestBarcode();
