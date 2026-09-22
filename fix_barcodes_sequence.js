const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBarcodes() {
  // Update Scanner chèque
  await supabase
    .from('Article')
    .update({ barcode: '1600002', reference: '1600002' })
    .eq('name', 'Scanner chèque');
    
  // Update Casque défectueux
  await supabase
    .from('Article')
    .update({ barcode: '1100011', reference: '1100011' })
    .eq('name', 'Casque défectueux');
    
  console.log('Successfully updated scanner and casque to follow the sequence.');
}

fixBarcodes();
