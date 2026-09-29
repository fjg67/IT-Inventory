const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listMissingPhotos() {
  const { data, error } = await supabase
    .from('Article')
    .select('id, name, imageUrl')
    .is('imageUrl', null);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${data.length} articles missing photos:`);
    data.forEach(a => console.log(`- ${a.name}`));
  }
}

listMissingPhotos();
