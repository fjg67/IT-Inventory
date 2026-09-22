const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWeirdUrls() {
  const { data: articles, error } = await supabase
    .from('Article')
    .select('id, name, imageUrl')
    .eq('isArchived', false);
    
  if (error) {
      console.error(error);
      return;
  }
  
  const weird = [];
  for (const a of articles) {
      if (a.imageUrl === null) continue; // we already fixed nulls (hopefully all of them)
      
      const url = a.imageUrl.trim();
      if (url === '' || !url.startsWith('http')) {
          weird.push(a);
      }
  }
  
  console.log(`Found ${weird.length} active articles with empty or non-http image URLs.`);
  if (weird.length > 0) {
      for (const a of weird) {
          console.log(`- ${a.name} | URL: "${a.imageUrl}"`);
      }
  }
}

checkWeirdUrls();
