import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-sa-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <div class="sa-page-header">
    <h2>Verification Requests</h2>
    <p>Review and approve sub-admin verification requests</p>
  </div>

  <!-- Stats -->
  <div class="vr-stats">
    <div class="vr-stat yellow"><div class="vrs-num">{{ pendingCount() }}</div><div class="vrs-lbl">Pending</div></div>
    <div class="vr-stat green"><div class="vrs-num">{{ approvedCount() }}</div><div class="vrs-lbl">Approved</div></div>
    <div class="vr-stat red"><div class="vrs-num">{{ rejectedCount() }}</div><div class="vrs-lbl">Rejected</div></div>
    <div class="vr-stat blue"><div class="vrs-num">{{ requests().length }}</div><div class="vrs-lbl">Total</div></div>
  </div>

  <!-- Filter -->
  <div class="filter-row">
    <button *ngFor="let f of filters" class="sa-fbtn" [class.active]="activeFilter()===f" (click)="activeFilter.set(f)">{{ f }}</button>
  </div>

  <div *ngIf="loading()" class="sa-loading"><div class="sa-spinner"></div></div>

  <!-- Requests List -->
  <div class="requests-list" *ngIf="!loading()">
    <div *ngFor="let r of filteredRequests()" class="request-card">
      <div class="rc-header">
        <div class="rc-user">
          <div class="rc-avatar" [style.background]="getColor(r.full_name||'')">{{ getInitials(r.full_name||'R') }}</div>
          <div>
            <div class="rc-name">{{ r.full_name }}</div>
            <div class="rc-email">{{ r.user_email }}</div>
          </div>
        </div>
        <div class="rc-meta">
          <span class="rc-date">{{ r.created_at | date:'MMM d, y' }}</span>
          <span class="rc-status" [class.pending]="r.status==='pending'" [class.approved]="r.status==='approved'" [class.rejected]="r.status==='rejected'">
            {{ r.status | titlecase }}
          </span>
        </div>
      </div>

      <div class="rc-details">
        <div class="rc-detail"><span>CNIC</span><strong>{{ r.cnic_number }}</strong></div>
        <div class="rc-detail"><span>Phone</span><strong>{{ r.phone }}</strong></div>
        <div class="rc-detail"><span>Address</span><strong>{{ r.address }}</strong></div>
        <div class="rc-detail" *ngIf="r.notes"><span>Notes</span><strong>{{ r.notes }}</strong></div>
      </div>

      <!-- Documents -->
      <div class="rc-docs">
        <a *ngIf="r.cnic_front_url" [href]="r.cnic_front_url" target="_blank" class="doc-link">
          <span class="material-icons">credit_card</span> CNIC Front
        </a>
        <a *ngIf="r.cnic_back_url" [href]="r.cnic_back_url" target="_blank" class="doc-link">
          <span class="material-icons">credit_card</span> CNIC Back
        </a>
        <a *ngIf="r.selfie_url" [href]="r.selfie_url" target="_blank" class="doc-link">
          <span class="material-icons">face</span> Selfie
        </a>
      </div>

      <!-- Rejection reason input -->
      <div class="rc-reject-input" *ngIf="rejectingId()===r.id">
        <input type="text" class="sa-input" [(ngModel)]="rejectionReason"
               placeholder="Enter rejection reason (required)...">
        <div class="rc-reject-btns">
          <button class="sa-act danger" (click)="confirmReject(r)">Confirm Reject</button>
          <button class="sa-act warn" (click)="rejectingId.set(null)">Cancel</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="rc-actions" *ngIf="r.status==='pending'">
        <button class="rc-btn approve" (click)="approve(r)" [disabled]="processingId()===r.id">
          <span class="material-icons">verified</span>
          {{ processingId()===r.id ? 'Processing...' : 'Approve' }}
        </button>
        <button class="rc-btn reject" (click)="startReject(r)">
          <span class="material-icons">cancel</span> Reject
        </button>
      </div>

      <!-- Rejection reason display -->
      <div class="rc-rejection-note" *ngIf="r.status==='rejected' && r.rejection_reason">
        <span class="material-icons">info</span>
        <span>Rejection reason: {{ r.rejection_reason }}</span>
      </div>
    </div>

    <div *ngIf="filteredRequests().length===0" class="sa-empty">
      No {{ activeFilter() === 'All' ? '' : activeFilter().toLowerCase() }} requests found
    </div>
  </div>
