import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-sa-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="sa-page">
  <div class="sa-page-header">
    <h2>Platform Overview</h2>
    <p>Real-time platform statistics and health</p>
  </div>

  <div *ngIf="loading()" class="sa-loading"><div class="sa-spinner"></div></div>

  <ng-container *ngIf="!loading()">
    <!-- Stats Grid -->
    <div class="sa-stats-grid">
      <div class="sa-stat-card blue">
        <div class="sa-sc-icon"><span class="material-icons">people</span></div>
        <div class="sa-sc-val">{{ stats().totalUsers }}</div>
        <div class="sa-sc-lbl">Total Sub-Admins</div>
        <div class="sa-sc-sub">{{ stats().activeUsers }} active</div>
      </div>
      <div class="sa-stat-card green">
        <div class="sa-sc-icon"><span class="material-icons">groups</span></div>
        <div class="sa-sc-val">{{ stats().totalCommittees }}</div>
        <div class="sa-sc-lbl">Total Committees</div>
        <div class="sa-sc-sub">{{ stats().activeCommittees }} active</div>
      </div>
      <div class="sa-stat-card purple">
        <div class="sa-sc-icon"><span class="material-icons">payments</span></div>
        <div class="sa-sc-val">{{ stats().totalPayments }}</div>
        <div class="sa-sc-lbl">Total Payments</div>
        <div class="sa-sc-sub">{{ stats().pendingPayments }} pending</div>
      </div>
      <div class="sa-stat-card orange">
        <div class="sa-sc-icon"><span class="material-icons">verified_user</span></div>
        <div class="sa-sc-val">{{ stats().verifiedUsers }}</div>
        <div class="sa-sc-lbl">Verified Users</div>
        <div class="sa-sc-sub">{{ stats().totalUsers - stats().verifiedUsers }} unverified</div>
      </div>
      <div class="sa-stat-card red">
        <div class="sa-sc-icon"><span class="material-icons">report</span></div>
        <div class="sa-sc-val">{{ stats().fraudReports }}</div>
        <div class="sa-sc-lbl">Fraud Reports</div>
        <div class="sa-sc-sub">{{ stats().pendingReports }} pending</div>
      </div>
      <div class="sa-stat-card gray">
        <div class="sa-sc-icon"><span class="material-icons">block</span></div>
        <div class="sa-sc-val">{{ stats().suspendedUsers }}</div>
        <div class="sa-sc-lbl">Suspended Users</div>
        <div class="sa-sc-sub">{{ stats().bannedUsers }} banned</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="sa-quick-actions">
      <h3>Quick Actions</h3>
      <div class="sa-qa-grid">
        <a routerLink="/super-admin/dashboard/users" class="sa-qa-card">
          <span class="material-icons">manage_accounts</span>
          <span>Manage Users</span>
        </a>
        <a routerLink="/super-admin/dashboard/committees" class="sa-qa-card">
          <span class="material-icons">groups</span>
          <span>Review Committees</span>
        </a>
        <a routerLink="/super-admin/dashboard/fraud" class="sa-qa-card red">
          <span class="material-icons">report_problem</span>
          <span>Fraud Reports <span class="qa-badge" *ngIf="stats().pendingReports>0">{{ stats().pendingReports }}</span></span>
        </a>
        <a routerLink="/super-admin/dashboard/announcements" class="sa-qa-card">
          <span class="material-icons">campaign</span>
          <span>Send Announcement</span>
        </a>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="sa-two-col">
      <div class="sa-panel">
        <div class="sa-panel-header"><h3>Recent Sub-Admins</h3></div>
        <div class="sa-panel-body">
          <div *ngFor="let u of recentUsers()" class="sa-list-item">
            <div class="sa-li-av" [style.background]="getColor(u.name||'')">{{ getInitials(u.name||'U') }}</div>
            <div class="sa-li-info">
              <span class="sa-li-name">{{ u.name }}</span>
              <span class="sa-li-sub">{{ u.email }}</span>
            </div>
            <span class="sa-badge" [class.verified]="u.verified">{{ u.verified ? 'Verified' : 'Unverified' }}</span>
          </div>
          <p *ngIf="recentUsers().length===0" class="sa-empty">No users yet</p>
        </div>
      </div>
      <div class="sa-panel">
        <div class="sa-panel-header"><h3>Recent Committees</h3></div>
        <div class="sa-panel-body">
          <div *ngFor="let c of recentCommittees()" class="sa-list-item">
            <div class="sa-li-av blue"><span class="material-icons" style="font-size:16px">groups</span></div>
            <div class="sa-li-info">
              <span class="sa-li-name">{{ c.name }}</span>
              <span class="sa-li-sub">PKR {{ c.monthly_amount | number }}/mo · {{ c.total_members }} members</span>
            </div>
            <span class="sa-status-dot" [class.active]="c.status==='active'" [class.pending]="c.status==='pending'">{{ c.status | titlecase }}</span>
          </div>
          <p *ngIf="recentCommittees().length===0" class="sa-empty">No committees yet</p>
        </div>
      </div>
    </div>
  </ng-container>
