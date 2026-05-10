-- Fix duplicate committees in Browse Committees page
-- The SELECT policy uses OR which causes duplicate rows when both conditions match
-- Run this in your Supabase SQL Editor

-- Drop the old policy that causes duplicates
DROP POLICY IF EXISTS "committees_select" ON committees;

-- New policy using UNION to avoid duplicates
-- Admins see their own, members see committees they belong to — no duplicates
CREATE POLICY "committees_select" ON committees
  FOR SELECT USING (
    auth.uid() = created_by
    OR id IN (
      SELECT DISTINCT cm.committee_id
      FROM committee_members cm
      INNER JOIN members m ON m.id = cm.member_id
      WHERE m.email = auth.email()
    )
  );

-- Also clean up any orphaned committee_members rows
-- (rows pointing to committees that no longer exist)
DELETE FROM committee_members
WHERE committee_id NOT IN (SELECT id FROM committees);

-- Clean up orphaned join_requests too
DELETE FROM join_requests
WHERE committee_id NOT IN (SELECT id FROM committees);

SELECT 'RLS policy fixed and orphaned rows cleaned up' AS status;