</div>
  `,
  styles: [`
    .sa-page { color: white; }
    .sa-page-header { margin-bottom: 24px; h2 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 4px; } p { font-size: 14px; color: rgba(255,255,255,0.45); } }
    .vr-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
    .vr-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; }
    .vr-stat.yellow { border-left: 3px solid #f59e0b; }
    .vr-stat.green { border-left: 3px solid #10b981; }
    .vr-stat.red { border-left: 3px solid #ef4444; }
    .vr-stat.blue { border-left: 3px solid #2563EB; }
    .vrs-num { font-size: 26px; font-weight: 800; color: white; }
    .vrs-lbl { font-size: 13px; color: rgba(255,255,255,0.45); }
    .filter-row { display: flex; gap: 6px; margin-bottom: 20px; }
    .sa-fbtn { padding: 7px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); font-size: 13px; cursor: pointer; font-family: inherit; &.active { background: rgba(37,99,235,0.2); border-color: rgba(37,99,235,0.4); color: #60A5FA; } }
    .sa-loading { display: flex; justify-content: center; padding: 60px; }
    .sa-spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .requests-list { display: flex; flex-direction: column; gap: 14px; }
    .request-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; transition: border-color 0.2s; &:hover { border-color: rgba(255,255,255,0.15); } }
    .rc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .rc-user { display: flex; align-items: center; gap: 12px; }
    .rc-avatar { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; flex-shrink: 0; }
    .rc-name { font-size: 15px; font-weight: 700; color: white; }
    .rc-email { font-size: 12px; color: rgba(255,255,255,0.4); }
    .rc-meta { display: flex; align-items: center; gap: 10px; }
    .rc-date { font-size: 12px; color: rgba(255,255,255,0.35); }
    .rc-status { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; &.pending { background: rgba(245,158,11,0.12); color: #fbbf24; } &.approved { background: rgba(16,185,129,0.12); color: #4ade80; } &.rejected { background: rgba(239,68,68,0.12); color: #f87171; } }
    .rc-details { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 14px; }
    .rc-detail { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px 12px; span { display: block; font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; } strong { font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 600; }  }
    .rc-docs { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .doc-link { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.25); border-radius: 8px; color: #60A5FA; font-size: 12px; font-weight: 600; text-decoration: none; transition: all 0.15s; .material-icons { font-size: 15px; } &:hover { background: rgba(37,99,235,0.2); } }
    .rc-reject-input { margin-bottom: 12px; }
    .sa-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 14px; color: white; font-family: inherit; font-size: 14px; outline: none; margin-bottom: 8px; &:focus { border-color: rgba(37,99,235,0.5); } &::placeholder { color: rgba(255,255,255,0.25); } }
    .rc-reject-btns { display: flex; gap: 8px; }
    .rc-actions { display: flex; gap: 10px; }
    .rc-btn { display: flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 8px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; .material-icons { font-size: 16px; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .rc-btn.approve { background: rgba(16,185,129,0.15); color: #4ade80; border: 1px solid rgba(16,185,129,0.3); &:hover:not(:disabled) { background: rgba(16,185,129,0.25); } }
    .rc-btn.reject { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.25); &:hover { background: rgba(239,68,68,0.2); } }
    .sa-act { padding: 7px 14px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; &.danger { background: rgba(239,68,68,0.15); color: #f87171; } &.warn { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); } }
    .rc-rejection-note { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(239,68,68,0.7); margin-top: 8px; .material-icons { font-size: 14px; } }
    .sa-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); font-size: 14px; }
    @media (max-width: 768px) { .vr-stats { grid-template-columns: repeat(2,1fr); } .rc-details { grid-template-columns: 1fr 1fr; } }
  `]
})
export class SaVerificationComponent implements OnInit {
  loading = signal(true);
  requests = signal<any[]>([]);
  activeFilter = signal('All');
  processingId = signal<string | null>(null);
  rejectingId = signal<string | null>(null);
  rejectionReason = '';
  filters = ['All', 'Pending', 'Approved', 'Rejected'];
  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];

  constructor(private supabase: SupabaseService, private toast: ToastService) {}

  async ngOnInit() { await this.loadRequests(); }

  private async loadRequests() {
    this.loading.set(true);
    try {
      // Fetch all requests — super admin reads all
      const { data, error } = await this.supabase.client
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) { console.error('VR load error:', error.message); }

      const requests = data || [];

      // Fetch user emails/names separately
      const userIds = [...new Set(requests.map((r: any) => r.user_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await this.supabase.client
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      this.requests.set(requests.map((r: any) => ({
        ...r,
        user_email: profileMap[r.user_id]?.email || '—',
        user_profile_name: profileMap[r.user_id]?.name || r.full_name
      })));
    } finally { this.loading.set(false); }
  }

  filteredRequests() {
    const f = this.activeFilter();
    if (f === 'All') return this.requests();
    return this.requests().filter(r => r.status === f.toLowerCase());
  }

  pendingCount() { return this.requests().filter(r => r.status === 'pending').length; }
  approvedCount() { return this.requests().filter(r => r.status === 'approved').length; }
  rejectedCount() { return this.requests().filter(r => r.status === 'rejected').length; }

  async approve(r: any) {
    this.processingId.set(r.id);
    try {
      // Update request
      await this.supabase.client.from('verification_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', r.id);
      // Update profile
      await this.supabase.client.from('profiles')
        .update({ verified: true, verification_status: 'verified' }).eq('id', r.user_id);
      // Notify user
      await this.supabase.client.from('notifications').insert({
        user_id: r.user_id, title: 'Account Verified! ✅',
        message: 'Congratulations! Your account has been verified. A verified badge now appears on your profile.',
        type: 'success', read: false
      });
      this.requests.update(l => l.map(x => x.id === r.id ? { ...x, status: 'approved' } : x));
      this.toast.success(`${r.full_name} verified successfully`);
    } catch (e: any) { this.toast.error('Failed: ' + e?.message); }
    finally { this.processingId.set(null); }
  }

  startReject(r: any) { this.rejectingId.set(r.id); this.rejectionReason = ''; }

  async confirmReject(r: any) {
    if (!this.rejectionReason.trim()) { this.toast.error('Please enter a rejection reason'); return; }
    try {
      await this.supabase.client.from('verification_requests')
        .update({ status: 'rejected', rejection_reason: this.rejectionReason, reviewed_at: new Date().toISOString() }).eq('id', r.id);
      await this.supabase.client.from('profiles')
        .update({ verified: false, verification_status: 'rejected' }).eq('id', r.user_id);
      await this.supabase.client.from('notifications').insert({
        user_id: r.user_id, title: 'Verification Request Rejected',
        message: `Your verification request was rejected. Reason: ${this.rejectionReason}`,
        type: 'warning', read: false
      });
      this.requests.update(l => l.map(x => x.id === r.id ? { ...x, status: 'rejected', rejection_reason: this.rejectionReason } : x));
      this.rejectingId.set(null);
      this.toast.success('Request rejected');
    } catch (e: any) { this.toast.error('Failed: ' + e?.message); }
  }

  getInitials(n: string) { return n.split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2); }
  getColor(n: string) { return this.colors[(n?.charCodeAt(0) || 0) % this.colors.length]; }
}