</div>
  `,
  styles: [`
    .sa-page { color: white; }
    .sa-page-header { margin-bottom: 28px; h2 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 4px; } p { font-size: 14px; color: rgba(255,255,255,0.45); } }
    .sa-loading { display: flex; justify-content: center; padding: 80px; }
    .sa-spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sa-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
    .sa-stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; transition: border-color 0.2s; &:hover { border-color: rgba(255,255,255,0.15); } }
    .sa-stat-card.blue { border-left: 3px solid #2563EB; }
    .sa-stat-card.green { border-left: 3px solid #10b981; }
    .sa-stat-card.purple { border-left: 3px solid #7c3aed; }
    .sa-stat-card.orange { border-left: 3px solid #f59e0b; }
    .sa-stat-card.red { border-left: 3px solid #ef4444; }
    .sa-stat-card.gray { border-left: 3px solid #64748B; }
    .sa-sc-icon { .material-icons { font-size: 22px; color: rgba(255,255,255,0.4); } }
    .sa-sc-val { font-size: 28px; font-weight: 800; color: white; }
    .sa-sc-lbl { font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 500; }
    .sa-sc-sub { font-size: 12px; color: rgba(255,255,255,0.3); }
    .sa-quick-actions { margin-bottom: 28px; h3 { font-size: 16px; font-weight: 700; color: white; margin-bottom: 14px; } }
    .sa-qa-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .sa-qa-card { display: flex; align-items: center; gap: 10px; padding: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px; font-weight: 500; transition: all 0.15s; .material-icons { font-size: 20px; color: #2563EB; } &:hover { background: rgba(255,255,255,0.08); color: white; border-color: rgba(255,255,255,0.15); } &.red .material-icons { color: #ef4444; } }
    .qa-badge { background: #ef4444; color: white; border-radius: 10px; padding: 1px 6px; font-size: 11px; font-weight: 700; margin-left: 4px; }
    .sa-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sa-panel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
    .sa-panel-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); h3 { font-size: 15px; font-weight: 700; color: white; } }
    .sa-panel-body { padding: 8px 0; }
    .sa-list-item { display: flex; align-items: center; gap: 12px; padding: 10px 20px; transition: background 0.15s; &:hover { background: rgba(255,255,255,0.03); } }
    .sa-li-av { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0; &.blue { background: rgba(37,99,235,0.2); .material-icons { color: #60A5FA; } } }
    .sa-li-info { flex: 1; overflow: hidden; }
    .sa-li-name { display: block; font-size: 13px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sa-li-sub { display: block; font-size: 11px; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sa-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); &.verified { background: rgba(16,185,129,0.12); color: #4ade80; } }
    .sa-status-dot { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; &.active { background: rgba(16,185,129,0.12); color: #4ade80; } &.pending { background: rgba(245,158,11,0.12); color: #fbbf24; } }
    .sa-empty { text-align: center; padding: 20px; font-size: 13px; color: rgba(255,255,255,0.3); }
    @media (max-width: 1024px) { .sa-stats-grid { grid-template-columns: repeat(2, 1fr); } .sa-qa-grid { grid-template-columns: repeat(2, 1fr); } .sa-two-col { grid-template-columns: 1fr; } }
  `]
})
export class SaOverviewComponent implements OnInit {
  loading = signal(true);
  stats = signal({ totalUsers: 0, activeUsers: 0, verifiedUsers: 0, suspendedUsers: 0, bannedUsers: 0, totalCommittees: 0, activeCommittees: 0, totalPayments: 0, pendingPayments: 0, fraudReports: 0, pendingReports: 0 });
  recentUsers = signal<any[]>([]);
  recentCommittees = signal<any[]>([]);
  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    try {
      const [usersRes, committeesRes, paymentsRes, reportsRes] = await Promise.all([
        this.supabase.client.from('profiles').select('*').in('role', ['sub_admin', 'admin']).order('created_at', { ascending: false }),
        this.supabase.client.from('committees').select('*').order('created_at', { ascending: false }),
        this.supabase.client.from('payments').select('id, status', { count: 'exact' }),
        this.supabase.client.from('fraud_reports').select('id, status', { count: 'exact' })
      ]);
      const users = usersRes.data || [];
      const committees = committeesRes.data || [];
      const payments = paymentsRes.data || [];
      const reports = reportsRes.data || [];
      this.stats.set({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active' || !u.status).length,
        verifiedUsers: users.filter(u => u.verified).length,
        suspendedUsers: users.filter(u => u.status === 'suspended').length,
        bannedUsers: users.filter(u => u.status === 'banned').length,
        totalCommittees: committees.length,
        activeCommittees: committees.filter(c => c.status === 'active').length,
        totalPayments: payments.length,
        pendingPayments: payments.filter(p => p.status === 'pending' || p.status === 'under_review').length,
        fraudReports: reports.length,
        pendingReports: reports.filter(r => r.status === 'pending').length
      });
      this.recentUsers.set(users.slice(0, 5));
      this.recentCommittees.set(committees.slice(0, 5));
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  getInitials(n: string) { return n.split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2); }
  getColor(n: string) { return this.colors[(n?.charCodeAt(0) || 0) % this.colors.length]; }
}
