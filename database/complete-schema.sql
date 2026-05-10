-- ============================================================
-- COMMITTEEHUB - COMPLETE SCHEMA v2 (Fixed)
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── PROFILES TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  address TEXT,
  cnic TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMMITTEES TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS committees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_amount NUMERIC NOT NULL,
  total_members INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  due_day INTEGER DEFAULT 1,
  duration_months INTEGER NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  current_month INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to committees if upgrading
ALTER TABLE committees ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT 1;

-- ── MEMBERS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  cnic TEXT,
  profile_image TEXT,
  role TEXT DEFAULT 'member',
  payout_order INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to members if upgrading
ALTER TABLE members ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE members ALTER COLUMN committee_id DROP NOT NULL;

-- ── COMMITTEE_MEMBERS junction ────────────────────────────────
CREATE TABLE IF NOT EXISTS committee_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  payout_order INTEGER NOT NULL DEFAULT 1,
  turn_assigned_by TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, member_id)
);

-- Add missing column if upgrading
ALTER TABLE committee_members ADD COLUMN IF NOT EXISTS turn_assigned_by TEXT DEFAULT 'manual';

-- ── PAYMENTS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_date DATE,
  screenshot_url TEXT,
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to payments if upgrading
ALTER TABLE payments ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ── PAYOUTS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payout_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── STORAGE BUCKET for payment screenshots ───────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_committees_created_by ON committees(created_by);
CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_created_by ON members(created_by);
CREATE INDEX IF NOT EXISTS idx_cm_committee ON committee_members(committee_id);
CREATE INDEX IF NOT EXISTS idx_cm_member ON committee_members(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_committee ON payments(committee_id);
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payouts_committee ON payouts(committee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ── ENABLE RLS ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── DROP ALL OLD POLICIES ─────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

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

DROP POLICY IF EXISTS "notif_select" ON notifications;
DROP POLICY IF EXISTS "notif_insert" ON notifications;
DROP POLICY IF EXISTS "notif_update" ON notifications;

-- ── PROFILES POLICIES ─────────────────────────────────────────
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── COMMITTEES POLICIES ───────────────────────────────────────
CREATE POLICY "committees_select" ON committees
  FOR SELECT USING (
    auth.uid() = created_by
    OR id IN (
      SELECT cm.committee_id FROM committee_members cm
      JOIN members m ON m.id = cm.member_id
      WHERE m.email = auth.email()
    )
  );

CREATE POLICY "committees_insert" ON committees
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "committees_update" ON committees
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "committees_delete" ON committees
  FOR DELETE USING (auth.uid() = created_by);

-- ── MEMBERS POLICIES ──────────────────────────────────────────
-- Simple: any authenticated user can read/write members
CREATE POLICY "members_select" ON members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "members_insert" ON members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "members_update" ON members
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "members_delete" ON members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── COMMITTEE_MEMBERS POLICIES ────────────────────────────────
CREATE POLICY "committee_members_select" ON committee_members
  FOR SELECT USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR member_id IN (SELECT id FROM members WHERE email = auth.email())
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

-- ── PAYMENTS POLICIES ─────────────────────────────────────────
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
    OR member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

-- ── PAYOUTS POLICIES ──────────────────────────────────────────
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

-- ── NOTIFICATIONS POLICIES ────────────────────────────────────
CREATE POLICY "notif_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_insert" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notif_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ── STORAGE POLICIES ─────────────────────────────────────────
DROP POLICY IF EXISTS "screenshots_upload" ON storage.objects;
DROP POLICY IF EXISTS "screenshots_select" ON storage.objects;

CREATE POLICY "screenshots_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-screenshots' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "screenshots_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-screenshots');

-- ── TRIGGER: auto-create profile on signup ────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── TRIGGER: updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_committees_updated ON committees;
CREATE TRIGGER trg_committees_updated
  BEFORE UPDATE ON committees FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_members_updated ON members;
CREATE TRIGGER trg_members_updated
  BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Backfill profiles for existing users ─────────────────────
INSERT INTO public.profiles (id, name, email, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  COALESCE(u.raw_user_meta_data->>'role', 'admin')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

SELECT 'CommitteeHub schema v2 installed successfully! Tables: profiles, committees, members, committee_members, payments, payouts, notifications' AS status;
