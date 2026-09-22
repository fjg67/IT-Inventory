const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertNewArticles() {
  const { data: sites } = await supabase.from('Site').select('id').ilike('name', '%1er%');
  const siteId = sites[0].id;

  const now = new Date().toISOString();

  const newArticles = [
    {
      id: crypto.randomUUID(),
      name: 'Scanner chèque',
      reference: 'SCAN-CHEQUE-01',
      category: 'Périphérique',
      articleType: 'Scanner chèque',
      codeFamille: '16',
      unit: 'Pcs',
      minStock: 0,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      name: 'PC siège à usiner',
      reference: 'PC-SIEGE-USINAGE',
      category: 'Incident PC',
      articleType: 'PC',
      sousType: 'Portable siège',
      unit: 'Pcs',
      minStock: 0,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      name: 'PC agence à usiner',
      reference: 'PC-AGENCE-USINAGE',
      category: 'Incident PC',
      articleType: 'PC',
      sousType: 'Portable agence',
      unit: 'Pcs',
      minStock: 0,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      name: 'Casque défectueux',
      reference: 'CASQUE-DEFECTUEUX',
      category: 'Audio',
      articleType: 'Casque',
      sousType: 'Défectueux',
      codeFamille: '11',
      unit: 'Pcs',
      minStock: 0,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    }
  ];

  const { error: insertErr } = await supabase.from('Article').insert(newArticles);
  if (insertErr) {
      console.error('Error inserting articles:', insertErr.message);
      return;
  }
  
  console.log(`Inserted ${newArticles.length} new articles.`);

  const newStocks = newArticles.map(a => ({
      id: crypto.randomUUID(),
      articleId: a.id,
      siteId: siteId,
      quantity: 0
  }));

  const { error: stockErr } = await supabase.from('ArticleStock').insert(newStocks);
  if (stockErr) {
      console.error('Error inserting stocks:', stockErr.message);
  } else {
      console.log(`Inserted ${newStocks.length} stock entries for site 1er.`);
  }
}

insertNewArticles();
