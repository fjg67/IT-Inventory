const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const dummyContent = Buffer.from('test image content');
  const { data, error } = await supabase.storage
    .from('article-photos')
    .upload('articles/test_upload_123.jpg', dummyContent, {
      contentType: 'image/jpeg',
      upsert: true
    });
    
  if (error) {
      console.error('Upload Error:', error.message);
  } else {
      console.log('Upload Success:', data);
  }
}

testUpload();
