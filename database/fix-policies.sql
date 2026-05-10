-- ============================================
-- FIX: RLS Policies — Run this in Supabase SQL Editor
-- Fixes "permission denied for table users" error
-- ============================================

-- Drop all old policies
DROP POLICY IF EXISTS "committees_select" ON committees;
DROP POLICY IF EXISTS "committees_select_member" ON committees;
DROP POLICY IF EXISTS "committees_insert" ON committees;
DROP POLICY IF EXISTS "committees_update" ON committees;
DROP POLICY IF EXISTS "committees_delete" ON committees;

DROP POLICY IF EXISTS "members_select" ON members;
DROP POLICY IF EXISTS "members_insert" ON members;
DROP POLICY IF EXISTS "members_update" ON members;
DROP POLICY IF EXISTS "members_delete" ON members;

DROP POLICY IF EXISTS "committee_members_select" ON committee_members;
DROP POLICY IF EXISTS "committee_members_insert" ON committee_members;
DROP POLICY IF EXISTS "committee_members_update" ON committee_members;
DROP POLICY IF EXISTS "committee_members_delete" ON committee_members;

DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;

DROP POLICY IF EXISTS "payouts_select" ON payouts;
DROP POLICY IF EXISTS "payouts_insert" ON payouts;
DROP POLICY IF EXISTS "payouts_update" ON payouts;

-- ── COMMITTEES ──────────────────────────────
CREATE POLICY "committees_select" ON committees
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "committees_insert" ON committees
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "committees_update" ON committees
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "committees_delete" ON committees
  FOR DELETE USING (auth.uid() = created_by);

-- ── MEMBERS ─────────────────────────────────
-- Any logged-in user can read/write members
CREATE POLICY "members_select" ON members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "members_insert" ON members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "members_update" ON members
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "members_delete" ON members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── COMMITTEE_MEMBERS ────────────────────────
-- KEY FIX: use auth.email() instead of querying auth.users
CREATE POLICY "committee_members_select" ON committee_members
  FOR SELECT USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR
    member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

CREATE POLICY "committee_members_insert" ON committee_members
  FOR INSERT WITH CHECK (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

CREATE POLICY "committee_members_update" ON committee_members
  FOR UPDATE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

CREATE POLICY "committee_members_delete" ON committee_members
  FOR DELETE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

-- ── PAYMENTS ────────────────────────────────
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

-- ── PAYOUTS ─────────────────────────────────
CREATE POLICY "payouts_select" ON payouts
  FOR SELECT USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

CREATE POLICY "payouts_insert" ON payouts
  FOR INSERT WITH CHECK (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

CREATE POLICY "payouts_update" ON payouts
  FOR UPDATE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

SELECT 'Policies fixed successfully!' as status;
