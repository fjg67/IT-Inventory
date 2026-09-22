const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching sites...');
  const { data: sites, error: sitesError } = await supabase.from('Site').select('id, name');
  if (sitesError) {
    console.error('Error fetching sites:', sitesError);
    return;
  }
  console.log(`Found ${sites.length} sites.`);

  console.log('Fetching articles...');
  const { data: articles, error: articlesError } = await supabase.from('Article').select('id, name');
  if (articlesError) {
    console.error('Error fetching articles:', articlesError);
    return;
  }
  console.log(`Found ${articles.length} articles.`);

  console.log('Fetching existing stocks...');
  const { data: stocks, error: stocksError } = await supabase.from('ArticleStock').select('articleId, siteId');
  if (stocksError) {
    console.error('Error fetching stocks:', stocksError);
    return;
  }
  console.log(`Found ${stocks.length} existing stock entries.`);

  // Create a set for fast lookup: `${siteId}_${articleId}`
  const existingStockSet = new Set(stocks.map(s => `${s.siteId}_${s.articleId}`));

  const rowsToInsert = [];

  for (const site of sites) {
    for (const article of articles) {
      const key = `${site.id}_${article.id}`;
      if (!existingStockSet.has(key)) {
        rowsToInsert.push({
          id: crypto.randomUUID(),
          articleId: article.id,
          siteId: site.id,
          quantity: 0
        });
      }
    }
  }

  console.log(`Found ${rowsToInsert.length} missing stock entries.`);

  if (rowsToInsert.length === 0) {
    console.log('Nothing to insert. All stocks are up to date.');
    return;
  }

  console.log(`Inserting ${rowsToInsert.length} entries...`);
  
  // Insert in batches of 1000 to avoid request size limits
  const batchSize = 1000;
  for (let i = 0; i < rowsToInsert.length; i += batchSize) {
    const batch = rowsToInsert.slice(i, i + batchSize);
    const { error: insertError } = await supabase.from('ArticleStock').insert(batch);
    if (insertError) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
    } else {
      console.log(`Successfully inserted batch ${i / batchSize + 1} (${batch.length} entries)`);
    }
  }

  console.log('Finished inserting all missing stocks.');
}

main();
