import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-title">
          <h1>My Payments</h1>
          <p>Upload payment proofs and track your payment history</p>
        </div>
        <button class="btn btn-primary" (click)="openUploadModal()">
          <span class="material-icons">upload</span> Upload Payment
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon green"><span class="material-icons">check_circle</span></div>
          <div class="stat-val">{{ approvedCount() }}</div>
          <div class="stat-lbl">Approved</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><span class="material-icons">hourglass_empty</span></div>
          <div class="stat-val">{{ pendingCount() }}</div>
          <div class="stat-lbl">Pending Review</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><span class="material-icons">cancel</span></div>
          <div class="stat-val">{{ rejectedCount() }}</div>
          <div class="stat-lbl">Rejected</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><span class="material-icons">payments</span></div>
          <div class="stat-val">PKR {{ totalPaid() | number }}</div>
          <div class="stat-lbl">Total Paid</div>
        </div>
      </div>

      <div *ngIf="loading()" class="loading-state"><div class="spinner"></div></div>

      <!-- Payments Table -->
      <div class="card" *ngIf="!loading()">
        <div class="card-header">
          <h3>Payment History</h3>
          <div class="filter-tabs">
            <button *ngFor="let f of filters" class="filter-btn"
                    [class.active]="activeFilter()===f" (click)="setFilter(f)">{{ f }}</button>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Committee</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Screenshot</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredPayments()">
                <td class="font-semibold">{{ p.committee_name }}</td>
                <td>Month {{ p.month }}</td>
                <td class="font-semibold">PKR {{ p.amount | number }}</td>
                <td class="text-sm text-muted">{{ p.payment_date | date:'MMM d, yyyy' }}</td>
                <td>
                  <a *ngIf="p.screenshot_url" [href]="p.screenshot_url" target="_blank" class="screenshot-link">
                    <span class="material-icons">image</span> View
                  </a>
                  <span *ngIf="!p.screenshot_url" class="text-muted">—</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': p.status==='approved',
                    'badge-warning': p.status==='pending'||p.status==='under_review',
                    'badge-danger': p.status==='rejected'
                  }">
                    {{ p.status === 'under_review' ? 'Under Review' : (p.status | titlecase) }}
                  </span>
                </td>
                <td class="text-sm text-muted">{{ p.notes || '—' }}</td>
              </tr>
              <tr *ngIf="filteredPayments().length===0">
                <td colspan="7" class="empty-row">No payments found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Upload Modal -->
      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><span class="material-icons">upload</span> Upload Payment Proof</h3>
            <button class="modal-close" (click)="closeModal()"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Committee *</label>
              <select class="form-control" [(ngModel)]="uploadForm.committeeId" (change)="onCommitteeChange()">
                <option value="">-- Select Committee --</option>
                <option *ngFor="let c of myJoinedCommittees()" [value]="c.committee_id">
                  {{ c.committee_name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Month Number *</label>
              <input type="number" class="form-control" [(ngModel)]="uploadForm.month" min="1" placeholder="e.g. 1">
            </div>
            <div class="form-group">
              <label>Amount (PKR) *</label>
              <input type="number" class="form-control" [(ngModel)]="uploadForm.amount" placeholder="e.g. 5000">
            </div>
            <div class="form-group">
              <label>Payment Date *</label>
              <input type="date" class="form-control" [(ngModel)]="uploadForm.date">
            </div>
            <div class="form-group">
              <label>Payment Screenshot *</label>
              <div class="upload-area" (click)="fileInput.click()" [class.has-file]="uploadForm.file">
                <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileSelect($event)">
                <span class="material-icons">{{ uploadForm.file ? 'check_circle' : 'cloud_upload' }}</span>
                <span>{{ uploadForm.file ? uploadForm.file.name : 'Click to upload screenshot' }}</span>
              </div>
            </div>
            <div class="form-group">
              <label>Notes (Optional)</label>
              <textarea class="form-control" rows="2" [(ngModel)]="uploadForm.notes" placeholder="Any additional info..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitPayment()" [disabled]="uploading()">
              <span class="material-icons">{{ uploading() ? 'hourglass_empty' : 'send' }}</span>
              {{ uploading() ? 'Uploading...' : 'Submit Payment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { animation: fadeIn 0.3s ease; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; h1 { font-size: 24px; font-weight: 700; color: var(--gray-900); } p { font-size: 14px; color: var(--gray-500); margin-top: 4px; } }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid var(--gray-200); display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 4px rgba(15,23,42,0.06); }
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; .material-icons { font-size: 22px; } &.green { background: #d1fae5; .material-icons { color: #10b981; } } &.orange { background: #fef3c7; .material-icons { color: #f59e0b; } } &.red { background: #fee2e2; .material-icons { color: #ef4444; } } &.blue { background: #dbeafe; .material-icons { color: #2563eb; } } }
    .stat-val { font-size: 24px; font-weight: 800; color: var(--gray-900); }
    .stat-lbl { font-size: 13px; color: var(--gray-500); }
    .loading-state { display: flex; justify-content: center; padding: 60px; }
    .card { background: white; border-radius: 12px; border: 1px solid var(--gray-200); box-shadow: 0 1px 4px rgba(15,23,42,0.06); overflow: hidden; }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid var(--gray-200); h3 { font-size: 16px; font-weight: 700; color: var(--gray-900); } }
    .filter-tabs { display: flex; gap: 6px; }
    .filter-btn { padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--gray-200); background: white; font-size: 12px; font-weight: 600; color: var(--gray-600); cursor: pointer; &.active { background: #1E3A5F; border-color: #1E3A5F; color: white; } }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; thead tr { background: var(--gray-50); border-bottom: 2px solid var(--gray-200); th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; } } tbody tr { border-bottom: 1px solid var(--gray-100); &:hover { background: var(--gray-50); } td { padding: 14px 16px; color: var(--gray-700); vertical-align: middle; } } }
    .font-semibold { font-weight: 600; color: var(--gray-900); }
    .text-sm { font-size: 13px; }
    .text-muted { color: var(--gray-500); }
    .screenshot-link { display: inline-flex; align-items: center; gap: 4px; color: #1E3A5F; text-decoration: none; font-size: 13px; font-weight: 500; &:hover { text-decoration: underline; } .material-icons { font-size: 16px; } }
    .badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .empty-row { text-align: center; color: var(--gray-400); padding: 40px !important; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; .material-icons { font-size: 16px; } }
    .btn-primary { background: #1E3A5F; color: white; &:hover:not(:disabled) { background: #152C4A; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-secondary { background: var(--gray-100); color: var(--gray-700); &:hover { background: var(--gray-200); } }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
    .modal { background: white; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--gray-200); h3 { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 700; .material-icons { color: #1E3A5F; } } }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--gray-500); display: flex; padding: 4px; border-radius: 6px; &:hover { background: var(--gray-100); } .material-icons { font-size: 20px; } }
    .modal-body { padding: 20px 24px; }
    .form-group { margin-bottom: 16px; label { display: block; font-size: 13px; font-weight: 600; color: var(--gray-700); margin-bottom: 6px; } }
    .form-control { width: 100%; padding: 10px 14px; border: 1.5px solid var(--gray-200); border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; &:focus { border-color: #1E3A5F; } }
    .upload-area { border: 2px dashed var(--gray-300); border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--gray-500); .material-icons { font-size: 32px; } &:hover { border-color: #1E3A5F; color: #1E3A5F; } &.has-file { border-color: #10b981; color: #10b981; background: #f0fdf4; } }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid var(--gray-200); }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class MyPaymentsComponent implements OnInit {
  loading = signal(true);
  uploading = signal(false);
  showModal = signal(false);
  payments = signal<any[]>([]);
  myJoinedCommittees = signal<any[]>([]);
  activeFilter = signal('All');
  filters = ['All', 'Approved', 'Pending', 'Rejected'];

  uploadForm = { committeeId: '', month: 1, amount: 0, date: new Date().toISOString().split('T')[0], notes: '', file: null as File | null };

  constructor(private auth: AuthService, private supabase: SupabaseService, private toast: ToastService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await Promise.all([this.loadPayments(), this.loadJoinedCommittees()]);
    this.loading.set(false);
  }

  private async loadPayments() {
    const email = this.auth.currentUser()?.email;
    const { data: memberRecs } = await this.supabase.client.from('members').select('id').eq('email', email || '');
    if (!memberRecs?.length) return;
    const ids = memberRecs.map((m: any) => m.id);
    const { data } = await this.supabase.client
      .from('payments').select('*, committees(name)')
      .in('member_id', ids).order('created_at', { ascending: false });
    this.payments.set((data || []).map((p: any) => ({ ...p, committee_name: p.committees?.name || '' })));
  }

  private async loadJoinedCommittees() {
    const email = this.auth.currentUser()?.email;
    const { data: memberRecs } = await this.supabase.client.from('members').select('id').eq('email', email || '');
    if (!memberRecs?.length) return;
    const ids = memberRecs.map((m: any) => m.id);
    const { data } = await this.supabase.client
      .from('committee_members').select('member_id, committee_id, committees(name, monthly_amount)')
      .in('member_id', ids);
    this.myJoinedCommittees.set((data || []).map((cm: any) => ({
      member_id: cm.member_id, committee_id: cm.committee_id, committee_name: cm.committees?.name || '', monthly_amount: cm.committees?.monthly_amount || 0
    })));
  }

  filteredPayments() {
    const f = this.activeFilter();
    if (f === 'All') return this.payments();
    if (f === 'Approved') return this.payments().filter(p => p.status === 'approved');
    if (f === 'Pending') return this.payments().filter(p => p.status === 'pending' || p.status === 'under_review');
    if (f === 'Rejected') return this.payments().filter(p => p.status === 'rejected');
    return this.payments();
  }

  setFilter(f: string) { this.activeFilter.set(f); }
  approvedCount() { return this.payments().filter(p => p.status === 'approved').length; }
  pendingCount() { return this.payments().filter(p => p.status === 'pending' || p.status === 'under_review').length; }
  rejectedCount() { return this.payments().filter(p => p.status === 'rejected').length; }
  totalPaid() { return this.payments().filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0); }

  openUploadModal() { this.uploadForm = { committeeId: '', month: 1, amount: 0, date: new Date().toISOString().split('T')[0], notes: '', file: null }; this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  onCommitteeChange() {
    const c = this.myJoinedCommittees().find(x => x.committee_id === this.uploadForm.committeeId);
    if (c) this.uploadForm.amount = c.monthly_amount;
  }

  onFileSelect(event: any) {
    const file = event.target.files?.[0];
    if (file) this.uploadForm.file = file;
  }

  async submitPayment() {
    if (!this.uploadForm.committeeId || !this.uploadForm.month || !this.uploadForm.amount) {
      this.toast.error('Please fill all required fields'); return;
    }
    this.uploading.set(true);
    try {
      let screenshotUrl = null;
      if (this.uploadForm.file) {
        const fileName = `${Date.now()}-${this.uploadForm.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { error: uploadErr } = await this.supabase.client.storage.from('payment-screenshots').upload(fileName, this.uploadForm.file);
        if (!uploadErr) {
          const { data: urlData } = this.supabase.client.storage.from('payment-screenshots').getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      }
      const cm = this.myJoinedCommittees().find(x => x.committee_id === this.uploadForm.committeeId);
      if (!cm) { this.toast.error('Committee not found'); return; }
      const { data, error } = await this.supabase.client.from('payments').insert({
        committee_id: this.uploadForm.committeeId, member_id: cm.member_id,
        month: this.uploadForm.month, amount: this.uploadForm.amount,
        payment_date: this.uploadForm.date, screenshot_url: screenshotUrl,
        notes: this.uploadForm.notes || null, status: 'under_review'
      }).select('*, committees(name)').single();
      if (error) throw new Error(error.message);
      this.payments.update(l => [{ ...data, committee_name: data.committees?.name || '' }, ...l]);
      this.toast.success('Payment submitted for review!');
      this.closeModal();
    } catch (e: any) { this.toast.error('Failed: ' + e?.message); }
    finally { this.uploading.set(false); }
  }
}
