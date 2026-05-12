-- ============================================================
-- Self-service join requests for authenticated sub-admins
--
-- Problem
--   After the role-unification work (everyone who registers is
--   now a `sub_admin`), the Browse Committees page bailed out
--   when a user without an existing `members` row tried to join
--   another sub-admin's committee:
--
--     "No member record found. Ask your admin to add you as a
--      member first."
--
--   That message is a leftover from the old world where only
--   admin-provisioned members could send join requests. With
--   self-registered sub-admins there *is no* admin to add them.
--
-- Fix
--   Expose a SECURITY DEFINER RPC that:
--     • Reads auth.uid() to identify the caller
--     • Looks up name / phone / email in `profiles` (with a
--       fallback to auth.users for email)
--     • Reuses any existing `members` row for that email — or
--       creates a fresh one owned by the caller themselves
--       (created_by = auth.uid()), with role = 'sub_admin'
--     • Upserts a 'pending' row into `join_requests`
--     • Notifies the target committee's admin
--     • Returns the join_requests.id
--
--   Authenticated users may EXECUTE the function. RLS still
--   protects the underlying tables for every other access path.
--
-- Prereqs
--   • migration-members-as-subadmins.sql must have been run so
--     `members_role_check` allows 'sub_admin'.
--
-- Idempotent — safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_join_request_as_self(
  p_committee_id UUID,
  p_message      TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         UUID := auth.uid();
  v_committee_owner UUID;
  v_committee_name  TEXT;
  v_user_email      TEXT;
  v_user_name       TEXT;
  v_user_phone      TEXT;
  v_member_id       UUID;
  v_request_id      UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to send a join request';
  END IF;

  -- Resolve the target committee + its owning admin
  SELECT created_by, name
    INTO v_committee_owner, v_committee_name
    FROM committees
   WHERE id = p_committee_id;

  IF v_committee_owner IS NULL THEN
    RAISE EXCEPTION 'Committee not found';
  END IF;

  IF v_committee_owner = v_user_id THEN
    RAISE EXCEPTION 'You are the admin of this committee — you cannot send a join request to yourself';
  END IF;

  -- Pull profile info for the current user
  SELECT email, name, phone
    INTO v_user_email, v_user_name, v_user_phone
    FROM profiles
   WHERE id = v_user_id;

  -- Fallback: read email from auth.users if profiles row is missing
  IF v_user_email IS NULL OR LENGTH(TRIM(v_user_email)) = 0 THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  IF v_user_email IS NULL OR LENGTH(TRIM(v_user_email)) = 0 THEN
    RAISE EXCEPTION 'No email on file for your account — please update your profile';
  END IF;

  -- Reuse any existing members row for this email (case-insensitive)
  SELECT id INTO v_member_id
    FROM members
   WHERE LOWER(email) = LOWER(v_user_email)
   LIMIT 1;

  -- Otherwise create a self-owned members row.  We deliberately set
  -- created_by = v_user_id (NOT the committee owner) so the caller
  -- owns their own record across multiple committees.
  IF v_member_id IS NULL THEN
    INSERT INTO members (
      name, phone, email, cnic, address,
      role, payout_order, status, created_by
    ) VALUES (
      COALESCE(NULLIF(TRIM(v_user_name), ''), SPLIT_PART(v_user_email, '@', 1)),
      COALESCE(v_user_phone, ''),
      v_user_email,
      NULL,
      NULL,
      'sub_admin', 0, 'active', v_user_id
    )
    RETURNING id INTO v_member_id;
  END IF;

  -- Upsert the join request (one pending row per member+committee)
  INSERT INTO join_requests (committee_id, member_id, message, status)
  VALUES (p_committee_id, v_member_id, NULLIF(TRIM(p_message), ''), 'pending')
  ON CONFLICT (committee_id, member_id) DO UPDATE
    SET status      = 'pending',
        message     = COALESCE(EXCLUDED.message, join_requests.message),
        reviewed_by = NULL,
        reviewed_at = NULL
  RETURNING id INTO v_request_id;

  -- Notify the committee admin
  INSERT INTO notifications (user_id, title, message, type, read)
  VALUES (
    v_committee_owner,
    'New Join Request',
    COALESCE(NULLIF(TRIM(v_user_name), ''), v_user_email)
      || ' has requested to join "'
      || COALESCE(v_committee_name, 'your committee')
      || '"',
    'info',
    FALSE
  );

  RETURN v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_join_request_as_self(UUID, TEXT)
  TO authenticated;
