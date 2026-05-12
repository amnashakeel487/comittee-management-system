import { createClient } from '@supabase/supabase-js';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dmdhZ2t3Z3NqZXR2eXZ4ZHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM5MjU1NSwiZXhwIjoyMDkzOTY4NTU1fQ.KbeUPvnNQkNW_5iVzw4Ohq58prV7lrRrC5jl6RUqYBA';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dmdhZ2t3Z3NqZXR2eXZ4ZHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTI1NTUsImV4cCI6MjA5Mzk2ODU1NX0.knri6Kwk9p09rJ1zLwhOokbcCj-ByKdIlt774hKyJn8';
const URL = 'https://vxvgagkwgsjetvyvxdxg.supabase.co';

const sb = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = createClient(URL, ANON_KEY);

async function main() {
  console.log('\n1. Checking current committees with service role...');
  const { data: all } = await sb.from('committees').select('id, name, status').in('status', ['active', 'pending']);
  console.log('   Total active/pending:', all?.length);
  all?.forEach(c => console.log('  -', c.name, '(' + c.status + ')'));

  console.log('\n2. Checking with anon key (what landing page sees)...');
  const { data: anonData, error: anonErr } = await anon.from('committees').select('id, name, status').in('status', ['active', 'pending']);
  console.log('   Anon sees:', anonData?.length, anonErr ? 'Error: ' + anonErr.message : '');

  if ((anonData?.length || 0) === 0) {
    console.log('\n3. RLS is blocking anon access. Fixing...');
    console.log('\n   ⚠️  Run this SQL in Supabase SQL Editor:\n');
    console.log('   DROP POLICY IF EXISTS "committees_read" ON committees;');
    console.log('   CREATE POLICY "committees_read" ON committees');
    console.log('     FOR SELECT USING (');
    console.log('       created_by = auth.uid()');
    console.log('       OR status IN (\'active\', \'pending\')');
    console.log('     );');
    console.log('\n   Also run for profiles (for admin name display):');
    console.log('   DROP POLICY IF EXISTS "profiles_read" ON profiles;');
    console.log('   CREATE POLICY "profiles_read" ON profiles');
    console.log('     FOR SELECT USING (true);');
  } else {
    console.log('\n✅ Anon access is working!');
  }
}

main().catch(console.error);
