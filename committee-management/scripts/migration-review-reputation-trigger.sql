-- ============================================================
-- Auto-maintain profiles.reputation_score / review_count
--
-- Problem
--   submitReview() in the Angular app calls
--     UPDATE profiles SET reputation_score = ..., review_count = ...
--     WHERE id = <reviewed_user_id>
--   right after inserting the review row.  But the default RLS on
--   `profiles` only allows a user to update their OWN row
--   (id = auth.uid()).  When user A reviews user B, that cross-user
--   UPDATE is silently dropped, so B's reputation card keeps showing
--   "0.0 Risky • 0 reviews" forever even though the review rows
--   themselves are inserted fine.
--
-- Fix
--   Add a SECURITY DEFINER trigger on `reviews` that recomputes and
--   writes the two reputation fields on whichever profile is
--   affected by the INSERT / UPDATE / DELETE.  Because the trigger
--   function runs as its owner (a superuser) it bypasses the RLS
--   policy on `profiles` cleanly, and the dot-product of any
--   reviewer with any reviewed user is now consistent.
--
--   We also backfill every existing profile that already has reviews
--   so old data lines up with reality on first run.
--
-- Idempotent — safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.recalc_user_reputation(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_avg   NUMERIC(3,1);
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::INT,
         COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0)
    INTO v_count, v_avg
    FROM reviews
   WHERE reviewed_user_id = p_user_id;

  UPDATE profiles
     SET reputation_score = v_avg,
         review_count     = v_count
   WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_reviews_update_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_user_reputation(NEW.reviewed_user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- A review's reviewed_user_id can in principle change, so refresh
    -- both the old and new target so neither is left out of sync.
    PERFORM public.recalc_user_reputation(NEW.reviewed_user_id);
    IF OLD.reviewed_user_id IS DISTINCT FROM NEW.reviewed_user_id THEN
      PERFORM public.recalc_user_reputation(OLD.reviewed_user_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_user_reputation(OLD.reviewed_user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reviews_update_reputation ON reviews;
CREATE TRIGGER reviews_update_reputation
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reviews_update_reputation();

-- One-time backfill so profiles that already have reviews come into
-- alignment immediately (before any new reviews fire the trigger).
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT reviewed_user_id
      FROM reviews
     WHERE reviewed_user_id IS NOT NULL
  LOOP
    PERFORM public.recalc_user_reputation(rec.reviewed_user_id);
  END LOOP;
END $$;
