/**
 * One-time migration script: generates passwords for existing members,
 * resets their Supabase Auth accounts, and saves passwords to the DB.
 *
 * Usage:
 *   node scripts/migrate-credentials.mjs <SUPABASE_SERVICE_KEY>
 *
 * Example:
 *   node scripts/migrate-credentials.mjs eyJhbGci...your-service-role-key
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxvgagkwgsjetvyvxdxg.supabase.co';
const SERVICE_KEY = process.argv[2];

if (!SERVICE_KEY || SERVICE_KEY === 'your-service-role-key-here') {
  console.error('\n❌  Please provide your Supabase service role key as an argument.');
  console.error('    node scripts/migrate-credentials.mjs eyJhbGci...\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── Password generator (same logic as the app) ──────────────────
function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍  Fetching members without credentials...\n');

  // 1. Get all members that have no login_password yet
  const { data: members, error: fetchErr } = await supabase
    .from('members')
    .select('id, name, email, login_password')
    .is('login_password', null);

  if (fetchErr) {
    console.error('❌  Failed to fetch members:', fetchErr.message);
    console.error('    Make sure you ran: ALTER TABLE members ADD COLUMN IF NOT EXISTS login_password TEXT;');
    process.exit(1);
  }

  if (!members || members.length === 0) {
    console.log('✅  All members already have credentials. Nothing to do.\n');
    process.exit(0);
  }

  console.log(`📋  Found ${members.length} member(s) without credentials:\n`);

  const results = [];

  for (const member of members) {
    if (!member.email) {
      console.log(`  ⚠️  Skipping ${member.name} — no email address`);
      continue;
    }

    const password = generatePassword();
    let authStatus = '';

    // 2. Find their Supabase Auth user by email
    const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
    const authUser = userList?.users?.find(u => u.email === member.email);

    if (authUser) {
      // 3a. Reset existing auth user's password
      const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true
      });
      authStatus = updateErr ? `⚠️  Auth reset failed: ${updateErr.message}` : '✅ Auth password reset';
    } else {
      // 3b. Create new auth account for this member
      const { error: createErr } = await supabase.auth.admin.createUser({
        email: member.email,
        password,
        email_confirm: true,
        user_metadata: { name: member.name, role: 'member' }
      });

      if (!createErr) {
        // Also upsert profile row
        const { data: newUser } = await supabase.auth.admin.listUsers();
        const created = newUser?.users?.find(u => u.email === member.email);
        if (created) {
          await supabase.from('profiles').upsert({
            id: created.id,
            name: member.name,
            email: member.email,
            role: 'member'
          }, { onConflict: 'id' });
        }
        authStatus = '✅ Auth account created';
      } else {
        authStatus = `⚠️  Auth create failed: ${createErr.message}`;
      }
    }

    // 4. Save password to members table
    const { error: saveErr } = await supabase
      .from('members')
      .update({ login_password: password })
      .eq('id', member.id);

    const saveStatus = saveErr ? `❌ DB save failed: ${saveErr.message}` : '✅ Password saved to DB';

    results.push({ name: member.name, email: member.email, password });
    console.log(`  👤  ${member.name} (${member.email})`);
    console.log(`      Password : ${password}`);
    console.log(`      Auth     : ${authStatus}`);
    console.log(`      Database : ${saveStatus}\n`);
  }

  // 5. Print summary table
  console.log('\n' + '═'.repeat(70));
  console.log('  CREDENTIALS SUMMARY — share these with your members');
  console.log('═'.repeat(70));
  console.log(`  ${'NAME'.padEnd(20)} ${'EMAIL'.padEnd(30)} PASSWORD`);
  console.log('─'.repeat(70));
  for (const r of results) {
    console.log(`  ${r.name.padEnd(20)} ${r.email.padEnd(30)} ${r.password}`);
  }
  console.log('═'.repeat(70));
  console.log('\n✅  Migration complete! Credentials are now visible in the Members page.\n');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
