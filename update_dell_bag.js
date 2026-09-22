const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAndSetDellBag() {
  const filePath = '/Users/florianjovegarcia/.gemini/antigravity-ide/brain/6e561c55-cd5f-47f0-baab-b68081e61d52/sacoche_pc_dell_1790109145341.jpg';
  const fileName = 'sacoche_pc_dell_1790109145341.jpg';
  
  console.log(`Uploading ${fileName}...`);
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('article_photos')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      return;
    }
    
    console.log('Upload successful:', uploadData);

    const { data: publicUrlData } = supabase
      .storage
      .from('article_photos')
      .getPublicUrl(fileName);
      
    const publicUrl = publicUrlData.publicUrl;
    console.log('Public URL:', publicUrl);
    
    console.log('Updating article 1000023 with new image URL...');
    const { data: updateData, error: updateError } = await supabase
      .from('Articles')
      .update({ photo_url: publicUrl })
      .eq('reference', '1000023')
      .select();
      
    if (updateError) {
      console.error('Update failed:', updateError.message);
    } else {
      console.log('Article updated successfully:', updateData);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

uploadAndSetDellBag();
