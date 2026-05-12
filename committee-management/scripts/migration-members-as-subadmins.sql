-- ============================================================
-- Promote existing "members" to sub_admin so they can log in
-- to the sub-admin dashboard.
--
-- Run this ONCE in the Supabase SQL editor after deploying the
-- updated app. It is idempotent — safe to re-run.
--
-- What it does:
--   1. Relaxes the members.role CHECK constraint to also allow
--      'sub_admin' (the original constraint only permits
--      'member'/'admin' which is why the bare UPDATE fails with
--      "members_role_check"). The new constraint allows the full
--      set the app actually uses.
--   2. For every row in `members` with an email, finds the
--      matching `profiles` row by email and sets
--      profiles.role -> 'sub_admin' (never overwrites a
--      super_admin).
--   3. Updates the `members.role` column itself to 'sub_admin'
--      so the UI badge reflects reality.
-- ============================================================

-- 1) Replace the restrictive CHECK constraint on members.role.
--    We drop it (ignore if it doesn't exist) and re-add a wider one.
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_role_check;
ALTER TABLE members
  ADD CONSTRAINT members_role_check
  CHECK (role IN ('member', 'admin', 'sub_admin', 'super_admin'));

-- 2) Profiles: promote to sub_admin (skip super_admins)
UPDATE profiles p
SET    role   = 'sub_admin',
       status = COALESCE(p.status, 'active')
FROM   members m
WHERE  LOWER(p.email) = LOWER(m.email)
  AND  p.role IS DISTINCT FROM 'super_admin';

-- 3) Members table: normalize role label for the UI
UPDATE members
SET    role = 'sub_admin'
WHERE  role IS DISTINCT FROM 'sub_admin';

-- 4) Quick sanity check — show what we promoted
SELECT p.email, p.role AS profile_role, m.role AS members_role, m.status
FROM   profiles p
JOIN   members  m ON LOWER(m.email) = LOWER(p.email)
ORDER  BY p.email;
