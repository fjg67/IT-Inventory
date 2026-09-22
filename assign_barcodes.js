const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBarcodes() {
  const newNames = [
    'Scanner chèque',
    'PC siège à usiner',
    'PC agence à usiner',
    'Casque défectueux'
  ];
  
  const { data: articles, error } = await supabase
    .from('Article')
    .select('id, name, codeFamille')
    .in('name', newNames);
    
  if (error) {
      console.error(error);
      return;
  }
  
  for (const a of articles) {
      let newBarcode = '';
      if (a.codeFamille) {
          // e.g. 16 + 6 random digits
          const randomDigits = Math.floor(100000 + Math.random() * 900000);
          newBarcode = `${a.codeFamille}${randomDigits}`;
      } else {
          // generate an AO one just in case it needs to be refreshed, or skip
          continue; 
      }
      
      const { error: updateErr } = await supabase
        .from('Article')
        .update({ barcode: newBarcode })
        .eq('id', a.id);
        
      if (updateErr) {
          console.error(`Error updating ${a.name}:`, updateErr.message);
      } else {
          console.log(`Updated ${a.name} with barcode ${newBarcode}`);
      }
  }
}

updateBarcodes();
