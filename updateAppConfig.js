const url = 'https://lghhzbkbwttvroxodlzd.supabase.co/rest/v1/AppConfig';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU';

const updateConfig = (key, value) => {
  return fetch(url, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({ key, value })
  }).then(res => res.json());
};

Promise.all([
  updateConfig('min_app_version', '2.47'),
  updateConfig('latest_app_version', '2.47')
])
.then(data => {
  console.log('AppConfig updated:', data);
})
.catch(err => console.error(err));
