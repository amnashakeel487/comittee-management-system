-- ============================================================
-- CommitteeHub v3 Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- 2. Add verification_status to committees
ALTER TABLE committees ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- 3. Create fraud_reports table
CREATE TABLE IF NOT EXISTS fraud_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fraud_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert reports
CREATE POLICY IF NOT EXISTS "fraud_reports_insert" ON fraud_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can read their own reports; super_admin reads all (handled in app)
CREATE POLICY IF NOT EXISTS "fraud_reports_read" ON fraud_reports
  FOR SELECT USING (reporter_id = auth.uid());

-- 4. Update committees RLS to allow all authenticated users to read active/pending
DROP POLICY IF EXISTS "committees_read" ON committees;
CREATE POLICY "committees_read" ON committees
  FOR SELECT USING (
    created_by = auth.uid()
    OR (auth.role() = 'authenticated' AND status IN ('active', 'pending'))
  );

-- 5. Ensure profiles are readable by authenticated users (for admin name display)
DROP POLICY IF EXISTS "profiles_read" ON profiles;
CREATE POLICY "profiles_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. To create a super admin (replace with actual email):
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'superadmin@yourdomain.com';

-- 7. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_fraud_reports_reporter ON fraud_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_status ON fraud_reports(status);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
