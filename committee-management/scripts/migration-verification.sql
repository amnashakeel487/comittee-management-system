-- ============================================================
-- Verification Request System Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cnic_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  cnic_front_url TEXT,
  cnic_back_url TEXT,
  selfie_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',  -- pending | approved | rejected
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add verification columns to profiles (if not already there)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
-- verification_status: unverified | pending | verified | rejected

-- 3. Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Sub-admins can insert their own requests
DROP POLICY IF EXISTS "vr_insert" ON verification_requests;
CREATE POLICY "vr_insert" ON verification_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Sub-admins can read their own requests
DROP POLICY IF EXISTS "vr_select_own" ON verification_requests;
CREATE POLICY "vr_select_own" ON verification_requests
  FOR SELECT USING (user_id = auth.uid());

-- 5. Storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "vd_upload" ON storage.objects;
CREATE POLICY "vd_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-docs' AND
    auth.role() = 'authenticated'
  );

-- Users can read their own files
DROP POLICY IF EXISTS "vd_read_own" ON storage.objects;
CREATE POLICY "vd_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-docs' AND
    auth.role() = 'authenticated'
  );

-- 6. Index
CREATE INDEX IF NOT EXISTS idx_vr_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vr_status ON verification_requests(status);
