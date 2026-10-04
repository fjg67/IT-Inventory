const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return resolve(fetchImage(response.headers.location));
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

const imageMap = {
  pc: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&q=80',
  printer: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&q=80',
  keyboard: 'https://images.unsplash.com/photo-1526657782461-9fe13401a641?w=600&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  cables: 'https://images.unsplash.com/photo-1517420879524-86d64ac2f339?w=600&q=80',
  incident: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80',
  mount: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
  phone: 'https://images.unsplash.com/photo-1520697779782-b7e804f32997?w=600&q=80'
};

const articleToCategory = {
  'DELL Optiplex 7020': 'pc',
  'DELL Optiplex 7070': 'pc',
  'DELL Optiplex 7010': 'pc',
  'Imprimante Brother HL-L6450DW': 'printer',
  'Compteuse de billet Glory': 'printer',
  'Kit clavier souris Urban Factory': 'keyboard',
  'Incidents de poste': 'incident',
  'Startech spiral cable management': 'cables',
  'Alimentation scanner doc': 'cables',
  'Lindy cat6 hdm 10,2G Extender': 'cables',
  'Lindy usb 3.2 gen 1 cat.6A HDBase Extender': 'cables',
  'Bras Ergotron blanc 45-490-216': 'mount',
  'Bras Ergotron gris 45-235-194': 'mount',
  'Support Mural Peerless': 'mount',
  'Epson support plafond ELPFP14': 'mount',
  'Epson support plafond ELPMB23': 'mount',
  'Ecran 24 pouces Dell': 'monitor',
  'Téléphone Blanc Alcatel': 'phone'
};

async function run() {
  const uploadedUrls = {};

  // 1. Fetch and Upload
  for (const [category, url] of Object.entries(imageMap)) {
    console.log(`Fetching ${category}...`);
    try {
      const buffer = await fetchImage(url);
      const filename = `articles/unsplash_${category}_${Date.now()}.jpg`;

      console.log(`Uploading ${category}...`);
      const { data, error } = await supabase.storage
        .from('article-photos')
        .upload(filename, buffer, { contentType: 'image/jpeg' });

      if (error) {
        console.error(`Error uploading ${category}:`, error.message);
      } else {
        uploadedUrls[category] = supabaseUrl + '/storage/v1/object/public/article-photos/' + data.path;
      }
    } catch (err) {
      console.error(`Failed on ${category}`, err);
    }
  }

  // 2. Get active articles missing photos
  const { data: articles, error } = await supabase
    .from('Article')
    .select('id, name')
    .is('imageUrl', null)
    .eq('isArchived', false);

  if (error) {
    return console.error(error);
  }

  // 3. Update articles
  let updated = 0;
  for (const article of articles) {
    const category = articleToCategory[article.name];
    if (category && uploadedUrls[category]) {
      const { error: updateError } = await supabase
        .from('Article')
        .update({ imageUrl: uploadedUrls[category] })
        .eq('id', article.id);

      if (!updateError) {
        console.log(`Updated ${article.name} with ${category} image`);
        updated++;
      } else {
        console.error(`Failed to update ${article.name}`, updateError);
      }
    }
  }

  console.log(`Done! Updated ${updated} articles.`);
}

run();
