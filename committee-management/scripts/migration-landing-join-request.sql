-- ============================================================
-- Landing page: anonymous "Request to Join" submissions
--
-- Problem
--   The landing page's submitJoin() was a fake — it showed a
--   success toast but never wrote to the database, so admins
--   never saw incoming requests.
--
-- Even after wiring the form to Supabase, an anonymous visitor
-- cannot INSERT directly into `members` or `join_requests`
-- because of RLS. Rather than open those tables to anon
-- writes, this migration exposes a single, validated entry
-- point as a SECURITY DEFINER function that anon may call:
--
--   submit_landing_join_request(
--     p_committee_id, p_full_name, p_phone, p_email,
--     p_cnic, p_address, p_message
--   )
--
-- The function:
--   • Validates the committee exists
--   • Finds-or-creates a `members` row owned by that committee's
--     admin (so it shows up in their Members list later)
--   • Upserts a 'pending' row into `join_requests`
--   • Notifies the committee admin
--   • Returns the join_requests.id
--
-- Idempotent — safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_landing_join_request(
  p_committee_id UUID,
  p_full_name    TEXT,
  p_phone        TEXT,
  p_email        TEXT,
  p_cnic         TEXT,
  p_address      TEXT,
  p_message      TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_committee_owner UUID;
  v_committee_name  TEXT;
  v_member_id       UUID;
  v_request_id      UUID;
BEGIN
  -- Basic validation
  IF p_full_name IS NULL OR LENGTH(TRIM(p_full_name)) = 0 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF p_phone IS NULL OR LENGTH(TRIM(p_phone)) = 0 THEN
    RAISE EXCEPTION 'Phone is required';
  END IF;
  IF p_cnic IS NULL OR LENGTH(TRIM(p_cnic)) = 0 THEN
    RAISE EXCEPTION 'CNIC is required';
  END IF;

  -- Resolve committee + its owner (the sub-admin who will review)
  SELECT created_by, name
    INTO v_committee_owner, v_committee_name
    FROM committees
   WHERE id = p_committee_id;

  IF v_committee_owner IS NULL THEN
    RAISE EXCEPTION 'Committee not found';
  END IF;

  -- Find existing members row for this admin, keyed by email (case-insensitive).
  -- We scope by created_by so two different admins can each have their own copy
  -- of "the same person" with their own committees.
  IF p_email IS NOT NULL AND LENGTH(TRIM(p_email)) > 0 THEN
    SELECT id INTO v_member_id
      FROM members
     WHERE LOWER(email) = LOWER(p_email)
       AND created_by = v_committee_owner
     LIMIT 1;
  END IF;

  -- Fall back to CNIC match if no email match
  IF v_member_id IS NULL THEN
    SELECT id INTO v_member_id
      FROM members
     WHERE cnic = p_cnic
       AND created_by = v_committee_owner
     LIMIT 1;
  END IF;

  -- Otherwise create a fresh members row attributed to the committee admin.
  -- role='member' is allowed by the relaxed members_role_check we set in
  -- migration-members-as-subadmins.sql.
  IF v_member_id IS NULL THEN
    INSERT INTO members (
      name, phone, email, cnic, address,
      role, payout_order, status, created_by
    )
    VALUES (
      p_full_name, p_phone, p_email, p_cnic, p_address,
      'member', 0, 'active', v_committee_owner
    )
    RETURNING id INTO v_member_id;
  END IF;

  -- Upsert the join request (one pending row per member+committee).
  INSERT INTO join_requests (committee_id, member_id, message, status)
  VALUES (p_committee_id, v_member_id, NULLIF(TRIM(p_message), ''), 'pending')
  ON CONFLICT (committee_id, member_id) DO UPDATE
    SET status     = 'pending',
        message    = COALESCE(EXCLUDED.message, join_requests.message),
        reviewed_by = NULL,
        reviewed_at = NULL
  RETURNING id INTO v_request_id;

  -- Notify the committee admin
  INSERT INTO notifications (user_id, title, message, type, read)
  VALUES (
    v_committee_owner,
    'New Join Request',
    p_full_name || ' has requested to join "' || COALESCE(v_committee_name, 'your committee') || '"',
    'info',
    FALSE
  );

  RETURN v_request_id;
END;
$$;

-- Allow anon and authenticated to call this RPC
GRANT EXECUTE ON FUNCTION public.submit_landing_join_request(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;
