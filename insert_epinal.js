const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

const epinalSiteId = '8897f81a-6eb7-45ee-b0ba-028a6f532250';

const items = [
  { name: 'Scanner document', qty: 5 },
  { name: 'Kit clavier souris > Souris SF + clavier SF CHERRY', qty: 4 },
  { name: 'Casque EPOS', qty: 3 },
  { name: 'Casque filaire', qty: 13 },
  { name: 'D6000', qty: 14 },
  { name: 'Chargeur USB-C DELL 65W', qty: 14 },
  { name: 'Chargeur DELL 65W Fiche cylindrique 5410', qty: 4 },
  { name: 'Chargeur D6000 130W', qty: 8 },
  { name: 'Souris filaire DELL', qty: 10 },
  { name: 'Clavier F', qty: 6 },
  { name: 'Sacoche', qty: 11 },
  { name: 'Sac à dos', qty: 2 },
  { name: 'Câble USB-C / USB-C 2 M', qty: 6 },
  { name: 'Câble USB-C / USB-A', qty: 24 },
  { name: 'Câble USB-C / USB-A', qty: 6 },
  { name: 'Câble USB-C / USB-C 2 M', qty: 2 },
  { name: 'Câble USB-A / Micro-USB 1 mètre', qty: 4 }, // usb b vers a
  { name: 'Dongle Clavier / Souris CHERRY', qty: 28 },
  { name: 'BASE Casque SF V1', qty: 21 },
  { name: 'Base de charge EPOS', qty: 1 },
  { name: 'Casque SF Plantronics V1', qty: 1 },
  { name: 'Câble MICKEY (C5 / IEC 320)', qty: 25 },
  { name: 'HUB Fiche USB C', qty: 6 },
  { name: 'RJ45 2 mètre blanc', qty: 63 },
  { name: 'RJ45 3 mètre blanc', qty: 37 },
  { name: 'RJ45 5 mètre blanc', qty: 7 },
  { name: 'Câble RJ-45 10 mètres', qty: 7 }
];

const articles = JSON.parse(fs.readFileSync('articles_dump.json', 'utf8'));

async function insertStock() {
  const stockMap = new Map(); // to aggregate quantities
  
  for (const item of items) {
    const found = articles.find(a => a.name === item.name);
    if (!found) {
      console.log(`Missing article: ${item.name}`);
      continue;
    }
    
    if (stockMap.has(found.id)) {
      stockMap.set(found.id, stockMap.get(found.id) + item.qty);
    } else {
      stockMap.set(found.id, item.qty);
    }
  }

  const rows = [];
  for (const [articleId, qty] of stockMap.entries()) {
    rows.push({
      id: crypto.randomUUID(),
      articleId: articleId,
      siteId: epinalSiteId,
      quantity: qty
    });
  }

  console.log(`Inserting ${rows.length} rows into ArticleStock...`);
  
  const { data, error } = await supabase.from('ArticleStock').insert(rows);
  if (error) {
    console.error('Insert error:', error.message);
  } else {
    console.log('Successfully inserted all stock!');
  }
}

insertStock();
