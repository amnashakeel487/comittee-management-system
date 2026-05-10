/**
 * One-time cleanup: removes orphaned committee_members rows
 * where the committee no longer exists.
 *
 * Usage:
 *   node scripts/cleanup-orphans.mjs <SUPABASE_SERVICE_KEY>
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxvgagkwgsjetvyvxdxg.supabase.co';
const SERVICE_KEY = process.argv[2];

if (!SERVICE_KEY) {
  console.error('Usage: node scripts/cleanup-orphans.mjs <SERVICE_KEY>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('\n🔍  Finding orphaned committee_members rows...\n');

  // Get all committee_members rows
  const { data: allCM, error: cmErr } = await supabase
    .from('committee_members')
    .select('id, committee_id, member_id');

  if (cmErr) { console.error('❌', cmErr.message); process.exit(1); }

  // Get all valid committee IDs
  const { data: allCommittees, error: cErr } = await supabase
    .from('committees')
    .select('id');

  if (cErr) { console.error('❌', cErr.message); process.exit(1); }

  const validIds = new Set((allCommittees || []).map((c) => c.id));
  const orphans = (allCM || []).filter((cm) => !validIds.has(cm.committee_id));

  if (orphans.length === 0) {
    console.log('✅  No orphaned rows found. Database is clean.\n');
    process.exit(0);
  }

  console.log(`🗑️   Found ${orphans.length} orphaned row(s) to delete:\n`);
  orphans.forEach((o) => console.log(`    committee_members.id = ${o.id}  (committee_id: ${o.committee_id})`));

  // Delete them
  const orphanIds = orphans.map((o) => o.id);
  const { error: delErr } = await supabase
    .from('committee_members')
    .delete()
    .in('id', orphanIds);

  if (delErr) {
    console.error('\n❌  Delete failed:', delErr.message);
    process.exit(1);
  }

  console.log(`\n✅  Deleted ${orphans.length} orphaned row(s). Member portal will now be clean.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
