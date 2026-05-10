-- CommitteeHub Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COMMITTEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS committees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  monthly_amount DECIMAL(12, 2) NOT NULL CHECK (monthly_amount > 0),
  total_members INTEGER NOT NULL CHECK (total_members >= 2 AND total_members <= 50),
  start_date DATE NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  current_month INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cnic VARCHAR(20) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  payout_order INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, payout_order),
  UNIQUE(committee_id, cnic)
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month > 0),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, member_id, month)
);

-- ============================================
-- PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month > 0),
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'released')),
  payout_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, month)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_committees_created_by ON committees(created_by);
CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status);
CREATE INDEX IF NOT EXISTS idx_members_committee_id ON members(committee_id);
CREATE INDEX IF NOT EXISTS idx_payments_committee_id ON payments(committee_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payouts_committee_id ON payouts(committee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Committees policies
CREATE POLICY "Users can view their own committees"
  ON committees FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create committees"
  ON committees FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own committees"
  ON committees FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own committees"
  ON committees FOR DELETE
  USING (auth.uid() = created_by);

-- Members policies
CREATE POLICY "Users can view members of their committees"
  ON members FOR SELECT
  USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage members of their committees"
  ON members FOR ALL
  USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can view payments of their committees"
  ON payments FOR SELECT
  USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage payments of their committees"
  ON payments FOR ALL
  USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

-- Payouts policies
CREATE POLICY "Users can view payouts of their committees"
  ON payouts FOR SELECT
  USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage payouts of their committees"
  ON payouts FOR ALL
  USING (
    committee_id IN (
      SELECT id FROM committees WHERE created_by = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_committees_updated_at
  BEFORE UPDATE ON committees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data after creating a user

/*
INSERT INTO committees (name, monthly_amount, total_members, start_date, duration_months, status, current_month, created_by)
VALUES
  ('Family Savings Circle', 5000, 10, '2026-01-01', 10, 'active', 5, auth.uid()),
  ('Office Staff Committee', 3000, 8, '2026-02-01', 8, 'active', 4, auth.uid());
*/
