import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vxvgagkwgsjetvyvxdxg.supabase.co',
  process.argv[2],
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Find fatima's auth user
  const { data: users } = await supabase.auth.admin.listUsers();
  const fatima = users?.users?.find(u => u.email?.includes('fatima'));
  console.log('\n👤  Fatima auth user:', fatima?.id, fatima?.email);

  if (!fatima) { console.log('Not found'); return; }

  // Committees owned by fatima
  const { data: committees } = await supabase
    .from('committees')
    .select('*')
    .eq('created_by', fatima.id);

  console.log('\n📋  Fatima\'s committees:');
  if (!committees?.length) {
    console.log('  ❌  None found — fatima owns no committees!');
  } else {
    committees.forEach(c =>
      console.log(`  [${c.status}] "${c.name}" id=${c.id} — PKR ${c.monthly_amount}/mo × ${c.total_members} members`)
    );

    // Members in each committee
    for (const c of committees) {
      const { data: cm } = await supabase
        .from('committee_members')
        .select('payout_order, members(name, email)')
        .eq('committee_id', c.id)
        .order('payout_order');
      console.log(`\n  Members of "${c.name}":`);
      cm?.forEach(r => console.log(`    Turn #${r.payout_order} — ${r.members?.name} (${r.members?.email})`));
    }
  }
  console.log('');
}

main().catch(console.error);
