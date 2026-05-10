import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Payment, Committee, Member } from '../../models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payments-page">
      <div class="page-header">
        <div class="page-title">
          <h1>Payments</h1>
          <p>Track, approve and manage all committee payments</p>
        </div>
        <button class="btn btn-primary" (click)="openAddPaymentModal()">
          <span class="material-icons">add</span> Record Payment
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-4 payment-stats">
        <div class="stat-card">
          <div class="stat-icon" style="background:#d1fae5"><span class="material-icons" style="color:#10b981">check_circle</span></div>
          <div class="stat-value">{{ approvedCount() }}</div>
          <div class="stat-label">Approved</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe"><span class="material-icons" style="color:#2563eb">hourglass_empty</span></div>
          <div class="stat-value">{{ underReviewCount() }}</div>
          <div class="stat-label">Under Review</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7"><span class="material-icons" style="color:#f59e0b">pending_actions</span></div>
          <div class="stat-value">{{ pendingCount() }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fee2e2"><span class="material-icons" style="color:#ef4444">cancel</span></div>
          <div class="stat-value">{{ rejectedCount() }}</div>
          <div class="stat-label">Rejected</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="card-body" style="padding:14px 20px">
          <div class="filters-row">
            <div class="search-filter">
              <span class="material-icons">search</span>
              <input type="text" placeholder="Search by member or committee..." (input)="onSearch($event)" class="filter-input">
            </div>
            <div class="status-filters">
              <button class="filter-btn" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">All</button>
              <button class="filter-btn" [class.active]="activeFilter() === 'under_review'" (click)="setFilter('under_review')">Under Review</button>
              <button class="filter-btn" [class.active]="activeFilter() === 'pending'" (click)="setFilter('pending')">Pending</button>
              <button class="filter-btn" [class.active]="activeFilter() === 'approved'" (click)="setFilter('approved')">Approved</button>
              <button class="filter-btn" [class.active]="activeFilter() === 'rejected'" (click)="setFilter('rejected')">Rejected</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-header">
          <h3><span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">receipt_long</span>Payment Records</h3>
          <span class="badge badge-primary">{{ filteredPayments().length }} records</span>
        </div>
        <div *ngIf="loading()" class="loading-state"><div class="spinner"></div></div>
        <div class="table-container" *ngIf="!loading()">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member</th><th>Committee</th><th>Month</th>
                <th>Amount</th><th>Date</th><th>Screenshot</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let payment of filteredPayments()">
                <td>
                  <div class="member-cell">
                    <div class="avatar avatar-sm" [style.background]="getAvatarColor(payment.member_name || '')">{{ getInitials(payment.member_name || '') }}</div>
                    <span class="font-semibold">{{ payment.member_name }}</span>
                  </div>
                </td>
                <td class="text-sm text-muted">{{ payment.committee_name }}</td>
                <td><span class="month-badge">Month {{ payment.month }}</span></td>
                <td class="font-semibold text-primary">PKR {{ payment.amount | number }}</td>
                <td class="text-sm text-muted">{{ payment.payment_date ? (payment.payment_date | date:'MMM d, yyyy') : '—' }}</td>
                <td>
                  <a *ngIf="payment.screenshot_url" [href]="payment.screenshot_url" target="_blank" class="btn btn-ghost btn-sm screenshot-btn">
                    <span class="material-icons">image</span> View
                  </a>
                  <span *ngIf="!payment.screenshot_url" class="text-muted text-sm">—</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': payment.status === 'approved',
                    'badge-danger': payment.status === 'rejected',
                    'badge-warning': payment.status === 'pending',
                    'badge-info': payment.status === 'under_review'
                  }">
                    <span class="material-icons" style="font-size:11px">
                      {{ payment.status === 'approved' ? 'check_circle' : payment.status === 'rejected' ? 'cancel' : payment.status === 'under_review' ? 'hourglass_empty' : 'schedule' }}
                    </span>
                    {{ getStatusLabel(payment.status) }}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <button *ngIf="payment.status === 'under_review' || payment.status === 'pending'"
                            class="btn btn-success btn-sm" (click)="approvePayment(payment)"
                            [disabled]="processingId() === payment.id" title="Approve">
                      <span class="material-icons" style="font-size:14px">check</span>
                      {{ processingId() === payment.id ? '...' : 'Approve' }}
                    </button>
                    <button *ngIf="payment.status === 'under_review' || payment.status === 'pending'"
                            class="btn btn-danger btn-sm" (click)="rejectPayment(payment)"
                            [disabled]="processingId() === payment.id" title="Reject">
                      <span class="material-icons" style="font-size:14px">close</span>
                    </button>
                    <button *ngIf="payment.status !== 'approved' && payment.status !== 'under_review'"
                            class="btn btn-outline btn-sm" (click)="sendReminder(payment)">
                      <span class="material-icons" style="font-size:14px">notifications</span>
                    </button>
                    <span *ngIf="payment.status === 'approved'" class="approved-label">
                      <span class="material-icons" style="color:var(--success);font-size:18px">verified</span>
                      <span class="text-xs text-success">Done</span>
                    </span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredPayments().length === 0">
                <td colspan="8">
                  <div class="empty-state">
                    <span class="material-icons empty-icon">payments</span>
                    <h3>No payments found</h3>
                    <p>No payment records match your filter</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Payment Modal -->
      <div class="modal-overlay" *ngIf="showAddModal()" (click)="showAddModal.set(false)">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">add_card</span>Record Payment</h3>
            <button class="btn btn-ghost btn-icon" (click)="showAddModal.set(false)"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-grid-2">
              <div class="form-group">
                <label>Committee *</label>
                <select class="form-control" [(ngModel)]="paymentForm.committee_id" (ngModelChange)="onCommitteeChange()">
                  <option value="">Select committee</option>
                  <option *ngFor="let c of committees()" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Member *</label>
                <select class="form-control" [(ngModel)]="paymentForm.member_id">
                  <option value="">Select member</option>
                  <option *ngFor="let m of committeeMembers()" [value]="m.member?.id">{{ m.member?.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Month *</label>
                <input type="number" class="form-control" placeholder="1" [(ngModel)]="paymentForm.month" min="1">
              </div>
              <div class="form-group">
                <label>Amount (PKR) *</label>
                <input type="number" class="form-control" placeholder="5000" [(ngModel)]="paymentForm.amount">
              </div>
              <div class="form-group">
                <label>Payment Date</label>
                <input type="date" class="form-control" [(ngModel)]="paymentForm.payment_date">
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="form-control" [(ngModel)]="paymentForm.status">
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <div class="form-group full-col">
                <label>Payment Screenshot</label>
                <div class="upload-area" (click)="fileInput.click()" [class.has-file]="selectedFile">
                  <input #fileInput type="file" accept="image/*,.pdf" style="display:none" (change)="onFileSelected($event)">
                  <span class="material-icons upload-icon">{{ selectedFile ? 'check_circle' : 'cloud_upload' }}</span>
                  <span class="upload-text">{{ selectedFile ? selectedFile.name : 'Click to upload screenshot or slip' }}</span>
                  <span class="upload-hint" *ngIf="!selectedFile">PNG, JPG, PDF up to 5MB</span>
                </div>
              </div>
              <div class="form-group full-col">
                <label>Notes</label>
                <textarea class="form-control" rows="2" placeholder="Optional notes..." [(ngModel)]="paymentForm.notes"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAddModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="savePayment()" [disabled]="savingPayment()">
              <span class="material-icons">{{ savingPayment() ? 'hourglass_empty' : 'save' }}</span>
              {{ savingPayment() ? 'Saving...' : 'Save Payment' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Screenshot Viewer Modal -->
      <div class="modal-overlay screenshot-overlay" *ngIf="viewingScreenshot()" (click)="viewingScreenshot.set(null)">
        <div class="screenshot-modal" (click)="$event.stopPropagation()">
          <button class="btn btn-ghost close-screenshot" (click)="viewingScreenshot.set(null)">
            <span class="material-icons">close</span>
          </button>
          <img [src]="viewingScreenshot()" alt="Payment Screenshot" class="screenshot-img">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payments-page { animation: fadeIn 0.3s ease; }
    .payment-stats { margin-bottom: 24px; }
    .filters-card { margin-bottom: 24px; }
    .filters-row { display:flex;align-items:center;gap:16px;flex-wrap:wrap; }
    .search-filter { display:flex;align-items:center;gap:8px;background:var(--gray-100);border-radius:8px;padding:8px 14px;flex:1;min-width:200px; .material-icons{color:var(--gray-400);font-size:18px;} }
    .filter-input { border:none;background:none;outline:none;font-size:14px;color:var(--gray-700);width:100%; }
    .status-filters { display:flex;gap:6px;flex-wrap:wrap; }
    .filter-btn { padding:7px 14px;border-radius:20px;border:1.5px solid var(--gray-300);background:white;font-size:13px;font-weight:500;color:var(--gray-600);cursor:pointer;transition:all 0.15s; &:hover{border-color:var(--primary);color:var(--primary);} &.active{background:var(--primary);border-color:var(--primary);color:white;} }
    .loading-state { display:flex;justify-content:center;padding:60px; }
    .member-cell { display:flex;align-items:center;gap:10px; }
    .month-badge { background:var(--gray-100);color:var(--gray-700);padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600; }
    .action-btns { display:flex;gap:6px;align-items:center; }
    .approved-label { display:flex;align-items:center;gap:4px; }
    .screenshot-btn { color:var(--primary);border-color:var(--primary-100); .material-icons{font-size:14px;} }
    .badge-info { background:#cffafe;color:#164e63; }

    .modal-lg { max-width:600px; }
    .form-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
    .full-col { grid-column:1/-1; }

    .upload-area {
      border:2px dashed var(--gray-300);border-radius:10px;padding:24px;text-align:center;cursor:pointer;transition:all 0.2s;
      &:hover { border-color:var(--primary);background:var(--primary-50); }
      &.has-file { border-color:var(--success);background:var(--success-light); }
    }
    .upload-icon { font-size:32px;color:var(--gray-400);display:block;margin-bottom:8px; }
    .upload-text { display:block;font-size:14px;font-weight:500;color:var(--gray-700); }
    .upload-hint { display:block;font-size:12px;color:var(--gray-400);margin-top:4px; }

    .screenshot-overlay { background:rgba(0,0,0,0.85); }
    .screenshot-modal { position:relative;max-width:90vw;max-height:90vh; }
    .screenshot-img { max-width:100%;max-height:85vh;border-radius:8px;display:block; }
    .close-screenshot { position:absolute;top:-40px;right:0;color:white; }

    @media(max-width:768px) { .form-grid-2{grid-template-columns:1fr;} .full-col{grid-column:1;} }
  `]
})
export class PaymentsComponent implements OnInit {
  loading = signal(true);
  savingPayment = signal(false);
  payments = signal<Payment[]>([]);
  filteredPayments = signal<Payment[]>([]);
  committees = signal<Committee[]>([]);
  committeeMembers = signal<any[]>([]);
  activeFilter = signal('all');
  processingId = signal<string | null>(null);
  showAddModal = signal(false);
  viewingScreenshot = signal<string | null>(null);
  selectedFile: File | null = null;

  paymentForm = {
    committee_id: '', member_id: '', month: 1,
    amount: 0, payment_date: '', status: 'pending' as Payment['status'], notes: ''
  };

  private avatarColors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];

  constructor(private dataService: DataService, private toast: ToastService, private auth: AuthService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const [payments, committees] = await Promise.all([
        this.dataService.getPayments(),
        this.dataService.getCommittees()
      ]);
      this.payments.set(payments);
      this.filteredPayments.set(payments);
      this.committees.set(committees);
    } finally {
      this.loading.set(false);
    }
  }

  approvedCount() { return this.payments().filter(p => p.status === 'approved').length; }
  underReviewCount() { return this.payments().filter(p => p.status === 'under_review').length; }
  pendingCount() { return this.payments().filter(p => p.status === 'pending').length; }
  rejectedCount() { return this.payments().filter(p => p.status === 'rejected').length; }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { approved: 'Approved', rejected: 'Rejected', under_review: 'Under Review', pending: 'Pending' };
    return labels[status] || status;
  }

  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilters(q);
  }

  setFilter(filter: string) { this.activeFilter.set(filter); this.applyFilters(); }

  applyFilters(search = '') {
    let result = this.payments();
    if (this.activeFilter() !== 'all') result = result.filter(p => p.status === this.activeFilter());
    if (search) result = result.filter(p => (p.member_name || '').toLowerCase().includes(search) || (p.committee_name || '').toLowerCase().includes(search));
    this.filteredPayments.set(result);
  }

  async approvePayment(payment: Payment) {
    this.processingId.set(payment.id);
    try {
      const updated = await this.dataService.updatePaymentStatus(payment.id, 'approved');
      this.payments.update(list => list.map(p => p.id === updated.id ? { ...p, ...updated } : p));
      this.applyFilters();
      this.toast.success(`Payment approved for ${payment.member_name}`);
    } catch { this.toast.error('Failed to approve payment'); }
    finally { this.processingId.set(null); }
  }

  async rejectPayment(payment: Payment) {
    const reason = prompt('Reason for rejection (optional):') || '';
    this.processingId.set(payment.id);
    try {
      const updated = await this.dataService.updatePaymentStatus(payment.id, 'rejected', reason);
      this.payments.update(list => list.map(p => p.id === updated.id ? { ...p, ...updated } : p));
      this.applyFilters();
      this.toast.warning(`Payment rejected for ${payment.member_name}`);
    } catch { this.toast.error('Failed to reject payment'); }
    finally { this.processingId.set(null); }
  }

  sendReminder(payment: Payment) { this.toast.info(`Reminder sent to ${payment.member_name}`); }

  openAddPaymentModal() {
    this.paymentForm = { committee_id: '', member_id: '', month: 1, amount: 0, payment_date: new Date().toISOString().split('T')[0], status: 'pending', notes: '' };
    this.selectedFile = null;
    this.showAddModal.set(true);
  }

  async onCommitteeChange() {
    if (!this.paymentForm.committee_id) { this.committeeMembers.set([]); return; }
    const members = await this.dataService.getCommitteeMembers(this.paymentForm.committee_id);
    this.committeeMembers.set(members);
    const committee = this.committees().find(c => c.id === this.paymentForm.committee_id);
    if (committee) this.paymentForm.amount = committee.monthly_amount;
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFile = file;
  }

  async savePayment() {
    if (!this.paymentForm.committee_id || !this.paymentForm.member_id || !this.paymentForm.amount) {
      this.toast.error('Please fill all required fields');
      return;
    }
    this.savingPayment.set(true);
    try {
      let screenshotUrl = '';
      if (this.selectedFile) {
        screenshotUrl = await this.dataService.uploadPaymentScreenshot(this.selectedFile);
      }
      const payment = await this.dataService.createPayment({
        committee_id: this.paymentForm.committee_id,
        member_id: this.paymentForm.member_id,
        month: this.paymentForm.month,
        amount: this.paymentForm.amount,
        status: this.paymentForm.status,
        payment_date: this.paymentForm.payment_date || undefined,
        screenshot_url: screenshotUrl || undefined,
        notes: this.paymentForm.notes || undefined
      });
      this.payments.update(list => [payment, ...list]);
      this.applyFilters();
      this.toast.success('Payment recorded successfully');
      this.showAddModal.set(false);
    } catch (e: any) {
      this.toast.error('Failed to save payment: ' + (e?.message || ''));
    } finally {
      this.savingPayment.set(false);
    }
  }

  getInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
  getAvatarColor(name: string): string { return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length]; }
}
