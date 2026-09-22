const url = 'https://lghhzbkbwttvroxodlzd.supabase.co/rest/v1/ArticleStock?siteId=eq.cmlvlagpw00005d2sdgl4czio&quantity=lte.0';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';

fetch(url, {
  method: 'DELETE',
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Prefer': 'return=representation'
  }
})
.then(res => res.json())
.then(data => {
  console.log(`Deleted ${data.length} records.`);
})
.catch(err => console.error(err));
