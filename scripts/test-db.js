const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual .env loading
const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Supabase Database Check ===\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...');
console.log('Service Key present:', !!serviceKey);
console.log('');

// Test with anon key (what the app uses)
const supabase = createClient(supabaseUrl, supabaseKey);

// Test with service role key (bypasses RLS)
const supabaseAdmin = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function testTable(name, client, label) {
  try {
    const { data, error, count } = await client
      .from(name)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`  ❌ ${label} → ERROR: ${error.message} (code: ${error.code})`);
      return false;
    }
    console.log(`  ✅ ${label} → OK (${count ?? '?'} rows)`);
    return true;
  } catch (e) {
    console.log(`  ❌ ${label} → EXCEPTION: ${e.message}`);
    return false;
  }
}

async function run() {
  // 1. Test basic connection
  console.log('1. Testing connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('  ❌ Auth connection failed:', error.message);
    } else {
      console.log('  ✅ Auth connection OK');
      console.log('  Session:', data.session ? `User ${data.session.user.id}` : 'No active session');
    }
  } catch (e) {
    console.log('  ❌ Auth connection exception:', e.message);
  }

  // 2. Test tables with anon key (affected by RLS)
  console.log('\n2. Testing tables with ANON key (RLS enforced):');
  const tables = ['profiles', 'dares', 'user_dare_logs', 'user_badges', 'points_ledger'];
  for (const table of tables) {
    await testTable(table, supabase, table);
  }

  // 3. Test tables with service role key (bypasses RLS)
  if (supabaseAdmin) {
    console.log('\n3. Testing tables with SERVICE ROLE key (RLS bypassed):');
    for (const table of tables) {
      await testTable(table, supabaseAdmin, table);
    }
  }

  // 4. Check if dares table has data
  console.log('\n4. Checking dares table for data...');
  const client = supabaseAdmin || supabase;
  const { data: dares, error: daresErr } = await client
    .from('dares')
    .select('id, level, stage, life_category, title')
    .limit(3);
  
  if (daresErr) {
    console.log('  ❌ Error:', daresErr.message);
  } else if (!dares || dares.length === 0) {
    console.log('  ⚠️  Dares table is EMPTY — no challenges loaded!');
  } else {
    console.log(`  ✅ Found dares. Sample:`);
    dares.forEach(d => console.log(`     - [L${d.level}/S${d.stage}] ${d.life_category}: ${d.title}`));
  }

  // 5. Check profiles
  console.log('\n5. Checking profiles table...');
  const { data: profiles, error: profErr } = await client
    .from('profiles')
    .select('id, name, onboarding_completed, current_level, current_stage')
    .limit(5);
  
  if (profErr) {
    console.log('  ❌ Error:', profErr.message);
  } else if (!profiles || profiles.length === 0) {
    console.log('  ⚠️  No profiles found');
  } else {
    console.log(`  ✅ Found ${profiles.length} profile(s):`);
    profiles.forEach(p => console.log(`     - ${p.name} | onboarded: ${p.onboarding_completed} | L${p.current_level}/S${p.current_stage}`));
  }

  console.log('\n=== Done ===');
}

run().catch(e => console.error('Fatal error:', e));
