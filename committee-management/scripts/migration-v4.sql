-- ============================================================
-- CommitteeHub v4 Migration — sub_admin / super_admin roles
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Rename 'admin' role to 'sub_admin' in profiles table
UPDATE profiles SET role = 'sub_admin' WHERE role = 'admin';

-- 2. Add trust_score column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100;

-- 3. Add status and verified columns (if not already added in v3)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- 4. Add verification_status to committees (if not already added)
ALTER TABLE committees ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- 5. Create fraud_reports table (if not exists)
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

DROP POLICY IF EXISTS "fraud_reports_insert" ON fraud_reports;
CREATE POLICY "fraud_reports_insert" ON fraud_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "fraud_reports_read" ON fraud_reports;
CREATE POLICY "fraud_reports_read" ON fraud_reports
  FOR SELECT USING (reporter_id = auth.uid());

-- 6. Update committees RLS
DROP POLICY IF EXISTS "committees_read" ON committees;
CREATE POLICY "committees_read" ON committees
  FOR SELECT USING (
    created_by = auth.uid()
    OR (auth.role() = 'authenticated' AND status IN ('active', 'pending'))
  );

-- 7. Profiles readable by all authenticated users
DROP POLICY IF EXISTS "profiles_read" ON profiles;
CREATE POLICY "profiles_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Profiles writable by owner
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_status ON fraud_reports(status);

-- 10. Set your super admin (replace with actual email):
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'your-super-admin@email.com';

-- VERIFY:
-- SELECT email, role, status FROM profiles ORDER BY created_at DESC LIMIT 20;
