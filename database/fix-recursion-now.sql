-- EMERGENCY FIX: Infinite recursion in committees RLS policy
-- Run this IMMEDIATELY in Supabase SQL Editor

-- Drop the broken policy that causes recursion
DROP POLICY IF EXISTS "committees_select" ON committees;

-- Recreate with SECURITY DEFINER function to break the recursion cycle
-- Simple approach: admin sees own, member sees via a security definer function

-- Create a helper function that bypasses RLS to get committee IDs for a member
CREATE OR REPLACE FUNCTION get_member_committee_ids(member_email TEXT)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT cm.committee_id
  FROM committee_members cm
  INNER JOIN members m ON m.id = cm.member_id
  WHERE m.email = member_email;
$$;

-- Now create the policy using the function (no recursion since function uses SECURITY DEFINER)
CREATE POLICY "committees_select" ON committees
  FOR SELECT USING (
    auth.uid() = created_by
    OR id IN (SELECT get_member_committee_ids(auth.email()))
  );

SELECT 'Recursion fixed successfully' AS status;
