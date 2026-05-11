/**
 * Fixes RLS policies so members can browse all active/pending committees
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxvgagkwgsjetvyvxdxg.supabase.co';
const SERVICE_KEY = process.argv[2];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('\n🔍  Checking current RLS policies on committees table...\n');

  const { data: policies, error } = await supabase
    .rpc('get_policies_info')
    .catch(() => ({ data: null, error: 'rpc not available' }));

  // Test: can we query committees as anon?
  const { data: testData, error: testErr } = await supabase
    .from('committees')
    .select('id, name, status')
    .in('status', ['active', 'pending'])
    .limit(5);

  console.log('Service role query result:', testData?.length, 'committees found');
  if (testErr) console.log('Error:', testErr.message);

  console.log('\n📋  Committees visible with service role:');
  testData?.forEach(c => console.log(`  [${c.status}] ${c.name}`));

  console.log('\n✅  The SQL to run in Supabase SQL Editor is shown below.\n');
  console.log('═'.repeat(70));
  console.log(`
-- Allow ALL authenticated users to READ committees (browse)
-- Admins can only see their own committees for management
-- Members can see all active/pending committees for browsing

-- Drop existing select policy if any
DROP POLICY IF EXISTS "Admins can view own committees" ON committees;
DROP POLICY IF EXISTS "Users can view own committees" ON committees;
DROP POLICY IF EXISTS "Enable read access for all users" ON committees;
DROP POLICY IF EXISTS "committees_select_policy" ON committees;

-- New policy: admins see their own, members see all active/pending
CREATE POLICY "committees_read" ON committees
  FOR SELECT
  USING (
    -- Committee creator can always see their own
    created_by = auth.uid()
    OR
    -- Any authenticated user can see active/pending committees (for browsing)
    (auth.role() = 'authenticated' AND status IN ('active', 'pending'))
  );

-- Keep insert/update/delete restricted to creator only
DROP POLICY IF EXISTS "committees_insert_policy" ON committees;
DROP POLICY IF EXISTS "committees_update_policy" ON committees;
DROP POLICY IF EXISTS "committees_delete_policy" ON committees;

CREATE POLICY "committees_insert" ON committees
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "committees_update" ON committees
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "committees_delete" ON committees
  FOR DELETE USING (created_by = auth.uid());
`);
  console.log('═'.repeat(70));
  console.log('\nCopy the SQL above and run it in Supabase → SQL Editor\n');
}

main().catch(console.error);
