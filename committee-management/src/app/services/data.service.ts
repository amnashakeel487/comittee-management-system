import { Injectable, signal } from '@angular/core';
import { Committee, Member, CommitteeMember, Payment, Payout, DashboardStats } from '../models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  isLoading = signal(false);

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  private get userId(): string { return this.auth.currentUser()?.id || ''; }

  // ── COMMITTEES ────────────────────────────────────────────────

  async getCommittees(): Promise<Committee[]> {
    if (!this.userId) throw new Error('Not authenticated');
    const { data, error } = await this.supabase.from('committees')
      .select('*').eq('created_by', this.userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getCommitteeById(id: string): Promise<Committee | null> {
    let q = this.supabase.from('committees').select('*').eq('id', id);
    if (this.userId) q = q.eq('created_by', this.userId);
    const { data, error } = await q.single();
    if (error) { console.error('getCommitteeById:', error.message); return null; }
    return data;
  }

  async createCommittee(input: Partial<Committee>): Promise<Committee> {
    if (!this.userId) throw new Error('Not authenticated. Please log in again.');

    const insertData: any = {
      name: input.name,
      monthly_amount: input.monthly_amount,
      total_members: input.total_members,
      start_date: input.start_date,
      duration_months: input.duration_months,
      description: input.description || null,
      status: 'pending',
      current_month: 0,
      created_by: this.userId
    };

    if (input.end_date) insertData.end_date = input.end_date;
    if (input.due_day) insertData.due_day = input.due_day;

    // Add 10-second timeout to prevent infinite hang
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Check your internet connection and Supabase RLS policies.')), 10000)
    );

    const insertPromise = this.supabase.from('committees')
      .insert(insertData).select().single();

    const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

    if (error) {
      console.error('createCommittee error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async updateCommittee(id: string, input: Partial<Committee>): Promise<Committee> {
    const { data, error } = await this.supabase.from('committees')
      .update(input).eq('id', id).eq('created_by', this.userId).select().single();
    if (error) throw error;
    return data;
  }

  async deleteCommittee(id: string): Promise<void> {
    // First delete related committee_members (in case cascade isn't set up)
    await this.supabase.from('committee_members')
      .delete().eq('committee_id', id);

    const { error, count } = await this.supabase.from('committees')
      .delete({ count: 'exact' }).eq('id', id).eq('created_by', this.userId);
    if (error) throw new Error(error.message);
    if (count === 0) throw new Error('Delete failed: committee not found or permission denied');
  }

  // ── MEMBERS ───────────────────────────────────────────────────

  async getMembers(): Promise<Member[]> {
    const { data, error } = await this.supabase.from('members')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createMember(input: Partial<Member> & { password?: string }): Promise<Member> {
    let supabaseUserId: string | null = null;

    if (input.email && input.password) {
      // Every member added by the super admin is provisioned as a sub_admin so they
      // can log into the sub-admin dashboard. Their auth metadata + profiles row
      // both carry role='sub_admin' — that's what AuthService.login() and the
      // subAdminGuard read to decide where to send them after login.
      const { data: signUpData, error: signUpError } = await this.supabase.signUp(
        input.email, input.password, input.name || '',
        { role: 'sub_admin', phone: input.phone || '' }
      );
      if (signUpError && !signUpError.message?.includes('already registered')) {
        console.warn('Signup warning:', signUpError.message);
      }
      supabaseUserId = signUpData?.user?.id || null;

      if (supabaseUserId) {
        await this.supabase.client.from('profiles').upsert({
          id: supabaseUserId,
          name: input.name || '',
          email: input.email,
          phone: input.phone || null,
          role: 'sub_admin',
          status: 'active'
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.warn('Profile upsert warning:', error.message);
        });
      }
    }

    const { data, error } = await this.supabase.from('members')
      .insert({
        name: input.name, phone: input.phone, email: input.email,
        address: input.address || null, cnic: input.cnic || null,
        role: 'sub_admin',
        payout_order: input.payout_order || 1,
        status: 'active', created_by: this.userId,
        login_password: input.password || null
      }).select().single();

    if (error) { console.error('createMember:', error); throw new Error(error.message); }
    return data;
  }

  async updateMember(id: string, input: Partial<Member>): Promise<Member> {
    const { data, error } = await this.supabase.from('members')
      .update({ name: input.name, phone: input.phone, email: input.email,
        address: input.address, cnic: input.cnic, role: input.role,
        payout_order: input.payout_order, status: input.status })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteMember(id: string): Promise<void> {
    const { error } = await this.supabase.from('members').delete().eq('id', id);
    if (error) throw error;
  }

  // ── COMMITTEE MEMBERS ─────────────────────────────────────────

  async getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
    const { data, error } = await this.supabase.from('committee_members')
      .select('*, members(*)').eq('committee_id', committeeId).order('payout_order');
    if (error) { console.warn('getCommitteeMembers:', error.message); return []; }
    return (data || []).map((row: any) => ({
      id: row.id, committee_id: row.committee_id, member_id: row.member_id,
      payout_order: row.payout_order, turn_assigned_by: row.turn_assigned_by,
      status: row.status, joined_at: row.joined_at, member: row.members as Member
    }));
  }

  /** Enroll a member into a committee without assigning a payout slot (payout_order = 0) */
  async enrollMemberInCommittee(memberId: string, committeeId: string): Promise<CommitteeMember> {
    // Check if already enrolled
    const { data: existing } = await this.supabase.from('committee_members')
      .select('id').eq('committee_id', committeeId).eq('member_id', memberId).maybeSingle();
    if (existing) throw new Error('Member is already in this committee');

    const { data, error } = await this.supabase.from('committee_members')
      .insert({ committee_id: committeeId, member_id: memberId, payout_order: 0, status: 'active' })
      .select('*, members(*)').single();
    if (error) throw new Error(error.message);
    return { id: data.id, committee_id: data.committee_id, member_id: data.member_id,
      payout_order: data.payout_order, turn_assigned_by: data.turn_assigned_by,
      status: data.status, joined_at: data.joined_at, member: data.members as Member };
  }

  async assignMemberToCommittee(memberId: string, committeeId: string, payoutOrder: number, assignedBy: 'manual' | 'spin' = 'manual'): Promise<CommitteeMember> {
    // If already enrolled (payout_order=0), update; otherwise insert
    const { data: existing } = await this.supabase.from('committee_members')
      .select('id').eq('committee_id', committeeId).eq('member_id', memberId).maybeSingle();

    let data: any, error: any;
    if (existing) {
      ({ data, error } = await this.supabase.from('committee_members')
        .update({ payout_order: payoutOrder, turn_assigned_by: assignedBy, status: 'active' })
        .eq('id', existing.id)
        .select('*, members(*)').single());
    } else {
      ({ data, error } = await this.supabase.from('committee_members')
        .insert({ committee_id: committeeId, member_id: memberId, payout_order: payoutOrder, turn_assigned_by: assignedBy, status: 'active' })
        .select('*, members(*)').single());
    }
    if (error) throw new Error(error.message);

    // Auto-generate a scheduled payout for this member's turn
    if (payoutOrder > 0) {
      await this.ensurePayoutExists(committeeId, memberId, payoutOrder);
    }

    return { id: data.id, committee_id: data.committee_id, member_id: data.member_id,
      payout_order: data.payout_order, turn_assigned_by: data.turn_assigned_by,
      status: data.status, joined_at: data.joined_at, member: data.members as Member };
  }

  /** Creates a scheduled payout record if one doesn't already exist */
  private async ensurePayoutExists(committeeId: string, memberId: string, month: number): Promise<void> {
    try {
      // Check if already exists
      const { data: existing } = await this.supabase.from('payouts')
        .select('id').eq('committee_id', committeeId).eq('member_id', memberId).eq('month', month).maybeSingle();
      if (existing) return;

      // Get committee details for amount calculation
      const { data: committee } = await this.supabase.from('committees')
        .select('monthly_amount, total_members, start_date').eq('id', committeeId).single();
      if (!committee) return;

      const payoutAmount = committee.monthly_amount * committee.total_members;
      const startDate = new Date(committee.start_date);
      startDate.setMonth(startDate.getMonth() + month - 1);
      const payoutDate = startDate.toISOString().split('T')[0];

      await this.supabase.from('payouts').insert({
        committee_id: committeeId,
        member_id: memberId,
        month,
        total_amount: payoutAmount,
        payout_date: payoutDate,
        status: 'scheduled'
      });
    } catch (e) {
      console.warn('ensurePayoutExists warning:', e);
    }
  }

  async updatePayoutOrder(id: string, payoutOrder: number): Promise<void> {
    const { error } = await this.supabase.from('committee_members')
      .update({ payout_order: payoutOrder }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async removeMemberFromCommittee(memberId: string, committeeId: string): Promise<void> {
    const { error } = await this.supabase.from('committee_members')
      .delete().eq('member_id', memberId).eq('committee_id', committeeId);
    if (error) throw new Error(error.message);
  }

  // ── PAYMENTS ──────────────────────────────────────────────────

  async getPayments(committeeId?: string): Promise<Payment[]> {
    // Fetch this admin's committee IDs first — avoids unreliable join filtering
    const { data: myCommittees } = await this.supabase.from('committees')
      .select('id, name').eq('created_by', this.userId);

    if (!myCommittees?.length) return [];

    const committeeIds = committeeId
      ? [committeeId]
      : myCommittees.map((c: any) => c.id);

    const nameMap: Record<string, string> = {};
    myCommittees.forEach((c: any) => { nameMap[c.id] = c.name; });

    const { data, error } = await this.supabase.from('payments')
      .select('*, members(name)')
      .in('committee_id', committeeIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((p: any) => ({
      id: p.id, committee_id: p.committee_id, member_id: p.member_id,
      member_name: p.members?.name || '',
      committee_name: nameMap[p.committee_id] || '',
      month: p.month, amount: p.amount, status: p.status,
      payment_date: p.payment_date, screenshot_url: p.screenshot_url,
      notes: p.notes, reviewed_by: p.reviewed_by, reviewed_at: p.reviewed_at,
      created_at: p.created_at
    }));
  }

  async getMemberPayments(memberEmail: string): Promise<Payment[]> {
    const { data: member } = await this.supabase.from('members').select('id').eq('email', memberEmail).single();
    if (!member) return [];
    const { data, error } = await this.supabase.from('payments')
      .select('*, committees(name)').eq('member_id', member.id).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map((p: any) => ({
      id: p.id, committee_id: p.committee_id, member_id: p.member_id,
      committee_name: p.committees?.name || '', month: p.month, amount: p.amount,
      status: p.status, payment_date: p.payment_date, screenshot_url: p.screenshot_url,
      notes: p.notes, created_at: p.created_at
    }));
  }

  async createPayment(input: Partial<Payment>): Promise<Payment> {
    const { data, error } = await this.supabase.from('payments')
      .insert({ committee_id: input.committee_id, member_id: input.member_id,
        month: input.month, amount: input.amount, status: input.status || 'under_review',
        payment_date: input.payment_date, screenshot_url: input.screenshot_url, notes: input.notes })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updatePaymentStatus(id: string, status: Payment['status'], notes?: string): Promise<Payment> {
    const { data, error } = await this.supabase.from('payments')
      .update({ status, notes: notes || null, reviewed_by: this.userId, reviewed_at: new Date().toISOString(),
        ...(status === 'approved' ? { payment_date: new Date().toISOString().split('T')[0] } : {}) })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async markPaymentPaid(id: string): Promise<Payment> {
    return this.updatePaymentStatus(id, 'approved');
  }

  async uploadPaymentScreenshot(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { data, error } = await this.supabase.client.storage
      .from('payment-screenshots').upload(fileName, file, { upsert: false });
    if (error) throw new Error(error.message);
    const { data: urlData } = this.supabase.client.storage
      .from('payment-screenshots').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  // ── PAYOUTS ───────────────────────────────────────────────────

  async getPayouts(committeeId?: string): Promise<Payout[]> {
    // First get this admin's committee IDs — more reliable than join filtering
    const { data: myCommittees } = await this.supabase.from('committees')
      .select('id, name').eq('created_by', this.userId);

    if (!myCommittees?.length) return [];

    const committeeIds = committeeId
      ? [committeeId]
      : myCommittees.map((c: any) => c.id);

    const { data, error } = await this.supabase.from('payouts')
      .select('*, members(name)')
      .in('committee_id', committeeIds)
      .order('month');

    if (error) throw error;

    // Build a name lookup from the committees we already fetched
    const nameMap: Record<string, string> = {};
    myCommittees.forEach((c: any) => { nameMap[c.id] = c.name; });

    return (data || []).map((p: any) => ({
      id: p.id, committee_id: p.committee_id,
      committee_name: nameMap[p.committee_id] || '',
      member_id: p.member_id, receiver_name: p.members?.name || '',
      month: p.month, total_amount: p.total_amount, status: p.status,
      payout_date: p.payout_date, created_at: p.created_at
    }));
  }

  async releasePayout(id: string): Promise<Payout> {
    const { data, error } = await this.supabase.from('payouts')
      .update({ status: 'released', payout_date: new Date().toISOString().split('T')[0] })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // ── NOTIFICATIONS ─────────────────────────────────────────────

  async getNotifications(): Promise<any[]> {
    const { data, error } = await this.supabase.from('notifications')
      .select('*').eq('user_id', this.userId).order('created_at', { ascending: false }).limit(20);
    if (error) return [];
    return data || [];
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.supabase.from('notifications').update({ read: true }).eq('id', id);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.supabase.from('notifications').update({ read: true }).eq('user_id', this.userId);
  }

  // ── JOIN REQUESTS ─────────────────────────────────────────────

  async getPendingJoinRequestsCount(): Promise<number> {
    if (!this.userId) return 0;
    try {
      const { data: committees } = await this.supabase.from('committees')
        .select('id').eq('created_by', this.userId);
      if (!committees?.length) return 0;
      const ids = committees.map((c: any) => c.id);
      const { count } = await this.supabase.client
        .from('join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('committee_id', ids);
      return count || 0;
    } catch { return 0; }
  }

  // ── DASHBOARD ─────────────────────────────────────────────────

  async getDashboardStats(): Promise<DashboardStats> {
    const [committees, payments, payouts, members] = await Promise.all([
      this.getCommittees(),
      this.getPayments().catch(() => []),
      this.getPayouts().catch(() => []),
      this.getMembers().catch(() => [])
    ]);
    return {
      totalCommittees: committees.length,
      activeCommittees: committees.filter(c => c.status === 'active').length,
      completedCommittees: committees.filter(c => c.status === 'completed').length,
      totalMembers: members.length,
      pendingPayments: payments.filter(p => p.status === 'pending' || p.status === 'under_review').length,
      paidPayments: payments.filter(p => p.status === 'approved').length,
      totalCollected: payments.filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0),
      upcomingPayout: payouts.find(p => p.status === 'scheduled')
    };
  }

  async getMonthlyCollectionData(): Promise<{ month: string; amount: number }[]> {
    const { data: myCommittees } = await this.supabase.from('committees')
      .select('id').eq('created_by', this.userId);
    if (!myCommittees?.length) return [];

    const ids = myCommittees.map((c: any) => c.id);
    const { data, error } = await this.supabase.from('payments')
      .select('amount, payment_date')
      .in('committee_id', ids)
      .eq('status', 'approved')
      .not('payment_date', 'is', null);

    if (error || !data?.length) return [];
    const monthMap: Record<string, number> = {};
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    data.forEach((p: any) => {
      if (p.payment_date) {
        const key = names[new Date(p.payment_date).getMonth()];
        monthMap[key] = (monthMap[key] || 0) + p.amount;
      }
    });
    return Object.entries(monthMap).map(([month, amount]) => ({ month, amount }));
  }
}
