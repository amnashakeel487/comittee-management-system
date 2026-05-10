-- EMERGENCY FIX: Run this in Supabase SQL Editor
-- Fixes the hanging committee insert

-- Drop all committee policies and recreate simply
DROP POLICY IF EXISTS "committees_select" ON committees;
DROP POLICY IF EXISTS "committees_select_member" ON committees;
DROP POLICY IF EXISTS "committees_insert" ON committees;
DROP POLICY IF EXISTS "committees_update" ON committees;
DROP POLICY IF EXISTS "committees_delete" ON committees;

-- Simple policies that won't hang
CREATE POLICY "committees_select" ON committees
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "committees_insert" ON committees
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "committees_update" ON committees
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "committees_delete" ON committees
  FOR DELETE USING (auth.uid() = created_by);

-- Fix members policies too
DROP POLICY IF EXISTS "members_select" ON members;
DROP POLICY IF EXISTS "members_insert" ON members;
DROP POLICY IF EXISTS "members_update" ON members;
DROP POLICY IF EXISTS "members_delete" ON members;

CREATE POLICY "members_select" ON members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "members_insert" ON members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "members_update" ON members
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "members_delete" ON members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fix committee_members
DROP POLICY IF EXISTS "committee_members_select" ON committee_members;
DROP POLICY IF EXISTS "committee_members_insert" ON committee_members;
DROP POLICY IF EXISTS "committee_members_update" ON committee_members;
DROP POLICY IF EXISTS "committee_members_delete" ON committee_members;

CREATE POLICY "committee_members_select" ON committee_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "committee_members_insert" ON committee_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "committee_members_update" ON committee_members
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "committee_members_delete" ON committee_members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fix payments
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;

CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Fix payouts
DROP POLICY IF EXISTS "payouts_select" ON payouts;
DROP POLICY IF EXISTS "payouts_insert" ON payouts;
DROP POLICY IF EXISTS "payouts_update" ON payouts;

CREATE POLICY "payouts_select" ON payouts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "payouts_insert" ON payouts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "payouts_update" ON payouts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

SELECT 'Emergency fix applied! All policies now use simple auth.uid() IS NOT NULL check.' AS status;
