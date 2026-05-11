import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { AuthService } from '../../../services/auth.service';
import { MemberDataService } from '../../../services/member-data.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-member-browse-committees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="m-browse">
      <div class="page-header">
        <div class="page-title">
          <h1>Browse Committees</h1>
          <p>Discover and request to join available committees</p>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="filter-bar">
        <div class="search-wrap">
          <span class="material-icons">search</span>
          <input type="text" placeholder="Search committees..." [(ngModel)]="searchQuery"
                 (ngModelChange)="applyFilter()" class="search-input">
        </div>
        <div class="status-tabs">
          <button class="tab-btn" [class.active]="filterStatus === 'all'" (click)="setFilter('all')">All</button>
          <button class="tab-btn" [class.active]="filterStatus === 'active'" (click)="setFilter('active')">Active</button>
          <button class="tab-btn" [class.active]="filterStatus === 'pending'" (click)="setFilter('pending')">Pending</button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-center"><div class="spinner"></div></div>

      <!-- Empty -->
      <div *ngIf="!loading() && filtered().length === 0" class="empty-card">
        <span class="material-icons">search_off</span>
        <h3>No committees found</h3>
        <p>Try adjusting your search or filter</p>
      </div>

      <!-- Grid -->
      <div class="committees-grid" *ngIf="!loading() && filtered().length > 0">
        <div *ngFor="let c of filtered()" class="committee-card">
          <!-- Status badge -->
          <div class="card-top">
            <div class="card-icon"><span class="material-icons">groups</span></div>
            <span class="badge" [ngClass]="{
              'badge-success': c.status === 'active',
              'badge-warning': c.status === 'pending',
              'badge-gray': c.status === 'completed'
            }">{{ c.status | titlecase }}</span>
          </div>

          <h3 class="card-name">{{ c.name }}</h3>
          <p class="card-desc" *ngIf="c.description">{{ c.description }}</p>

          <!-- Stats -->
          <div class="card-stats">
            <div class="cs-item">
              <span class="material-icons">payments</span>
              <div><b>PKR {{ c.monthly_amount | number }}</b><span>Monthly</span></div>
            </div>
            <div class="cs-item">
              <span class="material-icons">people</span>
              <div><b>{{ c.total_members }}</b><span>Members</span></div>
            </div>
            <div class="cs-item">
              <span class="material-icons">calendar_month</span>
              <div><b>{{ c.duration_months }}mo</b><span>Duration</span></div>
            </div>
            <div class="cs-item">
              <span class="material-icons">account_balance_wallet</span>
              <div><b>PKR {{ (c.monthly_amount * c.total_members) | number }}</b><span>Total Pool</span></div>
            </div>
          </div>

          <!-- Action -->
          <div class="card-footer">
            <!-- Already a member -->
            <div class="status-pill member" *ngIf="isMember(c.id)">
              <span class="material-icons">check_circle</span> Already a Member
            </div>

            <!-- Request pending -->
            <div class="status-pill pending" *ngIf="!isMember(c.id) && getRequest(c.id)?.status === 'pending'">
              <span class="material-icons">hourglass_empty</span> Request Pending
              <button class="cancel-btn" (click)="cancelRequest(c)" title="Cancel request">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Request approved (but not yet enrolled by admin) -->
            <div class="status-pill approved" *ngIf="!isMember(c.id) && getRequest(c.id)?.status === 'approved'">
              <span class="material-icons">thumb_up</span> Request Approved
            </div>

            <!-- Request rejected -->
            <div class="request-rejected" *ngIf="!isMember(c.id) && getRequest(c.id)?.status === 'rejected'">
              <div class="status-pill rejected">
                <span class="material-icons">cancel</span> Request Rejected
              </div>
              <button class="btn-request" (click)="openRequestModal(c)">
                <span class="material-icons">refresh</span> Request Again
              </button>
            </div>

            <!-- No request yet -->
            <button class="btn-request" *ngIf="!isMember(c.id) && !getRequest(c.id)"
                    (click)="openRequestModal(c)"
                    [disabled]="c.status === 'completed'">
              <span class="material-icons">person_add</span>
              {{ c.status === 'completed' ? 'Completed' : 'Request to Join' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Request Modal -->
      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <span class="material-icons" style="color:#1E3A5F;vertical-align:middle;margin-right:8px">person_add</span>
              Request to Join
            </h3>
            <button class="btn-icon" (click)="closeModal()">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body" *ngIf="selectedCommittee()">
            <div class="committee-preview">
              <div class="cp-icon"><span class="material-icons">groups</span></div>
              <div>
                <h4>{{ selectedCommittee()!.name }}</h4>
                <p>PKR {{ selectedCommittee()!.monthly_amount | number }}/month · {{ selectedCommittee()!.total_members }} members · {{ selectedCommittee()!.duration_months }} months</p>
              </div>
            </div>

            <div class="form-group">
              <label>Message to Admin (Optional)</label>
              <textarea class="form-control" rows="3" [(ngModel)]="requestMessage"
                        placeholder="Introduce yourself or explain why you'd like to join..."></textarea>
            </div>

            <div class="info-note">
              <span class="material-icons">info</span>
              <p>The committee admin will review your request and notify you of their decision.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="submitRequest()" [disabled]="submitting()">
              <span class="material-icons">{{ submitting() ? 'hourglass_empty' : 'send' }}</span>
              {{ submitting() ? 'Sending...' : 'Send Request' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .m-browse { animation: fadeIn 0.3s ease; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; color: #0F172A; }
    .page-header p { font-size: 14px; color: #2E5490; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    /* Filter bar */
    .filter-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .search-wrap { display: flex; align-items: center; gap: 8px; background: white; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 10px 14px; flex: 1; min-width: 220px; transition: border-color 0.2s; &:focus-within { border-color: #1E3A5F; } .material-icons { color: #94A3B8; font-size: 18px; } }
    .search-input { border: none; outline: none; font-size: 14px; color: #0F172A; background: none; width: 100%; &::placeholder { color: #94A3B8; } }
    .status-tabs { display: flex; gap: 6px; }
    .tab-btn { padding: 8px 16px; border-radius: 20px; border: 1.5px solid #E2E8F0; background: white; font-size: 13px; font-weight: 500; color: #475569; cursor: pointer; transition: all 0.15s; &:hover { border-color: #1E3A5F; color: #1E3A5F; } &.active { background: #1E3A5F; border-color: #1E3A5F; color: white; } }

    /* Empty */
    .empty-card { text-align: center; padding: 60px; background: white; border-radius: 12px; border: 1px solid #E2E8F0; .material-icons { font-size: 56px; color: #CBD5E1; display: block; margin-bottom: 16px; } h3 { font-size: 18px; color: #334155; margin-bottom: 8px; } p { font-size: 14px; color: #94A3B8; } }

    /* Grid */
    .committees-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

    /* Card */
    .committee-card { background: white; border-radius: 14px; border: 1px solid #E2E8F0; padding: 20px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.06); transition: all 0.2s; &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,23,42,0.12); border-color: #CBD5E1; } }
    .card-top { display: flex; justify-content: space-between; align-items: center; }
    .card-icon { width: 44px; height: 44px; background: #EEF3FA; border-radius: 10px; display: flex; align-items: center; justify-content: center; .material-icons { color: #1E3A5F; font-size: 22px; } }
    .card-name { font-size: 16px; font-weight: 700; color: #0F172A; margin: 0; }
    .card-desc { font-size: 13px; color: #2E5490; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    /* Stats */
    .card-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .cs-item { display: flex; align-items: center; gap: 6px; .material-icons { font-size: 16px; color: #1E3A5F; } div { display: flex; flex-direction: column; } b { font-size: 12px; font-weight: 700; color: #0F172A; } span { font-size: 10px; color: #94A3B8; } }

    /* Footer */
    .card-footer { margin-top: auto; padding-top: 14px; border-top: 1px solid #F1F5F9; }

    .btn-request { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 10px; border-radius: 8px; background: #1E3A5F; color: white; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; .material-icons { font-size: 16px; } &:hover:not(:disabled) { background: #152C4A; } &:disabled { opacity: 0.5; cursor: not-allowed; } }

    .status-pill { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; .material-icons { font-size: 16px; } }
    .status-pill.member { background: #d1fae5; color: #065f46; }
    .status-pill.pending { background: #fef3c7; color: #92400e; flex: 1; }
    .status-pill.approved { background: #d1fae5; color: #065f46; }
    .status-pill.rejected { background: #fee2e2; color: #991b1b; margin-bottom: 8px; }

    .cancel-btn { background: none; border: none; cursor: pointer; color: #92400e; display: flex; margin-left: auto; padding: 2px; .material-icons { font-size: 16px; } &:hover { color: #ef4444; } }

    .request-rejected { display: flex; flex-direction: column; gap: 8px; }

    /* Badges */
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-gray { background: #F1F5F9; color: #475569; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
    .modal { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(15,23,42,0.2); width: 100%; max-width: 480px; animation: slideUp 0.3s ease; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #E2E8F0; h3 { font-size: 17px; font-weight: 700; margin: 0; color: #0F172A; } }
    .btn-icon { background: none; border: none; cursor: pointer; color: #2E5490; display: flex; padding: 4px; border-radius: 6px; &:hover { background: #F1F5F9; } .material-icons { font-size: 20px; } }
    .modal-body { padding: 20px 24px; }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid #E2E8F0; }

    .committee-preview { display: flex; gap: 12px; align-items: center; padding: 14px; background: #EEF3FA; border-radius: 10px; border: 1px solid #E2E8F0; margin-bottom: 20px; }
    .cp-icon { width: 40px; height: 40px; background: #EEF3FA; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { color: #1E3A5F; font-size: 20px; } }
    .committee-preview h4 { font-size: 15px; font-weight: 700; margin: 0 0 4px; color: #0F172A; }
    .committee-preview p { font-size: 12px; color: #2E5490; margin: 0; }

    .form-group { margin-bottom: 16px; label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; } }
    .form-control { width: 100%; padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; color: #0F172A; background: white; outline: none; font-family: inherit; resize: vertical; transition: border-color 0.2s; &:focus { border-color: #1E3A5F; box-shadow: 0 0 0 3px rgba(30,58,95,0.12); } &::placeholder { color: #94A3B8; } }

    .info-note { display: flex; gap: 10px; align-items: flex-start; background: #EEF3FA; border-radius: 8px; padding: 12px; .material-icons { color: #1E3A5F; font-size: 18px; flex-shrink: 0; } p { font-size: 13px; color: #334155; margin: 0; line-height: 1.5; } }

    .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; background: #1E3A5F; color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; &:hover:not(:disabled) { background: #152C4A; } &:disabled { opacity: 0.6; cursor: not-allowed; } .material-icons { font-size: 16px; } }
    .btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; background: #F1F5F9; color: #334155; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; &:hover { background: #E2E8F0; } }

    @media (max-width: 1024px) { .committees-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .committees-grid { grid-template-columns: 1fr; } .filter-bar { flex-direction: column; align-items: stretch; } }
  `]
})
export class MemberBrowseCommitteesComponent implements OnInit {
  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);
  selectedCommittee = signal<any>(null);

  allCommittees: any[] = [];
  filtered = signal<any[]>([]);
  myRequests = signal<any[]>([]);
  myMembershipIds = signal<Set<string>>(new Set());

  searchQuery = '';
  filterStatus = 'all';
  requestMessage = '';

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private memberData: MemberDataService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const [committees, member] = await Promise.all([
        this.loadAllCommittees(),
        this.memberData.getMemberRecord()
      ]);

      if (member) {
        await Promise.all([
          this.loadMyRequests(member.id),
          this.loadMyMemberships(member.id)
        ]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAllCommittees() {
    // Use two separate queries and merge to avoid RLS OR-condition duplicates
    const userId = this.auth.currentUser()?.id;
    const userEmail = this.auth.currentUser()?.email;

    // Query 1: All active/pending committees (visible to everyone via RLS)
    const { data: allData } = await this.supabase.client
      .from('committees')
      .select('id, name, description, monthly_amount, total_members, duration_months, status, created_by, created_at')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    // Deduplicate strictly by id — handles any RLS duplicate rows
    const seen = new Set<string>();
    const unique = (allData || []).filter((c: any) => {
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    this.allCommittees = unique;
    this.applyFilter();
  }

  private async loadMyRequests(memberId: string) {
    const { data } = await this.supabase.client
      .from('join_requests')
      .select('*')
      .eq('member_id', memberId);
    this.myRequests.set(data || []);
  }

  private async loadMyMemberships(memberId: string) {
    const { data } = await this.supabase.client
      .from('committee_members')
      .select('committee_id, committees(id)')
      .eq('member_id', memberId);

    // Only include memberships where the committee still exists
    const validIds = (data || [])
      .filter((r: any) => r.committees !== null)
      .map((r: any) => r.committee_id);

    this.myMembershipIds.set(new Set(validIds));
  }

  applyFilter() {
    let result = this.allCommittees;
    if (this.filterStatus !== 'all') {
      result = result.filter(c => c.status === this.filterStatus);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
    }
    this.filtered.set(result);
  }

  setFilter(status: string) {
    this.filterStatus = status;
    this.applyFilter();
  }

  isMember(committeeId: string): boolean {
    return this.myMembershipIds().has(committeeId);
  }

  getRequest(committeeId: string): any {
    return this.myRequests().find(r => r.committee_id === committeeId) || null;
  }

  openRequestModal(committee: any) {
    this.selectedCommittee.set(committee);
    this.requestMessage = '';
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedCommittee.set(null);
    this.requestMessage = '';
  }

  async submitRequest() {
    const committee = this.selectedCommittee();
    if (!committee) return;

    const member = await this.memberData.getMemberRecord();
    if (!member) { this.toast.error('Member record not found'); return; }

    this.submitting.set(true);
    try {
      // Insert join request
      const { data: req, error } = await this.supabase.client
        .from('join_requests')
        .upsert({
          committee_id: committee.id,
          member_id: member.id,
          status: 'pending',
          message: this.requestMessage || null
        }, { onConflict: 'committee_id,member_id' })
        .select().single();

      if (error) throw new Error(error.message);

      // Send notification to admin (committee creator)
      await this.supabase.client.from('notifications').insert({
        user_id: committee.created_by,
        title: 'New Join Request',
        message: `${member.name} has requested to join "${committee.name}"`,
        type: 'info',
        read: false
      });

      // Update local state
      this.myRequests.update(list => {
        const existing = list.findIndex(r => r.committee_id === committee.id);
        if (existing >= 0) {
          const updated = [...list];
          updated[existing] = req;
          return updated;
        }
        return [...list, req];
      });

      this.toast.success(`Request sent to join "${committee.name}"`);
      this.closeModal();
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.submitting.set(false);
    }
  }

  async cancelRequest(committee: any) {
    const member = await this.memberData.getMemberRecord();
    if (!member) return;

    try {
      await this.supabase.client
        .from('join_requests')
        .delete()
        .eq('committee_id', committee.id)
        .eq('member_id', member.id);

      this.myRequests.update(list => list.filter(r => r.committee_id !== committee.id));
      this.toast.success('Request cancelled');
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    }
  }
}
