/**
 * Debug: list all committees and committee_members in the database
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxvgagkwgsjetvyvxdxg.supabase.co';
const SERVICE_KEY = process.argv[2];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // All committees
  const { data: committees } = await supabase
    .from('committees')
    .select('id, name, status, created_by, created_at')
    .order('created_at', { ascending: false });

  console.log('\n📋  ALL COMMITTEES IN DATABASE:\n');
  console.log(`  ${'NAME'.padEnd(30)} ${'STATUS'.padEnd(12)} CREATED_BY`);
  console.log('─'.repeat(80));
  (committees || []).forEach(c =>
    console.log(`  ${c.name.padEnd(30)} ${c.status.padEnd(12)} ${c.created_by}`)
  );

  // All committee_members with member email
  const { data: cm } = await supabase
    .from('committee_members')
    .select('id, committee_id, member_id, members(name, email), committees(name, status)');

  console.log('\n\n👥  ALL COMMITTEE_MEMBERS:\n');
  console.log(`  ${'MEMBER'.padEnd(20)} ${'EMAIL'.padEnd(30)} ${'COMMITTEE'.padEnd(30)} STATUS`);
  console.log('─'.repeat(100));
  (cm || []).forEach(r => {
    const member = r.members;
    const committee = r.committees;
    const name = (member?.name || '?').padEnd(20);
    const email = (member?.email || '?').padEnd(30);
    const cname = (committee?.name || 'NULL (ORPHAN)').padEnd(30);
    const status = committee?.status || '';
    console.log(`  ${name} ${email} ${cname} ${status}`);
  });

  console.log('');
}

main().catch(console.error);
