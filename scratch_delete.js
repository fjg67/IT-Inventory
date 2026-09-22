const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lghhzbkbwttvroxodlzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearEpinalStock() {
  // Find Site
  const { data: sites, error: siteError } = await supabase
    .from('Site')
    .select('id, name')
    .ilike('name', '%Epinal%');

  if (siteError) {
    console.error('Error fetching site:', siteError.message);
    return;
  }

  if (!sites || sites.length === 0) {
    console.log('Could not find Epinal site');
    return;
  }

  const epinalSite = sites[0];
  console.log('Found Site:', epinalSite);

  // Get count before deleting
  const { count, error: countError } = await supabase
    .from('ArticleStock')
    .select('*', { count: 'exact', head: true })
    .eq('siteId', epinalSite.id);
    
  if (countError) {
    console.error('Error counting stock:', countError.message);
    return;
  }
  
  console.log(`Found ${count} stock records for ${epinalSite.name}. Deleting...`);

  if (count > 0) {
    // Delete all stock for that site
    const { data: deleted, error: delError } = await supabase
      .from('ArticleStock')
      .delete()
      .eq('siteId', epinalSite.id);

    if (delError) {
      console.error('Error deleting stock:', delError.message);
    } else {
      console.log('Successfully deleted all stock records for Epinal.');
    }
  } else {
    console.log('No stock records to delete.');
  }
}

clearEpinalStock();
