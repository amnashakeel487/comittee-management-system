-- Fix payments status check constraint
-- The old schema only allowed: 'pending', 'paid', 'overdue'
-- The app needs:              'pending', 'under_review', 'approved', 'rejected'
-- Run this in your Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add the updated constraint with all required statuses
ALTER TABLE payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'paid', 'overdue'));

-- Verify it worked
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'payments_status_check';
