const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingPhotos() {
  const { data: articles, error } = await supabase
    .from('Article')
    .select('id, name, brand, category, articleType, sousType')
    .is('imageUrl', null)
    .eq('isArchived', false);
    
  if (error) {
      console.error(error);
      return;
  }
  
  console.log(`Found ${articles.length} active articles missing photos.`);
  if (articles.length > 0) {
      console.log('Sample:');
      for (let i = 0; i < Math.min(10, articles.length); i++) {
          console.log(`- ${articles[i].name} (Brand: ${articles[i].brand})`);
      }
  }
}

checkMissingPhotos();
