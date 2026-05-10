-- Add join_requests table for member committee join requests
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_committee ON join_requests(committee_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_member ON join_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Members can view and create their own requests
CREATE POLICY "join_requests_member_select" ON join_requests
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE email = auth.email())
    OR committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

CREATE POLICY "join_requests_member_insert" ON join_requests
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM members WHERE email = auth.email())
  );

-- Admin can update (approve/reject) requests for their committees
CREATE POLICY "join_requests_admin_update" ON join_requests
  FOR UPDATE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

CREATE POLICY "join_requests_admin_delete" ON join_requests
  FOR DELETE USING (
    committee_id IN (SELECT id FROM committees WHERE created_by = auth.uid())
  );

SELECT 'join_requests table created successfully' AS status;
