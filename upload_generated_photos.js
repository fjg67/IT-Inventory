const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

const imagePaths = {
  dell_power_supply: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/dell_power_supply_1789593011033.jpg',
  cherry_keyboard_mouse: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/cherry_keyboard_mouse_1789593021306.jpg',
  usb_dongle: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/usb_dongle_1789593030022.jpg',
  headset_bag: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/headset_bag_1789593044413.jpg',
  ethernet_cable: '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/ethernet_cable_1789593052414.jpg'
};

const articleToImageMap = {
  'Alimentation Mini UC (90W)': 'dell_power_supply',
  'Kit clavier souris > Souris SF + clavier SF CHERRY': 'cherry_keyboard_mouse',
  'Kit clavier souris agence Urban Factory (Retour)': 'cherry_keyboard_mouse',
  'Dongle Clavier / souris DELL': 'usb_dongle',
  'KSAOP8725215': 'cherry_keyboard_mouse',
  'Sacoche casque': 'headset_bag',
  'Dongle casque Plantronics BT 600': 'usb_dongle',
  'Dongle casque Plantronics BT 700': 'usb_dongle',
  'Chargeur USB': 'dell_power_supply',
  'Câble RJ-45 10 mètres': 'ethernet_cable'
};

async function uploadAndAssign() {
  const uploadedUrls = {};

  // Upload unique images
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
        console.log(`Uploaded ${key}`);
      }
    } else {
      console.log('File not found:', path);
    }
  }

  // Get articles missing photos
  const { data: articles, error } = await supabase
    .from('Article')
    .select('id, name')
    .is('imageUrl', null)
    .eq('isArchived', false);
    
  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }

  let updatedCount = 0;
  for (const article of articles) {
    const imageKey = articleToImageMap[article.name];
    if (imageKey && uploadedUrls[imageKey]) {
      const { error: updateError } = await supabase
        .from('Article')
        .update({ imageUrl: uploadedUrls[imageKey] })
        .eq('id', article.id);
        
      if (updateError) {
        console.error(`Error updating ${article.name}:`, updateError.message);
      } else {
        updatedCount++;
        console.log(`Updated ${article.name} with ${imageKey} image.`);
      }
    } else {
        // Use a default image if it wasn't mapped specifically (maybe ethernet cable or dongle as a generic fallback, or leave null)
        // Let's use usb_dongle for anything unmapped as a generic 'accessory'
        if (uploadedUrls['usb_dongle']) {
             await supabase
                .from('Article')
                .update({ imageUrl: uploadedUrls['usb_dongle'] })
                .eq('id', article.id);
             updatedCount++;
             console.log(`Updated ${article.name} with default image.`);
        }
    }
  }
  
  console.log(`Successfully updated ${updatedCount} articles with new photos.`);
}

uploadAndAssign();
