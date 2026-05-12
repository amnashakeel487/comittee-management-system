-- ============================================================
-- Promote existing "members" to sub_admin so they can log in
-- to the sub-admin dashboard.
--
-- Run this ONCE in the Supabase SQL editor after deploying the
-- updated app. It is idempotent — safe to re-run.
--
-- What it does:
--   1. For every row in the `members` table that has an email,
--      find the matching `profiles` row by email and update
--      profiles.role -> 'sub_admin' (unless that profile is a
--      super_admin, which we never overwrite).
--   2. Updates the `members.role` column itself to 'sub_admin'
--      so the UI badge in the Members page reflects reality.
-- ============================================================

-- 1) Profiles: promote to sub_admin (skip super_admins)
UPDATE profiles p
SET    role = 'sub_admin',
       status = COALESCE(p.status, 'active')
FROM   members m
WHERE  LOWER(p.email) = LOWER(m.email)
  AND  p.role IS DISTINCT FROM 'super_admin';

-- 2) Members table: normalize role label for the UI
UPDATE members
SET    role = 'sub_admin'
WHERE  role IS DISTINCT FROM 'sub_admin';

-- 3) Quick sanity check — show what we promoted
SELECT p.email, p.role AS profile_role, m.role AS members_role, m.status
FROM   profiles p
JOIN   members  m ON LOWER(m.email) = LOWER(p.email)
ORDER  BY p.email;
