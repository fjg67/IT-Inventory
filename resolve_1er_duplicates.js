const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function resolveDuplicates() {
  // 1. Find the site
  const { data: sites } = await supabase
    .from('Site')
    .select('*')
    .ilike('name', '%1er%');

  if (!sites || sites.length === 0) return;
  const site = sites[0];

  // 2. Fetch all stock for this site
  const { data: stocks } = await supabase
    .from('ArticleStock')
    .select('id, articleId, quantity')
    .eq('siteId', site.id);
    
  const articleIds = [...new Set(stocks.map(s => s.articleId))];
  
  const { data: articles } = await supabase
    .from('Article')
    .select('id, name')
    .in('id', articleIds);
    
  const articleMap = new Map();
  articles.forEach(a => articleMap.set(a.id, a.name));

  // Group stocks by article name
  const stocksByName = {};
  for (const stock of stocks) {
      const name = articleMap.get(stock.articleId);
      if (name) {
          if (!stocksByName[name]) stocksByName[name] = [];
          stocksByName[name].push(stock);
      }
  }

  const stocksToDelete = [];
  const articlesToArchive = [];

  for (const [name, groupStocks] of Object.entries(stocksByName)) {
      if (groupStocks.length > 1) {
          // Sort by quantity descending
          groupStocks.sort((a, b) => b.quantity - a.quantity);
          
          // Keep the first one (highest quantity)
          const keepStock = groupStocks[0];
          
          // Mark the rest for deletion
          for (let i = 1; i < groupStocks.length; i++) {
              stocksToDelete.push(groupStocks[i].id);
              articlesToArchive.push(groupStocks[i].articleId);
          }
      }
  }

  console.log(`Found ${stocksToDelete.length} duplicate stock entries to delete (keeping the ones with most units).`);
  
  if (stocksToDelete.length === 0) {
      console.log('Nothing to delete.');
      return;
  }
  
  // 1. Archive the articles first
  // But wait, only archive if they don't have stock elsewhere!
  // To be safe, let's just archive them for now, but we can run fix_archived.js afterwards.
  // Actually, let's check other stocks right now.
  const { data: otherStocks } = await supabase
    .from('ArticleStock')
    .select('articleId, quantity')
    .in('articleId', articlesToArchive)
    .neq('siteId', site.id)
    .gt('quantity', 0);
    
  const articlesWithOtherStock = new Set((otherStocks || []).map(s => s.articleId));
  const safeToArchive = articlesToArchive.filter(id => !articlesWithOtherStock.has(id));
  
  if (safeToArchive.length > 0) {
      const { error: archiveError } = await supabase
        .from('Article')
        .update({ isArchived: true })
        .in('id', safeToArchive);
        
      if (archiveError) {
          console.error('Error archiving:', archiveError.message);
      } else {
          console.log(`Archived ${safeToArchive.length} duplicate articles.`);
      }
  }
  
  console.log(`Skipped archiving ${articlesToArchive.length - safeToArchive.length} articles because they have stock in other sites.`);

  // 2. Delete the ArticleStock entries
  const { error: delError } = await supabase
    .from('ArticleStock')
    .delete()
    .in('id', stocksToDelete);
    
  if (delError) {
      console.error('Error deleting stocks:', delError.message);
  } else {
      console.log(`Successfully deleted ${stocksToDelete.length} duplicate stock entries from ${site.name}.`);
  }
}

resolveDuplicates();
