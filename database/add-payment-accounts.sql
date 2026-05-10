-- Payment accounts table — admin bank/wallet details shown to members
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'easypaisa', 'jazzcash', 'nayapay', 'sadapay', 'other')),
  account_title TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT,
  iban TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_accounts_user ON payment_accounts(user_id);

ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid "already exists" errors
DROP POLICY IF EXISTS "payment_accounts_owner" ON payment_accounts;
DROP POLICY IF EXISTS "payment_accounts_member_view" ON payment_accounts;

-- Admin can manage their own accounts
CREATE POLICY "payment_accounts_owner" ON payment_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Members can view accounts of admins whose committees they belong to
CREATE POLICY "payment_accounts_member_view" ON payment_accounts
  FOR SELECT USING (
    user_id IN (
      SELECT c.created_by FROM committees c
      JOIN committee_members cm ON cm.committee_id = c.id
      JOIN members m ON m.id = cm.member_id
      WHERE m.email = auth.email()
    )
  );

SELECT 'payment_accounts table created successfully' AS status;
