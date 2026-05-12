-- ============================================================
-- Review & Reputation System Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  payment_behavior_rating INTEGER CHECK (payment_behavior_rating >= 1 AND payment_behavior_rating <= 5),
  review_message TEXT,
  tags TEXT[],  -- ['trusted', 'late_payer', 'cooperative', 'responsive', 'fraud_risk', 'recommended']
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_user_id, committee_id)
);

-- 2. Payment behavior tracking
CREATE TABLE IF NOT EXISTS payment_behavior (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  due_date DATE,
  paid_date DATE,
  days_late INTEGER DEFAULT 0,
  status TEXT DEFAULT 'on_time',  -- on_time | late | missed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add reputation columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(3,1) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS on_time_payment_percentage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS late_payment_percentage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_payments INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS on_time_payments INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS late_payments INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS missed_payments INTEGER DEFAULT 0;

-- 4. Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_behavior ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid() AND reviewer_id != reviewed_user_id);

DROP POLICY IF EXISTS "reviews_update_flag" ON reviews;
CREATE POLICY "reviews_update_flag" ON reviews
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "pb_select" ON payment_behavior;
CREATE POLICY "pb_select" ON payment_behavior FOR SELECT USING (true);

DROP POLICY IF EXISTS "pb_insert" ON payment_behavior;
CREATE POLICY "pb_insert" ON payment_behavior
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_committee ON reviews(committee_id);
CREATE INDEX IF NOT EXISTS idx_pb_user ON payment_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_pb_committee ON payment_behavior(committee_id);
