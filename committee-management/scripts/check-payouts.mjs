import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vxvgagkwgsjetvyvxdxg.supabase.co',
  process.argv[2],
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: payouts } = await supabase
    .from('payouts')
    .select('*, members(name), committees(name, monthly_amount, total_members, current_month, duration_months, status)');

  console.log('\n📋  ALL PAYOUTS:\n');
  if (!payouts?.length) {
    console.log('  ❌  No payouts found in database.\n');
  } else {
    payouts.forEach(p => console.log(`  [${p.status}] ${p.members?.name} — ${p.committees?.name} — Month ${p.month} — PKR ${p.total_amount}`));
  }

  const { data: committees } = await supabase
    .from('committees')
    .select('id, name, status, monthly_amount, total_members, current_month, duration_months');

  console.log('\n📋  ALL COMMITTEES:\n');
  committees?.forEach(c =>
    console.log(`  [${c.status}] "${c.name}" — PKR ${c.monthly_amount}/mo × ${c.total_members} members × ${c.duration_months} months — current_month: ${c.current_month}`)
  );

  const { data: cm } = await supabase
    .from('committee_members')
    .select('payout_order, members(name, email), committees(name)')
    .order('payout_order');

  console.log('\n📋  COMMITTEE MEMBERS (payout order):\n');
  cm?.forEach(r => console.log(`  Turn #${r.payout_order} — ${r.members?.name} — ${r.committees?.name}`));
  console.log('');
}

main().catch(console.error);
