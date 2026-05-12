import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-joined-committees',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-title">
          <h1>Joined Committees</h1>
          <p>Committees you are participating in as a member</p>
        </div>
        <a routerLink="/browse" class="btn btn-primary">
          <span class="material-icons">explore</span> Browse & Join More
        </a>
      </div>

      <div *ngIf="loading()" class="loading-state"><div class="spinner"></div></div>

      <div *ngIf="!loading() && memberships().length === 0" class="empty-state">
        <span class="material-icons empty-icon">how_to_reg</span>
        <h3>No Joined Committees</h3>
        <p>You haven't joined any committees yet. Browse public committees to request to join.</p>
        <a routerLink="/browse" class="btn btn-primary" style="margin-top:16px">
          <span class="material-icons">explore</span> Browse Committees
        </a>
      </div>

      <div class="committees-grid" *ngIf="!loading() && memberships().length > 0">
        <div *ngFor="let m of memberships()" class="committee-card">
          <div class="card-header-row">
            <div class="card-icon"><span class="material-icons">groups</span></div>
            <div class="card-info">
              <h3>{{ m.committee?.name }}</h3>
              <p>Managed by {{ m.committee?.profiles?.name || 'Admin' }}</p>
            </div>
            <span class="badge" [ngClass]="{
              'badge-success': m.committee?.status === 'active',
              'badge-warning': m.committee?.status === 'pending',
              'badge-gray': m.committee?.status === 'completed'
            }">{{ m.committee?.status | titlecase }}</span>
          </div>

          <div class="stats-grid">
            <div class="stat-cell">
              <span class="stat-label">Monthly</span>
              <span class="stat-val">PKR {{ m.committee?.monthly_amount | number }}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-label">My Turn</span>
              <span class="stat-val">#{{ m.payout_order || 'TBD' }}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-label">Duration</span>
              <span class="stat-val">{{ m.committee?.duration_months }} months</span>
            </div>
            <div class="stat-cell">
              <span class="stat-label">Total Pool</span>
              <span class="stat-val primary">PKR {{ ((m.committee?.monthly_amount || 0) * (m.committee?.total_members || 0)) | number }}</span>
            </div>
          </div>

          <div class="progress-row" *ngIf="m.committee?.status === 'active'">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="getProgress(m.committee)"></div>
            </div>
            <span class="progress-label">Month {{ m.committee?.current_month || 0 }}/{{ m.committee?.duration_months }}</span>
          </div>

          <div class="my-payout-row" *ngIf="m.myPayout">
            <span class="material-icons" style="color:#10b981;font-size:16px">account_balance_wallet</span>
            <span>My Payout: <strong>PKR {{ m.myPayout.total_amount | number }}</strong></span>
            <span class="badge badge-info">{{ m.myPayout.status | titlecase }}</span>
          </div>

          <div class="payment-status-row">
            <span class="material-icons" style="font-size:16px;color:#64748B">payments</span>
            <span>Payments: <strong>{{ m.paidCount }}/{{ m.committee?.duration_months }}</strong> paid</span>
            <span class="badge" [ngClass]="m.pendingCount > 0 ? 'badge-warning' : 'badge-success'">
              {{ m.pendingCount > 0 ? m.pendingCount + ' pending' : 'All paid' }}
            </span>
          </div>

          <div class="card-actions">
            <a [routerLink]="['/joined-committees', m.committee?.id]" class="btn btn-outline btn-sm">
              <span class="material-icons">visibility</span> View Details
            </a>
            <a routerLink="/my-payments" class="btn btn-primary btn-sm">
              <span class="material-icons">upload</span> Upload Payment
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { animation: fadeIn 0.3s ease; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    .page-title h1 { font-size: 24px; font-weight: 700; color: var(--gray-900); }
    .page-title p { font-size: 14px; color: var(--gray-500); margin-top: 4px; }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .empty-state { text-align: center; padding: 60px; background: white; border-radius: 12px; border: 1px solid var(--gray-200); }
    .empty-icon { font-size: 56px; color: var(--gray-300); display: block; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; color: var(--gray-700); margin-bottom: 8px; }
    .empty-state p { font-size: 14px; color: var(--gray-500); }
    .committees-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
    .committee-card { background: white; border-radius: 14px; border: 1px solid var(--gray-200); padding: 22px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.06); transition: all 0.2s; &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,23,42,0.1); } }
    .card-header-row { display: flex; align-items: center; gap: 12px; }
    .card-icon { width: 44px; height: 44px; background: #EEF3FA; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { color: #1E3A5F; font-size: 22px; } }
    .card-info { flex: 1; h3 { font-size: 16px; font-weight: 700; color: var(--gray-900); margin-bottom: 2px; } p { font-size: 12px; color: var(--gray-500); } }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .stat-cell { background: var(--gray-50); border-radius: 8px; padding: 10px 12px; }
    .stat-label { display: block; font-size: 11px; color: var(--gray-400); font-weight: 500; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
    .stat-val { display: block; font-size: 14px; font-weight: 700; color: var(--gray-900); &.primary { color: #1E3A5F; } }
    .progress-row { display: flex; align-items: center; gap: 10px; }
    .progress-bar { flex: 1; height: 6px; background: var(--gray-200); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #1E3A5F, #2563EB); border-radius: 3px; transition: width 0.5s ease; }
    .progress-label { font-size: 11px; color: var(--gray-500); white-space: nowrap; }
    .my-payout-row, .payment-status-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-600); padding: 8px 12px; background: var(--gray-50); border-radius: 8px; }
    .card-actions { display: flex; gap: 8px; margin-top: 4px; }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-gray { background: var(--gray-100); color: var(--gray-600); }
    .badge-info { background: #EEF3FA; color: #1E3A5F; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.15s; .material-icons { font-size: 16px; } }
    .btn-primary { background: #1E3A5F; color: white; &:hover { background: #152C4A; } }
    .btn-outline { background: transparent; border: 1.5px solid #1E3A5F; color: #1E3A5F; &:hover { background: #EEF3FA; } }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
  `]
})
export class JoinedCommitteesComponent implements OnInit {
  loading = signal(true);
  memberships = signal<any[]>([]);

  constructor(
    private auth: AuthService,
    private supabase: SupabaseService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await this.loadMemberships();
  }

  private async loadMemberships() {
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return;

      const email = (this.auth.currentUser()?.email || '').trim();
      if (!email) { this.memberships.set([]); return; }

      // Look up members rows case-insensitively. The case of an email in
      // members can differ from the auth.users email (e.g. "Maida@..."
      // vs "maida@..."), and a plain .eq() would silently miss the row,
      // making the page look empty even after an approved join.
      const { data: memberRecords } = await this.supabase.client
        .from('members').select('id').ilike('email', email);

      if (!memberRecords?.length) { this.memberships.set([]); return; }
      const memberIds = memberRecords.map((m: any) => m.id);

      // Fetch committee_members WITHOUT the `committees(...)` embed. The
      // embed silently returns null whenever RLS forbids the user from
      // reading the parent committee row, and the previous filter
      // `cm.committees !== null` would then drop that row — even though
      // the membership itself is fine. We pull the committee + admin
      // profile data in separate queries and stitch them client-side.
      const { data: cms } = await this.supabase.client
        .from('committee_members')
        .select('member_id, committee_id, payout_order, status, joined_at')
        .in('member_id', memberIds)
        .order('joined_at', { ascending: false });

      if (!cms?.length) { this.memberships.set([]); return; }

      const committeeIds = [...new Set(cms.map((cm: any) => cm.committee_id).filter(Boolean))];
      const { data: committees } = await this.supabase.client
        .from('committees')
        .select('id, name, description, monthly_amount, total_members, duration_months, status, current_month, created_by')
        .in('id', committeeIds);

      const committeeMap = new Map((committees || []).map((c: any) => [c.id, c]));

      const adminIds = [...new Set((committees || []).map((c: any) => c.created_by).filter(Boolean))];
      let adminMap = new Map<string, any>();
      if (adminIds.length) {
        const { data: profiles } = await this.supabase.client
          .from('profiles').select('id, name, email').in('id', adminIds);
        adminMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      }

      // Attach committee + admin profile in the shape the template
      // expects ({ committee: { ..., profiles: { name, email } } }),
      // then drop committees we created ourselves (already shown under
      // "My Committees").
      const stitched = cms
        .map((cm: any) => {
          const committee = committeeMap.get(cm.committee_id);
          if (!committee) return null;
          return {
            ...cm,
            committee: {
              ...committee,
              profiles: adminMap.get(committee.created_by) || null
            }
          };
        })
        .filter((cm: any) => cm && cm.committee?.created_by !== userId);

      const enriched = await Promise.all(stitched.map(async (cm: any) => {
        const [paymentsRes, payoutRes] = await Promise.all([
          this.supabase.client.from('payments').select('status').eq('member_id', cm.member_id).eq('committee_id', cm.committee_id),
          this.supabase.client.from('payouts').select('*').eq('member_id', cm.member_id).eq('committee_id', cm.committee_id).maybeSingle()
        ]);
        const payments = paymentsRes.data || [];
        return {
          ...cm,
          paidCount: payments.filter((p: any) => p.status === 'approved').length,
          pendingCount: payments.filter((p: any) => p.status === 'pending' || p.status === 'under_review').length,
          myPayout: payoutRes.data || null
        };
      }));

      this.memberships.set(enriched);
    } catch (e: any) {
      this.toast.error('Failed to load: ' + e?.message);
    } finally {
      this.loading.set(false);
    }
  }

  getProgress(c: any): number {
    if (!c?.duration_months) return 0;
    return Math.round(((c.current_month || 0) / c.duration_months) * 100);
  }
}
