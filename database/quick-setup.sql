-- ============================================
-- COMMITTEEHUB - QUICK SETUP SQL
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. COMMITTEES TABLE
CREATE TABLE IF NOT EXISTS committees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_amount NUMERIC NOT NULL,
  total_members INTEGER NOT NULL,
  start_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  current_month INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEMBERS TABLE (global — no committee_id, committee assignment via committee_members)
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,  -- nullable, kept for legacy compatibility
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  cnic TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  payout_order INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make committee_id nullable if upgrading an existing database
ALTER TABLE members ALTER COLUMN committee_id DROP NOT NULL;

-- 3. COMMITTEE_MEMBERS junction table
CREATE TABLE IF NOT EXISTS committee_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  payout_order INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, member_id)
);

-- 4. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - COMMITTEES
-- ============================================
DROP POLICY IF EXISTS "committees_select" ON committees;
DROP POLICY IF EXISTS "committees_select_member" ON committees;
DROP POLICY IF EXISTS "committees_insert" ON committees;
DROP POLICY IF EXISTS "committees_update" ON committees;
DROP POLICY IF EXISTS "committees_delete" ON committees;

CREATE POLICY "committees_select" ON committees
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "committees_insert" ON committees
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "committees_update" ON committees
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "committees_delete" ON committees
  FOR DELETE USING (auth.uid() = created_by);

-- ============================================
-- RLS POLICIES - MEMBERS
-- Any authenticated user can manage members
-- ============================================
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

-- ============================================
-- RLS POLICIES - COMMITTEE_MEMBERS
-- Use auth.uid() directly — no join to auth.users
-- ============================================
DROP POLICY IF EXISTS "committee_members_select" ON committee_members;
DROP POLICY IF EXISTS "committee_members_insert" ON committee_members;
DROP POLICY IF EXISTS "committee_members_update" ON committee_members;
DROP POLICY IF EXISTS "committee_members_delete" ON committee_members;

-- Select: committee owner OR the member themselves
CREATE POLICY "committee_members_select" ON committee_members
  FOR SELECT USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
    OR
    member_id IN (
      SELECT id FROM members WHERE email = auth.email()
    )
  );

-- Insert: only committee owner can assign members
CREATE POLICY "committee_members_insert" ON committee_members
  FOR INSERT WITH CHECK (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

-- Update: only committee owner
CREATE POLICY "committee_members_update" ON committee_members
  FOR UPDATE USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

-- Delete: only committee owner
CREATE POLICY "committee_members_delete" ON committee_members
  FOR DELETE USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - PAYMENTS
-- ============================================
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;

CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR
    member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

-- ============================================
-- RLS POLICIES - PAYOUTS
-- ============================================
DROP POLICY IF EXISTS "payouts_select" ON payouts;
DROP POLICY IF EXISTS "payouts_insert" ON payouts;
DROP POLICY IF EXISTS "payouts_update" ON payouts;

CREATE POLICY "payouts_select" ON payouts
  FOR SELECT USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR
    member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

CREATE POLICY "payouts_insert" ON payouts
  FOR INSERT WITH CHECK (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

CREATE POLICY "payouts_update" ON payouts
  FOR UPDATE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

-- ============================================
-- DONE! Tables and policies created.
-- ============================================
SELECT 'Setup complete! Tables created: committees, members, committee_members, payments, payouts' as status;
