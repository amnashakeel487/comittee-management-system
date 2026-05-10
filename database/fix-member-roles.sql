-- FIX: Ensure all members created by admin have role = 'member' in profiles table
-- Run this in Supabase SQL Editor

-- Update profiles table: any user whose email exists in members table = member role
UPDATE profiles
SET role = 'member'
WHERE email IN (SELECT email FROM members)
  AND role != 'member';

-- Also update user metadata for existing member accounts
-- (This ensures getRoleFromDB fallback also works)
UPDATE profiles
SET role = 'member'
WHERE id IN (
  SELECT p.id FROM profiles p
  JOIN members m ON m.email = p.email
)
AND role != 'member';

-- Verify: show current role distribution
SELECT role, COUNT(*) as count FROM profiles GROUP BY role;
