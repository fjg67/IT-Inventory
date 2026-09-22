const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

const imagePaths = {
  scanner_cheque: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/scanner_cheque_1789595397288.jpg',
  broken_laptop: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/broken_laptop_1789595405728.jpg',
  casque_defectueux: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/casque_defectueux_1789595413784.jpg'
};

const articleToImageMap = {
  'Scanner chèque': 'scanner_cheque',
  'PC siège à usiner': 'broken_laptop',
  'PC agence à usiner': 'broken_laptop',
  'Casque défectueux': 'casque_defectueux'
};

async function uploadAndAssign() {
  const uploadedUrls = {};

  // Upload
  for (const [key, path] of Object.entries(imagePaths)) {
    if (fs.existsSync(path)) {
      const buffer = fs.readFileSync(path);
      const filename = `articles/${key}_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('article-photos')
        .upload(filename, buffer, { contentType: 'image/jpeg' });
        
      if (error) {
        console.error(`Error uploading ${key}:`, error.message);
      } else {
        const publicUrl = supabaseUrl + '/storage/v1/object/public/article-photos/' + data.path;
        uploadedUrls[key] = publicUrl;
      }
    }
  }

  // Assign
  const { data: articles, error } = await supabase
    .from('Article')
    .select('id, name')
    .in('name', Object.keys(articleToImageMap));
    
  if (error) return;

  let updatedCount = 0;
  for (const article of articles) {
    const imageKey = articleToImageMap[article.name];
    if (imageKey && uploadedUrls[imageKey]) {
      const { error: updateError } = await supabase
        .from('Article')
        .update({ imageUrl: uploadedUrls[imageKey] })
        .eq('id', article.id);
        
      if (!updateError) {
        updatedCount++;
        console.log(`Updated ${article.name} with photo.`);
      }
    }
  }
  
  console.log(`Successfully assigned photos to ${updatedCount} articles.`);
}

uploadAndAssign();
