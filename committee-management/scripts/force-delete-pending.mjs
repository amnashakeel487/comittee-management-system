/**
 * Force-deletes all pending committees using service role (bypasses RLS)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxvgagkwgsjetvyvxdxg.supabase.co';
const SERVICE_KEY = process.argv[2];

// Service role client — bypasses RLS entirely
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' },
  global: {
    headers: { 'X-Client-Info': 'service-role' }
  }
});

async function main() {
  console.log('\n🔍  Fetching all pending committees...\n');

  const { data: pending, error: fetchErr } = await supabase
    .from('committees')
    .select('id, name, status, created_by')
    .eq('status', 'pending');

  if (fetchErr) { console.error('❌ Fetch error:', fetchErr.message); process.exit(1); }

  if (!pending || pending.length === 0) {
    console.log('✅  No pending committees found.\n');
    process.exit(0);
  }

  console.log(`Found ${pending.length} pending committee(s):\n`);
  pending.forEach(c => console.log(`  [${c.id}] "${c.name}" by ${c.created_by}`));
  console.log('');

  for (const c of pending) {
    // Step 1: delete committee_members
    const { error: e1 } = await supabase
      .from('committee_members')
      .delete()
      .eq('committee_id', c.id);
    if (e1) console.warn(`  ⚠️  committee_members: ${e1.message}`);
    else console.log(`  🗑️  Removed committee_members for "${c.name}"`);

    // Step 2: delete payments
    const { error: e2 } = await supabase
      .from('payments')
      .delete()
      .eq('committee_id', c.id);
    if (e2) console.warn(`  ⚠️  payments: ${e2.message}`);

    // Step 3: delete payouts
    const { error: e3 } = await supabase
      .from('payouts')
      .delete()
      .eq('committee_id', c.id);
    if (e3) console.warn(`  ⚠️  payouts: ${e3.message}`);

    // Step 4: delete the committee itself
    const { error: e4, count } = await supabase
      .from('committees')
      .delete({ count: 'exact' })
      .eq('id', c.id);

    if (e4) {
      console.error(`  ❌  Failed to delete "${c.name}": ${e4.message}`);
    } else {
      console.log(`  ✅  Deleted committee "${c.name}" (${count} row)\n`);
    }
  }

  console.log('✅  All pending committees removed from database.\n');
}

main().catch(console.error);
