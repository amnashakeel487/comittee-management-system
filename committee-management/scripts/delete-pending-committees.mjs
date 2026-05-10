/**
 * Deletes all 'pending' family saving circle committees and their members
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxvgagkwgsjetvyvxdxg.supabase.co';
const SERVICE_KEY = process.argv[2];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Find all pending committees
  const { data: pending } = await supabase
    .from('committees')
    .select('id, name, status, created_by')
    .eq('status', 'pending');

  console.log('\n📋  Pending committees found:\n');
  (pending || []).forEach(c =>
    console.log(`  [${c.id}] ${c.name} — created_by: ${c.created_by}`)
  );

  if (!pending || pending.length === 0) {
    console.log('  None found.\n');
    return;
  }

  for (const c of pending) {
    // Delete committee_members first
    const { error: cmErr } = await supabase
      .from('committee_members')
      .delete()
      .eq('committee_id', c.id);

    if (cmErr) console.warn(`  ⚠️  committee_members delete warning for ${c.id}: ${cmErr.message}`);

    // Delete the committee
    const { error: cErr } = await supabase
      .from('committees')
      .delete()
      .eq('id', c.id);

    if (cErr) {
      console.error(`  ❌  Failed to delete committee ${c.name}: ${cErr.message}`);
    } else {
      console.log(`  ✅  Deleted: ${c.name} [${c.id}]`);
    }
  }

  console.log('\n✅  Done. All pending committees removed.\n');
}

main().catch(console.error);
