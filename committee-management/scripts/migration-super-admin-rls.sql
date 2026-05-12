-- ============================================================
-- Fix: Super admin can't approve verifications
--
-- Problem
--   • `profiles_update` policy only allows `id = auth.uid()`,
--     so a super-admin cannot flip another user's `verified`
--     column — Postgres silently filters the UPDATE.
--   • `verification_requests` has no UPDATE policy at all, so
--     setting status='approved' is also silently dropped.
--   • The only thing that worked in the approve() flow was the
--     INSERT into `notifications` (permissive policy), which is
--     why the user gets the "Account Verified" notification but
--     the verification page still shows "Not Verified".
--
-- Fix
--   1. A SECURITY DEFINER helper, `is_super_admin()`, that
--      reports whether the calling user has role='super_admin'
--      in `profiles`. SECURITY DEFINER avoids RLS recursion.
--   2. New permissive policies that let `is_super_admin()`
--      UPDATE any profile, and SELECT/UPDATE any
--      verification_requests row.
--   3. Backfill: for every verification_requests row that was
--      "approved" but the profile didn't update (because of the
--      bug above), flip the profile to verified now.
-- Idempotent — safe to re-run.
-- ============================================================

-- 1) Helper: am I a super admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;

-- 2) Profiles: super admin can UPDATE any row.
--    (Original "id = auth.uid()" policy stays in place; the two
--    policies are OR'd together, so users can still update their
--    own profile.)
DROP POLICY IF EXISTS "profiles_update_super_admin" ON profiles;
CREATE POLICY "profiles_update_super_admin" ON profiles
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 3) verification_requests: super admin can SELECT every row.
DROP POLICY IF EXISTS "vr_select_super_admin" ON verification_requests;
CREATE POLICY "vr_select_super_admin" ON verification_requests
  FOR SELECT
  USING (public.is_super_admin());

-- 4) verification_requests: super admin can UPDATE every row.
DROP POLICY IF EXISTS "vr_update_super_admin" ON verification_requests;
CREATE POLICY "vr_update_super_admin" ON verification_requests
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 5) Also let the request owner UPDATE their own row (e.g. the
--    sub-admin re-submits after a rejection). This was missing.
DROP POLICY IF EXISTS "vr_update_own" ON verification_requests;
CREATE POLICY "vr_update_own" ON verification_requests
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6) Backfill: any request the super-admin already marked as
--    'approved' should have a verified profile. If your previous
--    "approve" clicks were silently dropped at step 1, the
--    verification_requests row will still say 'pending' — so we
--    cannot tell from there alone. Instead, look for users who
--    received an "Account Verified" notification but whose
--    profile is still not verified, and fix them.
UPDATE profiles p
SET    verified            = TRUE,
       verification_status = 'verified'
WHERE  p.verified IS DISTINCT FROM TRUE
  AND  EXISTS (
    SELECT 1 FROM notifications n
    WHERE  n.user_id = p.id
      AND  n.title ILIKE 'Account Verified%'
  );

-- 7) Also bring the verification_requests row back in sync.
UPDATE verification_requests v
SET    status      = 'approved',
       reviewed_at = COALESCE(v.reviewed_at, NOW())
FROM   profiles p
WHERE  v.user_id = p.id
  AND  p.verified = TRUE
  AND  v.status   = 'pending';

-- 8) Sanity check — show what we have now.
SELECT p.email, p.verified, p.verification_status,
       v.status AS request_status, v.reviewed_at
FROM   profiles p
LEFT   JOIN verification_requests v ON v.user_id = p.id
WHERE  v.id IS NOT NULL
ORDER  BY v.created_at DESC;
