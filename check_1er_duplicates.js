const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  // 1. Find the site
  const { data: sites } = await supabase
    .from('Site')
    .select('*')
    .ilike('name', '%1er%');

  if (!sites || sites.length === 0) {
    console.log('Site "1er" not found');
    return;
  }
  
  const site = sites[0];
  console.log('Found site:', site.name, site.id);

  // 2. Fetch all stock for this site
  const { data: stocks } = await supabase
    .from('ArticleStock')
    .select('id, articleId, quantity')
    .eq('siteId', site.id);
    
  console.log(`Total stock entries for ${site.name}: ${stocks.length}`);

  // Fetch the articles corresponding to these stocks to check for duplicate names
  const articleIds = [...new Set(stocks.map(s => s.articleId))];
  const { data: articles } = await supabase
    .from('Article')
    .select('id, name')
    .in('id', articleIds);
    
  const articleMap = new Map();
  articles.forEach(a => articleMap.set(a.id, a.name));

  // Check for duplicate articleIds in the same site (DB anomaly)
  const articleIdCounts = {};
  stocks.forEach(s => {
      articleIdCounts[s.articleId] = (articleIdCounts[s.articleId] || 0) + 1;
  });
  
  const duplicateArticleIds = Object.entries(articleIdCounts).filter(([id, count]) => count > 1);
  console.log(`Duplicate ArticleStock entries (same articleId): ${duplicateArticleIds.length}`);
  
  if (duplicateArticleIds.length > 0) {
      console.log('Sample of anomaly duplicates:');
      for (let i = 0; i < Math.min(3, duplicateArticleIds.length); i++) {
          const id = duplicateArticleIds[i][0];
          const st = stocks.filter(s => s.articleId === id);
          console.log(`- Article: ${articleMap.get(id)} (ID: ${id})`);
          st.forEach(s => console.log(`   Stock ID: ${s.id}, Qty: ${s.quantity}`));
      }
  }

  // Check for duplicate names (different articleIds, but same name)
  const nameCounts = {};
  stocks.forEach(s => {
      const name = articleMap.get(s.articleId);
      if (name) {
          nameCounts[name] = (nameCounts[name] || 0) + 1;
      }
  });

  const duplicateNames = Object.entries(nameCounts).filter(([name, count]) => count > 1);
  console.log(`Duplicate article names in this site: ${duplicateNames.length}`);
  
  if (duplicateNames.length > 0) {
      console.log('Sample of duplicate names:');
      for (let i = 0; i < Math.min(3, duplicateNames.length); i++) {
          const name = duplicateNames[i][0];
          console.log(`- Name: ${name}`);
          const matchingArticles = articles.filter(a => a.name === name);
          matchingArticles.forEach(a => {
              const st = stocks.filter(s => s.articleId === a.id);
              st.forEach(s => console.log(`   Article ID: ${a.id} | Stock ID: ${s.id} | Qty: ${s.quantity}`));
          });
      }
  }
}

checkDuplicates();
