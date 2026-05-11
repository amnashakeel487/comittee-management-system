// ── Core User ─────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  cnic?: string;
  avatar?: string;
  role: 'admin' | 'super_admin';
  status?: 'active' | 'suspended' | 'banned';
  verified?: boolean;
  created_at?: string;
}

// ── Committee ─────────────────────────────────────────────────
export interface Committee {
  id: string;
  name: string;
  monthly_amount: number;
  total_members: number;
  start_date: string;
  end_date?: string;
  due_day?: number;
  duration_months: number;
  description?: string;
  status: 'active' | 'completed' | 'pending' | 'suspended';
  verification_status?: 'unverified' | 'verified' | 'flagged';
  created_by: string;
  created_at?: string;
  current_month?: number;
}

// ── Committee Participant (replaces Member) ───────────────────
// Now references profiles (auth users) directly
export interface CommitteeParticipant {
  id: string;
  committee_id: string;
  user_id: string;           // references profiles.id
  payout_order: number;
  turn_assigned_by?: 'manual' | 'spin';
  status: 'active' | 'inactive';
  joined_at?: string;
  profile?: User;            // joined profile data
  committee?: Committee;
}

// ── Legacy Member (kept for backward compat with existing data) ──
export interface Member {
  id: string;
  committee_id?: string | null;
  user_id?: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  cnic?: string;
  profile_image?: string;
  role: 'admin' | 'member';
  payout_order: number;
  status: 'active' | 'inactive';
  login_password?: string;
  created_by?: string;
  created_at?: string;
}

// ── CommitteeMember (junction — kept for DB compat) ──────────
export interface CommitteeMember {
  id: string;
  committee_id: string;
  member_id: string;
  payout_order: number;
  turn_assigned_by?: 'manual' | 'spin';
  status: 'active' | 'inactive';
  joined_at?: string;
  member?: Member;
  committee?: Committee;
}

// ── Payment ───────────────────────────────────────────────────
export interface Payment {
  id: string;
  committee_id: string;
  member_id: string;
  member_name?: string;
  committee_name?: string;
  month: number;
  amount: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  payment_date?: string;
  screenshot_url?: string;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
}

// ── Payout ────────────────────────────────────────────────────
export interface Payout {
  id: string;
  committee_id: string;
  committee_name?: string;
  member_id: string;
  receiver_name?: string;
  month: number;
  total_amount: number;
  status: 'pending' | 'released' | 'scheduled';
  payout_date?: string;
  created_at?: string;
}

// ── Notification ──────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

// ── Fraud Report ──────────────────────────────────────────────
export interface FraudReport {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  committee_id?: string;
  reason: 'fraud' | 'fake_payment' | 'spam' | 'inactive' | 'abuse' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  created_at?: string;
  reporter_name?: string;
  reported_user_name?: string;
  committee_name?: string;
}

// ── Dashboard Stats ───────────────────────────────────────────
export interface DashboardStats {
  totalCommittees: number;
  activeCommittees: number;
  completedCommittees: number;
  totalMembers: number;
  pendingPayments: number;
  paidPayments: number;
  totalCollected: number;
  upcomingPayout?: Payout;
}
