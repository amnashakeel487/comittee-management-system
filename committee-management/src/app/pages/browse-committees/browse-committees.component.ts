import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-browse-committees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-title">
          <h1>Browse & Join Committees</h1>
          <p>Discover public committees and request to join</p>
        </div>
      </div>

      <div class="search-bar">
        <div class="search-wrap">
          <span class="material-icons">search</span>
          <input type="text" placeholder="Search committees..." [(ngModel)]="searchQuery"
                 (ngModelChange)="applyFilter()" class="search-input">
        </div>
        <div class="filter-tabs">
          <button *ngFor="let f of filters" class="filter-btn"
                  [class.active]="activeFilter()===f" (click)="setFilter(f)">{{ f }}</button>
        </div>
      </div>

      <div *ngIf="loading()" class="loading-state"><div class="spinner"></div></div>

      <div class="committees-grid" *ngIf="!loading()">
        <div *ngFor="let c of filtered()" class="committee-card">
          <div class="cc-top">
            <div class="cc-icon"><span class="material-icons">groups</span></div>
            <span class="badge" [ngClass]="{'badge-success': c.status==='active', 'badge-warning': c.status==='pending'}">
              {{ c.status | titlecase }}
            </span>
          </div>
          <h3 class="cc-name">{{ c.name }}</h3>
          <p class="cc-desc" *ngIf="c.description">{{ c.description }}</p>

          <div class="cc-admin" (click)="viewAdmin(c)">
            <div class="admin-avatar" [style.background]="getColor(c.profiles?.name||'')">
              {{ getInitials(c.profiles?.name||'A') }}
            </div>
            <div>
              <span class="admin-name">{{ c.profiles?.name || 'Admin' }}</span>
              <span class="admin-label">Focal Person</span>
            </div>
            <span class="verified-badge" *ngIf="c.profiles?.verified">
              <span class="material-icons">verified</span>
            </span>
          </div>

          <div class="cc-stats">
            <div class="cc-stat"><span class="material-icons">payments</span> PKR {{ c.monthly_amount | number }}/mo</div>
            <div class="cc-stat"><span class="material-icons">people</span> {{ c.total_members }} members</div>
            <div class="cc-stat"><span class="material-icons">schedule</span> {{ c.duration_months }} months</div>
            <div class="cc-stat"><span class="material-icons">account_balance_wallet</span> PKR {{ (c.monthly_amount * c.total_members) | number }} pool</div>
          </div>

          <div class="cc-action">
            <div class="status-pill member" *ngIf="isMember(c.id)">
              <span class="material-icons">check_circle</span> Already a Member
            </div>
            <div class="status-pill pending" *ngIf="!isMember(c.id) && getRequest(c.id)?.status === 'pending'">
              <span class="material-icons">hourglass_empty</span> Request Pending
              <button class="cancel-btn" (click)="cancelRequest(c)"><span class="material-icons">close</span></button>
            </div>
            <div class="status-pill approved" *ngIf="!isMember(c.id) && getRequest(c.id)?.status === 'approved'">
              <span class="material-icons">thumb_up</span> Request Approved
            </div>
            <button class="btn-join" *ngIf="!isMember(c.id) && !getRequest(c.id)"
                    (click)="openRequestModal(c)" [disabled]="c.status==='completed'">
              <span class="material-icons">person_add</span>
              {{ c.status === 'completed' ? 'Completed' : 'Request to Join' }}
            </button>
          </div>
        </div>

        <div *ngIf="filtered().length===0" class="empty-state" style="grid-column:1/-1">
          <span class="material-icons empty-icon">search_off</span>
          <h3>No committees found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      </div>

      <!-- Request Modal -->
      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><span class="material-icons">person_add</span> Request to Join</h3>
            <button class="modal-close" (click)="closeModal()"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body" *ngIf="selectedCommittee()">
            <div class="committee-preview">
              <strong>{{ selectedCommittee()!.name }}</strong>
              <span>PKR {{ selectedCommittee()!.monthly_amount | number }}/month · {{ selectedCommittee()!.total_members }} members</span>
            </div>
            <div class="form-group">
              <label>Message to Admin (Optional)</label>
              <textarea class="form-control" rows="3" [(ngModel)]="requestMessage"
                        placeholder="Introduce yourself..."></textarea>
            </div>
            <div class="disclaimer-note">
              <span class="material-icons">info</span>
              The committee admin will review your request and notify you of their decision.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitRequest()" [disabled]="submitting()">
              <span class="material-icons">{{ submitting() ? 'hourglass_empty' : 'send' }}</span>
              {{ submitting() ? 'Sending...' : 'Send Request' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { animation: fadeIn 0.3s ease; }
    .page-header { margin-bottom: 24px; h1 { font-size: 24px; font-weight: 700; color: var(--gray-900); } p { font-size: 14px; color: var(--gray-500); margin-top: 4px; } }
    .search-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .search-wrap { display: flex; align-items: center; gap: 8px; background: white; border: 1.5px solid var(--gray-200); border-radius: 10px; padding: 10px 14px; flex: 1; min-width: 220px; &:focus-within { border-color: #1E3A5F; } .material-icons { color: var(--gray-400); font-size: 18px; } }
    .search-input { border: none; outline: none; font-size: 14px; color: var(--gray-900); background: none; width: 100%; &::placeholder { color: var(--gray-400); } }
    .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-btn { padding: 8px 16px; border-radius: 20px; border: 1.5px solid var(--gray-200); background: white; font-size: 13px; font-weight: 500; color: var(--gray-600); cursor: pointer; transition: all 0.15s; &:hover { border-color: #1E3A5F; color: #1E3A5F; } &.active { background: #1E3A5F; border-color: #1E3A5F; color: white; } }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .committees-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .committee-card { background: white; border-radius: 14px; border: 1px solid var(--gray-200); padding: 20px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.06); transition: all 0.2s; &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,23,42,0.1); } }
    .cc-top { display: flex; justify-content: space-between; align-items: center; }
    .cc-icon { width: 44px; height: 44px; background: #EEF3FA; border-radius: 10px; display: flex; align-items: center; justify-content: center; .material-icons { color: #1E3A5F; font-size: 22px; } }
    .cc-name { font-size: 16px; font-weight: 700; color: var(--gray-900); }
    .cc-desc { font-size: 13px; color: var(--gray-500); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .cc-admin { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #EEF3FA; border-radius: 10px; cursor: pointer; transition: all 0.15s; &:hover { background: #D0DFF2; } }
    .admin-avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0; }
    .admin-name { display: block; font-size: 13px; font-weight: 600; color: var(--gray-900); }
    .admin-label { display: block; font-size: 11px; color: var(--gray-500); }
    .verified-badge { margin-left: auto; .material-icons { font-size: 16px; color: #10b981; } }
    .cc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .cc-stat { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gray-600); .material-icons { font-size: 14px; color: #1E3A5F; } }
    .cc-action { margin-top: auto; }
    .btn-join { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 10px; border-radius: 8px; background: #1E3A5F; color: white; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; .material-icons { font-size: 16px; } &:hover:not(:disabled) { background: #152C4A; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .status-pill { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; .material-icons { font-size: 16px; } &.member { background: #d1fae5; color: #065f46; } &.pending { background: #fef3c7; color: #92400e; } &.approved { background: #d1fae5; color: #065f46; } }
    .cancel-btn { background: none; border: none; cursor: pointer; color: #92400e; margin-left: auto; display: flex; .material-icons { font-size: 16px; } }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .empty-state { text-align: center; padding: 60px; background: white; border-radius: 12px; border: 1px solid var(--gray-200); .empty-icon { font-size: 56px; color: var(--gray-300); display: block; margin-bottom: 16px; } h3 { font-size: 18px; color: var(--gray-700); margin-bottom: 8px; } p { font-size: 14px; color: var(--gray-500); } }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
    .modal { background: white; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--gray-200); h3 { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 700; .material-icons { color: #1E3A5F; } } }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--gray-500); display: flex; padding: 4px; border-radius: 6px; &:hover { background: var(--gray-100); } .material-icons { font-size: 20px; } }
    .modal-body { padding: 20px 24px; }
    .committee-preview { display: flex; flex-direction: column; gap: 4px; padding: 14px; background: #EEF3FA; border-radius: 10px; margin-bottom: 16px; strong { font-size: 15px; color: var(--gray-900); } span { font-size: 12px; color: var(--gray-500); } }
    .form-group { margin-bottom: 16px; label { display: block; font-size: 13px; font-weight: 600; color: var(--gray-700); margin-bottom: 6px; } }
    .form-control { width: 100%; padding: 10px 14px; border: 1.5px solid var(--gray-200); border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; resize: vertical; &:focus { border-color: #1E3A5F; } }
    .disclaimer-note { display: flex; gap: 8px; align-items: flex-start; background: #EEF3FA; border-radius: 8px; padding: 12px; font-size: 13px; color: var(--gray-600); .material-icons { color: #1E3A5F; font-size: 18px; flex-shrink: 0; } }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid var(--gray-200); }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; .material-icons { font-size: 16px; } }
    .btn-primary { background: #1E3A5F; color: white; &:hover:not(:disabled) { background: #152C4A; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-secondary { background: var(--gray-100); color: var(--gray-700); &:hover { background: var(--gray-200); } }
  `]
})
export class BrowseCommitteesComponent implements OnInit {
  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);
  selectedCommittee = signal<any>(null);
  allCommittees: any[] = [];
  filtered = signal<any[]>([]);
  myRequests = signal<any[]>([]);
  myMembershipIds = signal<Set<string>>(new Set());
  searchQuery = '';
  activeFilter = signal('All');
  requestMessage = '';
  filters = ['All', 'Active', 'Pending'];
  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];

  constructor(private auth: AuthService, private supabase: SupabaseService, private toast: ToastService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await Promise.all([this.loadCommittees(), this.loadMyData()]);
    this.loading.set(false);
  }

  private async loadCommittees() {
    const userId = this.auth.currentUser()?.id;
    const { data } = await this.supabase.client
      .from('committees')
      .select('*, profiles(name, email, verified)')
      .in('status', ['active', 'pending'])
      .neq('created_by', userId || '')
      .order('created_at', { ascending: false });
    this.allCommittees = data || [];
    this.applyFilter();
  }

  private async loadMyData() {
    const email = this.auth.currentUser()?.email;
    const { data: memberRecs } = await this.supabase.client.from('members').select('id').eq('email', email || '');
    if (memberRecs?.length) {
      const ids = memberRecs.map((m: any) => m.id);
      const { data: cms } = await this.supabase.client.from('committee_members').select('committee_id').in('member_id', ids);
      this.myMembershipIds.set(new Set((cms || []).map((c: any) => c.committee_id)));
      const { data: reqs } = await this.supabase.client.from('join_requests').select('*').in('member_id', ids);
      this.myRequests.set(reqs || []);
    }
  }

  applyFilter() {
    let result = this.allCommittees;
    const f = this.activeFilter();
    if (f === 'Active') result = result.filter((c: any) => c.status === 'active');
    else if (f === 'Pending') result = result.filter((c: any) => c.status === 'pending');
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter((c: any) => c.name?.toLowerCase().includes(q) || c.profiles?.name?.toLowerCase().includes(q));
    }
    this.filtered.set(result);
  }

  setFilter(f: string) { this.activeFilter.set(f); this.applyFilter(); }
  isMember(id: string) { return this.myMembershipIds().has(id); }
  getRequest(id: string) { return this.myRequests().find((r: any) => r.committee_id === id) || null; }

  openRequestModal(c: any) { this.selectedCommittee.set(c); this.requestMessage = ''; this.showModal.set(true); }
  closeModal() { this.showModal.set(false); this.selectedCommittee.set(null); }

  async submitRequest() {
    const c = this.selectedCommittee();
    if (!c) return;
    const email = this.auth.currentUser()?.email;
    const { data: memberRec } = await this.supabase.client.from('members').select('id').eq('email', email || '').maybeSingle();
    if (!memberRec) { this.toast.error('No member record found. Please contact admin.'); return; }
    this.submitting.set(true);
    try {
      const { error } = await this.supabase.client.from('join_requests').upsert({
        committee_id: c.id, member_id: memberRec.id, status: 'pending', message: this.requestMessage || null
      }, { onConflict: 'committee_id,member_id' });
      if (error) throw new Error(error.message);
      await this.supabase.client.from('notifications').insert({
        user_id: c.created_by, title: 'New Join Request',
        message: `${this.auth.currentUser()?.name} requested to join "${c.name}"`, type: 'info', read: false
      });
      this.myRequests.update(l => [...l, { committee_id: c.id, member_id: memberRec.id, status: 'pending' }]);
      this.toast.success('Request sent!');
      this.closeModal();
    } catch (e: any) { this.toast.error('Failed: ' + e?.message); }
    finally { this.submitting.set(false); }
  }

  async cancelRequest(c: any) {
    const email = this.auth.currentUser()?.email;
    const { data: memberRec } = await this.supabase.client.from('members').select('id').eq('email', email || '').maybeSingle();
    if (!memberRec) return;
    await this.supabase.client.from('join_requests').delete().eq('committee_id', c.id).eq('member_id', memberRec.id);
    this.myRequests.update(l => l.filter((r: any) => r.committee_id !== c.id));
    this.toast.success('Request cancelled');
  }

  viewAdmin(c: any) { /* Could open a profile modal */ }
  getInitials(n: string) { return n.split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2); }
  getColor(n: string) { return this.colors[(n.charCodeAt(0) || 0) % this.colors.length]; }
}
