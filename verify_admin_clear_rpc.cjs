const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim().replace(/"/g, '');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

(async () => {
  console.log('🔗 URL:', env.VITE_SUPABASE_URL);
  console.log('🔑 Key present:', !!env.VITE_SUPABASE_PUBLISHABLE_KEY);

  console.log('\n▶️ Calling RPC admin_clear_audit_logs as anon (expect permission error)');
  const { data, error } = await supabase.rpc('admin_clear_audit_logs', { p_scope: 'non_admin' });

  if (error) {
    console.log('✅ RPC exists and is protected');
    console.log('   Error code:', error.code || 'N/A');
    console.log('   Message   :', error.message);
  } else {
    console.log('⚠️ Unexpected: RPC succeeded as anon', data);
  }

  process.exit(0);
})().catch((e) => {
  console.error('❌ RPC test failed:', e);
  process.exit(1);
});