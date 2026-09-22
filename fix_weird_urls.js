const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

const imagePaths = {
  hp_power_supply: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/hp_power_supply_1789593246852.jpg',
  document_scanner: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/document_scanner_1789593255801.jpg',
  // Re-use some previous ones
  usb_dongle: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/usb_dongle_1789593030022.jpg',
  dell_power_supply: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/dell_power_supply_1789593011033.jpg',
  headset_bag: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/headset_bag_1789593044413.jpg'
};

const articleToImageMap = {
  'Dongle Clavier / Souris CHERRY': 'usb_dongle',
  'Chargeur HP': 'hp_power_supply',
  'Dongle Casque Epos': 'usb_dongle',
  'Dongle casque Plantronics USB C': 'usb_dongle',
  'Scanner document': 'document_scanner',
  'Sacoche': 'headset_bag',
  'Chargeur USB-C DELL 65W': 'dell_power_supply'
};

async function fixWeirdUrls() {
  const uploadedUrls = {};

  // Upload
  for (const [key, path] of Object.entries(imagePaths)) {
    if (fs.existsSync(path)) {
      const buffer = fs.readFileSync(path);
      const filename = `articles/${key}_fix_${Date.now()}.jpg`;
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

  // Get articles
  const { data: articles, error } = await supabase
    .from('Article')
    .select('id, name, imageUrl')
    .eq('isArchived', false);
    
  if (error) return;

  const weird = articles.filter(a => a.imageUrl && !a.imageUrl.startsWith('http'));
  
  let updatedCount = 0;
  for (const article of weird) {
    const imageKey = articleToImageMap[article.name];
    if (imageKey && uploadedUrls[imageKey]) {
      const { error: updateError } = await supabase
        .from('Article')
        .update({ imageUrl: uploadedUrls[imageKey] })
        .eq('id', article.id);
        
      if (!updateError) {
        updatedCount++;
        console.log(`Updated broken URL for ${article.name} with ${imageKey} image.`);
      }
    }
  }
  
  console.log(`Successfully fixed ${updatedCount} articles with broken URLs.`);
}

fixWeirdUrls();
