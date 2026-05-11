import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-join-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="jr-page">
      <div class="page-header">
        <div class="page-title">
          <h1>Join Requests</h1>
          <p>Review and manage member requests to join your committees</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-pill pending-pill">
          <span class="material-icons">hourglass_empty</span>
          <span><b>{{ pendingCount() }}</b> Pending</span>
        </div>
        <div class="stat-pill approved-pill">
          <span class="material-icons">check_circle</span>
          <span><b>{{ approvedCount() }}</b> Approved</span>
        </div>
        <div class="stat-pill rejected-pill">
          <span class="material-icons">cancel</span>
          <span><b>{{ rejectedCount() }}</b> Rejected</span>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button class="tab" [class.active]="activeTab() === 'pending'" (click)="activeTab.set('pending')">
          Pending
          <span class="tab-badge" *ngIf="pendingCount() > 0">{{ pendingCount() }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'approved'" (click)="activeTab.set('approved')">Approved</button>
        <button class="tab" [class.active]="activeTab() === 'rejected'" (click)="activeTab.set('rejected')">Rejected</button>
        <button class="tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">All</button>
      </div>

      <div *ngIf="loading()" class="loading-center"><div class="spinner"></div></div>

      <!-- Empty -->
      <div *ngIf="!loading() && filteredRequests().length === 0" class="empty-card">
        <span class="material-icons">inbox</span>
        <h3>No {{ activeTab() === 'all' ? '' : activeTab() }} requests</h3>
        <p>{{ activeTab() === 'pending' ? 'No pending requests at the moment' : 'Nothing to show here' }}</p>
      </div>

      <!-- Requests list -->
      <div class="requests-list" *ngIf="!loading() && filteredRequests().length > 0">
        <div *ngFor="let req of filteredRequests()" class="request-card">
          <!-- Member info -->
          <div class="req-member">
            <div class="member-avatar" [style.background]="getAvatarColor(req.member?.name || '')">
              {{ getInitials(req.member?.name || '') }}
            </div>
            <div class="member-info">
              <span class="member-name">{{ req.member?.name || 'Unknown' }}</span>
              <span class="member-email">{{ req.member?.email }}</span>
              <span class="member-phone" *ngIf="req.member?.phone">
                <span class="material-icons">phone</span> {{ req.member?.phone }}
              </span>
            </div>
          </div>

          <!-- Committee info -->
          <div class="req-committee">
            <div class="committee-tag">
              <span class="material-icons">groups</span>
              {{ req.committee?.name }}
            </div>
            <div class="committee-meta">
              PKR {{ req.committee?.monthly_amount | number }}/mo · {{ req.committee?.total_members }} members
            </div>
          </div>

          <!-- Message -->
          <div class="req-message" *ngIf="req.message">
            <span class="material-icons">chat_bubble_outline</span>
            <p>{{ req.message }}</p>
          </div>

          <!-- Date & Status -->
          <div class="req-meta">
            <span class="req-date">
              <span class="material-icons">schedule</span>
              {{ req.created_at | date:'MMM d, yyyy h:mm a' }}
            </span>
            <span class="badge" [ngClass]="{
              'badge-warning': req.status === 'pending',
              'badge-success': req.status === 'approved',
              'badge-danger': req.status === 'rejected'
            }">{{ req.status | titlecase }}</span>
          </div>

          <!-- Actions -->
          <div class="req-actions" *ngIf="req.status === 'pending'">
            <button class="btn-approve" (click)="approveRequest(req)"
                    [disabled]="processingId() === req.id">
              <span class="material-icons">check</span>
              {{ processingId() === req.id ? 'Processing...' : 'Approve & Enroll' }}
            </button>
            <button class="btn-reject" (click)="rejectRequest(req)"
                    [disabled]="processingId() === req.id">
              <span class="material-icons">close</span> Reject
            </button>
          </div>

          <div class="req-reviewed" *ngIf="req.status !== 'pending'">
            <span class="material-icons">{{ req.status === 'approved' ? 'check_circle' : 'cancel' }}</span>
            Reviewed {{ req.reviewed_at | date:'MMM d, yyyy' }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .jr-page { animation: fadeIn 0.3s ease; }
    .page-header { margin-bottom: 24px; h1 { font-size: 24px; font-weight: 700; color: var(--gray-900); } p { font-size: 14px; color: var(--gray-500); } }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-pill { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; .material-icons { font-size: 18px; } b { font-weight: 700; } }
    .pending-pill { background: #fef3c7; color: #92400e; }
    .approved-pill { background: #d1fae5; color: #065f46; }
    .rejected-pill { background: #fee2e2; color: #991b1b; }

    .filter-tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--gray-100); border-radius: 10px; padding: 4px; width: fit-content; }
    .tab { padding: 8px 18px; border-radius: 8px; border: none; background: none; font-size: 13px; font-weight: 500; color: var(--gray-600); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; &.active { background: white; color: var(--primary); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } }
    .tab-badge { background: #1E3A5F; color: white; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 10px; }

    .empty-card { text-align: center; padding: 60px; background: white; border-radius: 12px; border: 1px solid var(--gray-200); .material-icons { font-size: 56px; color: var(--gray-300); display: block; margin-bottom: 16px; } h3 { font-size: 18px; color: var(--gray-700); margin-bottom: 8px; } p { font-size: 14px; color: var(--gray-400); } }

    .requests-list { display: flex; flex-direction: column; gap: 16px; }

    .request-card {
      background: white; border-radius: 12px; border: 1px solid var(--gray-200);
      padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      align-items: start;
    }

    .req-member { display: flex; gap: 12px; align-items: flex-start; }
    .member-avatar { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: white; flex-shrink: 0; }
    .member-info { display: flex; flex-direction: column; gap: 2px; }
    .member-name { font-size: 15px; font-weight: 700; color: var(--gray-900); }
    .member-email { font-size: 12px; color: var(--gray-500); }
    .member-phone { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gray-500); .material-icons { font-size: 13px; } }

    .req-committee { }
    .committee-tag { display: inline-flex; align-items: center; gap: 6px; background: #EEF3FA; color: #1E3A5F; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 6px; .material-icons { font-size: 16px; } }
    .committee-meta { font-size: 12px; color: var(--gray-500); }

    .req-message { grid-column: 1 / -1; display: flex; gap: 8px; align-items: flex-start; background: var(--gray-50); border-radius: 8px; padding: 10px 14px; .material-icons { font-size: 16px; color: var(--gray-400); flex-shrink: 0; margin-top: 1px; } p { font-size: 13px; color: var(--gray-600); margin: 0; line-height: 1.5; } }

    .req-meta { display: flex; align-items: center; justify-content: space-between; }
    .req-date { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gray-400); .material-icons { font-size: 14px; } }

    .req-actions { grid-column: 1 / -1; display: flex; gap: 10px; padding-top: 12px; border-top: 1px solid var(--gray-100); }
    .btn-approve { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 8px; background: #10b981; color: white; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; .material-icons { font-size: 16px; } &:hover:not(:disabled) { background: #059669; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-reject { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 8px; background: #fee2e2; color: #991b1b; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; .material-icons { font-size: 16px; } &:hover:not(:disabled) { background: #fecaca; } &:disabled { opacity: 0.6; cursor: not-allowed; } }

    .req-reviewed { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gray-400); padding-top: 12px; border-top: 1px solid var(--gray-100); .material-icons { font-size: 16px; } }

    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-danger { background: #fee2e2; color: #991b1b; }

    @media (max-width: 768px) { .request-card { grid-template-columns: 1fr; } }
  `]
})
export class JoinRequestsComponent implements OnInit {
  loading = signal(true);
  requests = signal<any[]>([]);
  activeTab = signal<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  processingId = signal<string | null>(null);

  private avatarColors = ['#1E3A5F','#2E5490','#1E3A5F','#3B82F6','#152C4A','#334155'];

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private toast: ToastService,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await this.loadRequests();
  }

  async loadRequests() {
    this.loading.set(true);
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return;

      // Get all join requests for committees owned by this admin
      const { data, error } = await this.supabase.client
        .from('join_requests')
        .select(`
          *,
          member:members(id, name, email, phone),
          committee:committees(id, name, monthly_amount, total_members, duration_months, created_by)
        `)
        .eq('committee.created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      this.requests.set((data || []).filter((r: any) => r.committee));
    } catch (e: any) {
      this.toast.error('Failed to load requests: ' + (e?.message || ''));
    } finally {
      this.loading.set(false);
    }
  }

  filteredRequests() {
    const tab = this.activeTab();
    if (tab === 'all') return this.requests();
    return this.requests().filter(r => r.status === tab);
  }

  pendingCount() { return this.requests().filter(r => r.status === 'pending').length; }
  approvedCount() { return this.requests().filter(r => r.status === 'approved').length; }
  rejectedCount() { return this.requests().filter(r => r.status === 'rejected').length; }

  async approveRequest(req: any) {
    this.processingId.set(req.id);
    try {
      const userId = this.auth.currentUser()?.id;

      // 1. Update request status
      await this.supabase.client
        .from('join_requests')
        .update({ status: 'approved', reviewed_by: userId, reviewed_at: new Date().toISOString() })
        .eq('id', req.id);

      // 2. Enroll member in committee (payout_order = 0, unassigned)
      const { error: enrollError } = await this.supabase.client
        .from('committee_members')
        .upsert({
          committee_id: req.committee_id,
          member_id: req.member_id,
          payout_order: 0,
          status: 'active'
        }, { onConflict: 'committee_id,member_id' });

      if (enrollError) throw new Error(enrollError.message);

      // 3. Notify the member (find their auth user_id via profile)
      const { data: profile } = await this.supabase.client
        .from('profiles')
        .select('id')
        .eq('email', req.member?.email)
        .maybeSingle();

      if (profile?.id) {
        await this.supabase.client.from('notifications').insert({
          user_id: profile.id,
          title: 'Join Request Approved! 🎉',
          message: `Your request to join "${req.committee?.name}" has been approved. You are now a member!`,
          type: 'success',
          read: false
        });
      }

      // 4. Update local state
      this.requests.update(list =>
        list.map(r => r.id === req.id ? { ...r, status: 'approved', reviewed_at: new Date().toISOString() } : r)
      );

      this.toast.success(`${req.member?.name} approved and enrolled in "${req.committee?.name}"`);
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.processingId.set(null);
    }
  }

  async rejectRequest(req: any) {
    const reason = prompt(`Reason for rejecting ${req.member?.name}'s request (optional):`);
    if (reason === null) return; // user cancelled

    this.processingId.set(req.id);
    try {
      const userId = this.auth.currentUser()?.id;

      // 1. Update request status
      await this.supabase.client
        .from('join_requests')
        .update({
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          message: reason ? `Rejection reason: ${reason}` : req.message
        })
        .eq('id', req.id);

      // 2. Notify the member
      const { data: profile } = await this.supabase.client
        .from('profiles')
        .select('id')
        .eq('email', req.member?.email)
        .maybeSingle();

      if (profile?.id) {
        await this.supabase.client.from('notifications').insert({
          user_id: profile.id,
          title: 'Join Request Update',
          message: `Your request to join "${req.committee?.name}" was not approved${reason ? ': ' + reason : '.'}`,
          type: 'warning',
          read: false
        });
      }

      // 3. Update local state
      this.requests.update(list =>
        list.map(r => r.id === req.id ? { ...r, status: 'rejected', reviewed_at: new Date().toISOString() } : r)
      );

      this.toast.warning(`Request from ${req.member?.name} rejected`);
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.processingId.set(null);
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  getAvatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }
}
