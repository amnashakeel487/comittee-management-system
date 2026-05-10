import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MemberDataService {
  private _memberRecord = signal<any>(null);
  private _memberships = signal<any[]>([]);
  private _loaded = false;

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  async getMemberRecord(): Promise<any> {
    if (this._memberRecord()) return this._memberRecord();
    const email = this.auth.currentUser()?.email;
    if (!email) return null;
    const { data } = await this.supabase.client
      .from('members').select('*').eq('email', email).maybeSingle();
    this._memberRecord.set(data);
    return data;
  }

  async getMemberships(): Promise<any[]> {
    if (this._loaded) return this._memberships();
    const member = await this.getMemberRecord();
    if (!member) return [];

    const { data: cmRows } = await this.supabase.client
      .from('committee_members')
      .select('*, committees(*)')
      .eq('member_id', member.id);

    if (!cmRows) return [];

    const memberships = await Promise.all(cmRows.map(async (cm: any) => {
      const committee = cm.committees;
      const [paymentsRes, payoutsRes, allMembersRes] = await Promise.all([
        this.supabase.client.from('payments').select('*')
          .eq('member_id', member.id).eq('committee_id', committee.id).order('month'),
        this.supabase.client.from('payouts').select('*')
          .eq('member_id', member.id).eq('committee_id', committee.id),
        this.supabase.client.from('committee_members')
          .select('*, members(name, email)').eq('committee_id', committee.id).order('payout_order')
      ]);
      return {
        member: { ...member, payout_order: cm.payout_order },
        committee,
        payments: paymentsRes.data || [],
        myPayout: payoutsRes.data?.[0] || null,
        allMembers: allMembersRes.data || []
      };
    }));

    this._memberships.set(memberships);
    this._loaded = true;
    return memberships;
  }

  async getPayments(): Promise<any[]> {
    const member = await this.getMemberRecord();
    if (!member) return [];
    const { data } = await this.supabase.client
      .from('payments')
      .select('*, committees(name)')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async submitPayment(payload: {
    committee_id: string;
    month: number;
    amount: number;
    payment_date: string;
    screenshot_url?: string;
    notes?: string;
  }): Promise<any> {
    const member = await this.getMemberRecord();
    if (!member) throw new Error('Member record not found');
    const { data, error } = await this.supabase.client
      .from('payments')
      .insert({
        committee_id: payload.committee_id,
        member_id: member.id,
        month: payload.month,
        amount: payload.amount,
        payment_date: payload.payment_date,
        screenshot_url: payload.screenshot_url || null,
        notes: payload.notes || null,
        status: 'under_review'   // requires updated DB constraint (see fix below)
      }).select().single();

    // If constraint error, fall back to 'pending' (old schema)
    if (error?.message?.includes('payments_status_check')) {
      const { data: fallback, error: err2 } = await this.supabase.client
        .from('payments')
        .insert({
          committee_id: payload.committee_id,
          member_id: member.id,
          month: payload.month,
          amount: payload.amount,
          payment_date: payload.payment_date,
          screenshot_url: payload.screenshot_url || null,
          notes: payload.notes || null,
          status: 'pending'
        }).select().single();
      if (err2) throw new Error(err2.message);
      return fallback;
    }

    if (error) throw new Error(error.message);
    return data;
  }

  async uploadScreenshot(file: File): Promise<string> {
    const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await this.supabase.client.storage
      .from('payment-screenshots').upload(name, file);
    if (error) throw new Error(error.message);
    const { data } = this.supabase.client.storage
      .from('payment-screenshots').getPublicUrl(name);
    return data.publicUrl;
  }

  async getNotifications(): Promise<any[]> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return [];
    const { data } = await this.supabase.client
      .from('notifications').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
    return data || [];
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    await this.supabase.client.from('notifications')
      .update({ read: true }).eq('user_id', userId);
  }

  async updateProfile(updates: { name?: string; phone?: string; address?: string; cnic?: string }): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');
    const { error } = await this.supabase.client
      .from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);
    // Also update members table
    const member = await this.getMemberRecord();
    if (member) {
      await this.supabase.client.from('members')
        .update({ name: updates.name, phone: updates.phone, address: updates.address, cnic: updates.cnic })
        .eq('id', member.id);
    }
  }

  invalidateCache() { this._loaded = false; this._memberRecord.set(null); this._memberships.set([]); }
}
