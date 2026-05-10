/**
 * Auto-generates scheduled payout records for all active committees
 * based on committee_members payout_order.
 *
 * Each member gets one payout per their turn month.
 * Payout amount = monthly_amount × total_members
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vxvgagkwgsjetvyvxdxg.supabase.co',
  process.argv[2],
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('\n🔍  Fetching active committees...\n');

  const { data: committees } = await supabase
    .from('committees')
    .select('*')
    .in('status', ['active', 'pending']);

  if (!committees?.length) {
    console.log('❌  No active/pending committees found.\n');
    return;
  }

  for (const c of committees) {
    console.log(`\n📋  Processing: "${c.name}" (PKR ${c.monthly_amount}/mo × ${c.total_members} members)`);

    // Get members sorted by payout_order (skip turn 0)
    const { data: members } = await supabase
      .from('committee_members')
      .select('member_id, payout_order, members(name)')
      .eq('committee_id', c.id)
      .gt('payout_order', 0)
      .order('payout_order');

    if (!members?.length) {
      console.log('  ⚠️  No members with payout_order > 0, skipping.');
      continue;
    }

    const payoutAmount = c.monthly_amount * c.total_members;
    const inserts = [];

    for (const cm of members) {
      const month = cm.payout_order;
      const payoutDate = addMonths(c.start_date, month - 1);

      // Check if payout already exists for this member+committee+month
      const { data: existing } = await supabase
        .from('payouts')
        .select('id')
        .eq('committee_id', c.id)
        .eq('member_id', cm.member_id)
        .eq('month', month)
        .maybeSingle();

      if (existing) {
        console.log(`  ⏭️  Skipping ${cm.members?.name} (Month ${month}) — already exists`);
        continue;
      }

      inserts.push({
        committee_id: c.id,
        member_id: cm.member_id,
        month,
        total_amount: payoutAmount,
        payout_date: payoutDate,
        status: 'scheduled'
      });
    }

    if (inserts.length === 0) {
      console.log('  ✅  All payouts already exist for this committee.');
      continue;
    }

    const { data: created, error } = await supabase
      .from('payouts')
      .insert(inserts)
      .select('*, members(name)');

    if (error) {
      console.error(`  ❌  Insert error: ${error.message}`);
      continue;
    }

    console.log(`  ✅  Created ${created.length} payout(s):`);
    created.forEach(p =>
      console.log(`      Month ${p.month} → ${p.members?.name} — PKR ${p.total_amount} on ${p.payout_date}`)
    );
  }

  console.log('\n✅  Done! Payouts are now visible on the dashboard.\n');
}

main().catch(console.error);
