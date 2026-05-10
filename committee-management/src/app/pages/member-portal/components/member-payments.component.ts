import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberDataService } from '../../../services/member-data.service';
import { ToastService } from '../../../services/toast.service';
import { SupabaseService } from '../../../services/supabase.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-member-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="m-payments">
      <div class="page-header">
        <div class="page-title">
          <h1>Submit Payment</h1>
          <p>Upload your payment proof for admin approval</p>
        </div>
      </div>

      <div class="payment-layout">
        <!-- Form -->
        <div class="payment-form-card">
          <div class="form-header">
            <div class="form-header-icon"><span class="material-icons">add_card</span></div>
            <div>
              <h3>New Payment Submission</h3>
              <p>Fill in the details and upload your payment screenshot</p>
            </div>
          </div>

          <div *ngIf="loading()" class="loading-center"><div class="spinner"></div></div>

          <form *ngIf="!loading()" (ngSubmit)="submitPayment()">
            <div class="form-group">
              <label><span class="material-icons label-icon">groups</span> Select Committee *</label>
              <select class="form-control" [(ngModel)]="form.committee_id" name="committee_id"
                      (ngModelChange)="onCommitteeChange()" required>
                <option value="">-- Choose a committee --</option>
                <option *ngFor="let m of memberships()" [value]="m.committee.id">
                  {{ m.committee.name }} (Turn #{{ m.member.payout_order }})
                </option>
              </select>
            </div>

            <!-- Admin Payment Accounts — shown after committee selected -->
            <div class="admin-accounts-section" *ngIf="form.committee_id && (loadingAccounts() || adminAccounts().length > 0 || accountsError())">
              <div class="accounts-header">
                <span class="material-icons">account_balance</span>
                <span>Send payment to one of these accounts</span>
              </div>

              <!-- Loading -->
              <div class="accounts-loading" *ngIf="loadingAccounts()">
                <div class="spinner" style="width:20px;height:20px;border-width:2px"></div>
                <span>Loading payment accounts...</span>
              </div>

              <!-- Error / table not set up -->
              <div class="accounts-empty" *ngIf="!loadingAccounts() && accountsError()">
                <span class="material-icons">info</span>
                <span>Payment accounts not available. Contact your admin.</span>
              </div>

              <!-- No accounts added yet -->
              <div class="accounts-empty" *ngIf="!loadingAccounts() && !accountsError() && adminAccounts().length === 0">
                <span class="material-icons">account_balance_wallet</span>
                <span>Admin hasn't added payment accounts yet. Contact them directly.</span>
              </div>

              <!-- Accounts list -->
              <div class="accounts-grid" *ngIf="!loadingAccounts() && adminAccounts().length > 0">
                <div *ngFor="let acc of adminAccounts()" class="account-card" [class.primary-card]="acc.is_primary">
                  <div class="ac-icon" [ngClass]="'type-' + acc.account_type">
                    <span class="material-icons">{{ getAccountIcon(acc.account_type) }}</span>
                  </div>
                  <div class="ac-info">
                    <div class="ac-title-row">
                      <span class="ac-title">{{ acc.account_title }}</span>
                      <span class="primary-tag" *ngIf="acc.is_primary">Primary</span>
                    </div>
                    <span class="ac-type">{{ getAccountTypeLabel(acc.account_type) }}</span>
                    <div class="ac-number-row">
                      <span class="ac-number">{{ acc.account_number }}</span>
                      <button type="button" class="copy-btn" (click)="copyToClipboard(acc.account_number)" title="Copy">
                        <span class="material-icons">content_copy</span>
                      </button>
                    </div>
                    <span class="ac-bank" *ngIf="acc.bank_name">{{ acc.bank_name }}</span>
                    <div class="ac-iban-row" *ngIf="acc.iban">
                      <span class="ac-iban">IBAN: {{ acc.iban }}</span>
                      <button type="button" class="copy-btn" (click)="copyToClipboard(acc.iban)" title="Copy IBAN">
                        <span class="material-icons">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label><span class="material-icons label-icon">calendar_month</span> Month *</label>
                <input type="number" class="form-control" [(ngModel)]="form.month" name="month"
                       min="1" [max]="selectedCommittee()?.duration_months || 12" required>
              </div>
              <div class="form-group">
                <label><span class="material-icons label-icon">payments</span> Amount (PKR) *</label>
                <input type="number" class="form-control" [(ngModel)]="form.amount" name="amount" required>
                <span class="form-hint" *ngIf="selectedCommittee()">
                  Monthly: PKR {{ selectedCommittee()!.monthly_amount | number }}
                </span>
              </div>
            </div>

            <div class="form-group">
              <label><span class="material-icons label-icon">event</span> Payment Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.payment_date" name="payment_date" required>
            </div>

            <div class="form-group">
              <label><span class="material-icons label-icon">image</span> Payment Screenshot / Slip *</label>
              <div class="upload-zone" (click)="fileInput.click()" [class.has-file]="selectedFile">
                <input #fileInput type="file" accept="image/*,.pdf" style="display:none" (change)="onFileSelect($event)">
                <ng-container *ngIf="!selectedFile">
                  <span class="material-icons upload-icon">cloud_upload</span>
                  <p class="upload-text">Click to upload screenshot or bank slip</p>
                  <p class="upload-hint">PNG, JPG, PDF — Max 5MB</p>
                </ng-container>
                <ng-container *ngIf="selectedFile">
                  <span class="material-icons upload-icon success-icon">check_circle</span>
                  <p class="upload-text success-text">{{ selectedFile.name }}</p>
                  <p class="upload-hint">{{ (selectedFile.size / 1024).toFixed(0) }} KB — Click to change</p>
                </ng-container>
              </div>
              <div class="img-preview" *ngIf="previewUrl">
                <img [src]="previewUrl" alt="Preview">
                <button type="button" class="remove-preview" (click)="removeFile()">
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label><span class="material-icons label-icon">notes</span> Notes (Optional)</label>
              <textarea class="form-control" rows="3" [(ngModel)]="form.notes" name="notes"
                        placeholder="Any additional information..."></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="resetForm()">
                <span class="material-icons">refresh</span> Reset
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                <span class="material-icons">{{ submitting() ? 'hourglass_empty' : 'send' }}</span>
                {{ submitting() ? 'Submitting...' : 'Submit Payment' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Info Panel -->
        <div class="info-panel">
          <div class="info-card">
            <h4><span class="material-icons">info</span> How it works</h4>
            <div class="steps">
              <div class="step"><div class="step-num">1</div><p>Select your committee to see payment accounts</p></div>
              <div class="step"><div class="step-num">2</div><p>Transfer the amount to the admin's account</p></div>
              <div class="step"><div class="step-num">3</div><p>Upload your transfer screenshot or slip</p></div>
              <div class="step"><div class="step-num">4</div><p>Admin reviews and approves your payment</p></div>
            </div>
          </div>

          <div class="status-legend">
            <h4>Payment Statuses</h4>
            <div class="legend-item"><span class="badge badge-warning">Pending</span><span>Not yet submitted</span></div>
            <div class="legend-item"><span class="badge badge-info">Under Review</span><span>Submitted, awaiting admin</span></div>
            <div class="legend-item"><span class="badge badge-success">Approved</span><span>Payment confirmed</span></div>
            <div class="legend-item"><span class="badge badge-danger">Rejected</span><span>Payment rejected</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .m-payments { animation: fadeIn 0.3s ease; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; color: #2A1F14; }
    .page-header p { font-size: 14px; color: #93785B; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .payment-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }

    .payment-form-card { background: white; border-radius: 12px; border: 1px solid #E2D8CE; padding: 28px; box-shadow: 0 1px 4px rgba(62,54,46,0.06); }
    .form-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #F0EBE4; }
    .form-header h3 { font-size: 17px; font-weight: 700; margin: 0 0 4px; color: #2A1F14; }
    .form-header p { font-size: 13px; color: #93785B; margin: 0; }
    .form-header-icon { width: 44px; height: 44px; background: #F0E8DF; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { color: #865D36; font-size: 22px; } }

    /* Admin Accounts Section */
    .admin-accounts-section { background: #FAF7F4; border: 1.5px solid #C9BAA8; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
    .accounts-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #4E3D2E; margin-bottom: 14px; .material-icons { font-size: 18px; color: #865D36; } }
    .accounts-loading { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #93785B; padding: 8px 0; }
    .accounts-empty { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #93785B; padding: 8px 0; .material-icons { font-size: 18px; color: #A69080; } }
    .accounts-grid { display: flex; flex-direction: column; gap: 10px; }

    .account-card { display: flex; gap: 12px; align-items: flex-start; background: white; border-radius: 8px; padding: 12px 14px; border: 1px solid #E2D8CE; transition: border-color 0.15s; &:hover { border-color: #AC8968; } }
    .primary-card { border-color: #865D36; border-width: 1.5px; }

    .ac-icon { width: 38px; height: 38px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { font-size: 18px; } }
    .type-bank { background: #dbeafe; .material-icons { color: #2563eb; } }
    .type-easypaisa { background: #d1fae5; .material-icons { color: #059669; } }
    .type-jazzcash { background: #fef3c7; .material-icons { color: #d97706; } }
    .type-nayapay { background: #ede9fe; .material-icons { color: #7c3aed; } }
    .type-sadapay { background: #fee2e2; .material-icons { color: #dc2626; } }
    .type-other { background: #F0E8DF; .material-icons { color: #865D36; } }

    .ac-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .ac-title-row { display: flex; align-items: center; gap: 6px; }
    .ac-title { font-size: 14px; font-weight: 700; color: #2A1F14; }
    .primary-tag { background: #865D36; color: white; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 8px; }
    .ac-type { font-size: 10px; color: #A69080; text-transform: uppercase; letter-spacing: 0.05em; }
    .ac-number-row, .ac-iban-row { display: flex; align-items: center; gap: 6px; }
    .ac-number { font-size: 14px; font-weight: 700; color: #3E362E; font-family: monospace; letter-spacing: 0.03em; }
    .ac-bank { font-size: 12px; color: #93785B; }
    .ac-iban { font-size: 11px; color: #93785B; font-family: monospace; }
    .copy-btn { background: none; border: none; cursor: pointer; color: #A69080; display: flex; padding: 2px; border-radius: 4px; transition: all 0.15s; .material-icons { font-size: 14px; } &:hover { color: #865D36; background: #F0E8DF; } }

    .form-group { margin-bottom: 18px; }
    .form-group label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #4E3D2E; margin-bottom: 6px; }
    .label-icon { font-size: 15px; color: #865D36; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-hint { font-size: 12px; color: #93785B; margin-top: 4px; display: block; }

    .form-control { width: 100%; padding: 10px 14px; border: 1.5px solid #E2D8CE; border-radius: 8px; font-size: 14px; color: #2A1F14; background: white; outline: none; font-family: inherit; transition: all 0.2s; &:focus { border-color: #865D36; box-shadow: 0 0 0 3px rgba(134,93,54,0.12); } &::placeholder { color: #A69080; } &:disabled { background: #FAF7F4; color: #93785B; } }
    select.form-control { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23865D36' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
    textarea.form-control { resize: vertical; }

    .upload-zone { border: 2px dashed #C9BAA8; border-radius: 10px; padding: 32px 20px; text-align: center; cursor: pointer; transition: all 0.2s; &:hover { border-color: #865D36; background: #FAF7F4; } &.has-file { border-color: #10b981; background: #f0fdf4; } }
    .upload-icon { font-size: 40px; color: #A69080; display: block; margin-bottom: 8px; }
    .success-icon { color: #10b981 !important; }
    .upload-text { font-size: 14px; font-weight: 500; color: #4E3D2E; margin: 0 0 4px; }
    .success-text { color: #10b981 !important; }
    .upload-hint { font-size: 12px; color: #A69080; margin: 0; }

    .img-preview { position: relative; margin-top: 12px; display: inline-block; img { max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #E2D8CE; display: block; } }
    .remove-preview { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; background: #ef4444; border: none; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; .material-icons { font-size: 14px; } }

    .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #F0EBE4; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: #865D36; color: white; &:hover:not(:disabled) { background: #6B4A28; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-secondary { background: #F0EBE4; color: #4E3D2E; &:hover { background: #E2D8CE; } }

    .info-panel { display: flex; flex-direction: column; gap: 16px; }
    .info-card { background: white; border-radius: 12px; border: 1px solid #E2D8CE; padding: 20px; }
    .info-card h4 { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; margin: 0 0 16px; color: #2A1F14; .material-icons { font-size: 18px; color: #865D36; } }
    .steps { display: flex; flex-direction: column; gap: 12px; }
    .step { display: flex; gap: 12px; align-items: flex-start; p { font-size: 13px; color: #6B5544; margin: 0; line-height: 1.5; } }
    .step-num { width: 24px; height: 24px; background: #865D36; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }

    .status-legend { background: white; border-radius: 12px; border: 1px solid #E2D8CE; padding: 20px; h4 { font-size: 14px; font-weight: 700; margin: 0 0 12px; color: #2A1F14; } }
    .legend-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 13px; color: #6B5544; }

    .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #EDE0D4; color: #4E3D2E; }

    @media (max-width: 1024px) { .payment-layout { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class MemberPaymentsComponent implements OnInit {
  loading = signal(true);
  submitting = signal(false);
  loadingAccounts = signal(false);
  memberships = signal<any[]>([]);
  selectedCommittee = signal<any>(null);
  adminAccounts = signal<any[]>([]);
  accountsError = signal(false);
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  form = { committee_id: '', month: 1, amount: 0, payment_date: new Date().toISOString().split('T')[0], notes: '' };

  constructor(
    private memberData: MemberDataService,
    private toast: ToastService,
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const data = await this.memberData.getMemberships();
      this.memberships.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  async onCommitteeChange() {
    const m = this.memberships().find(x => x.committee.id === this.form.committee_id);
    this.selectedCommittee.set(m?.committee || null);
    this.adminAccounts.set([]);
    this.accountsError.set(false);

    if (!m) return;

    this.form.amount = m.committee.monthly_amount;
    this.form.month = (m.committee.current_month || 0) + 1;

    // Get created_by — it should be on the committee object from getMemberships
    let adminUserId = m.committee.created_by;

    // Fallback: fetch directly if not present
    if (!adminUserId) {
      const { data: c } = await this.supabase.client
        .from('committees')
        .select('created_by')
        .eq('id', m.committee.id)
        .single();
      adminUserId = c?.created_by;
    }

    if (adminUserId) {
      await this.loadAdminAccounts(adminUserId);
    }
  }

  private async loadAdminAccounts(adminUserId: string) {
    this.loadingAccounts.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('payment_accounts')
        .select('*')
        .eq('user_id', adminUserId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at');

      if (error) {
        // Table may not exist yet — silently handle
        console.warn('payment_accounts:', error.message);
        this.accountsError.set(true);
        return;
      }
      this.adminAccounts.set(data || []);
    } catch (e) {
      this.accountsError.set(true);
    } finally {
      this.loadingAccounts.set(false);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('Copied to clipboard!');
    }).catch(() => {
      this.toast.info('Copy: ' + text);
    });
  }

  getAccountIcon(type: string): string {
    return { bank: 'account_balance', easypaisa: 'phone_android', jazzcash: 'phone_android', nayapay: 'credit_card', sadapay: 'credit_card', other: 'payments' }[type] || 'payments';
  }

  getAccountTypeLabel(type: string): string {
    return { bank: 'Bank Account', easypaisa: 'EasyPaisa', jazzcash: 'JazzCash', nayapay: 'NayaPay', sadapay: 'SadaPay', other: 'Other' }[type] || type;
  }

  onFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toast.error('File too large. Max 5MB.'); return; }
    this.selectedFile = file;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => this.previewUrl = e.target?.result as string;
      reader.readAsDataURL(file);
    } else { this.previewUrl = null; }
  }

  removeFile() { this.selectedFile = null; this.previewUrl = null; }

  async submitPayment() {
    if (!this.form.committee_id || !this.form.amount || !this.form.payment_date) { this.toast.error('Please fill all required fields'); return; }
    this.submitting.set(true);
    try {
      let screenshotUrl = '';
      if (this.selectedFile) screenshotUrl = await this.memberData.uploadScreenshot(this.selectedFile);
      await this.memberData.submitPayment({ committee_id: this.form.committee_id, month: this.form.month, amount: this.form.amount, payment_date: this.form.payment_date, screenshot_url: screenshotUrl || undefined, notes: this.form.notes || undefined });
      this.toast.success('Payment submitted! Status: Under Review');
      this.memberData.invalidateCache();
      this.resetForm();
    } catch (e: any) { this.toast.error('Failed: ' + (e?.message || '')); }
    finally { this.submitting.set(false); }
  }

  resetForm() {
    this.form = { committee_id: '', month: 1, amount: 0, payment_date: new Date().toISOString().split('T')[0], notes: '' };
    this.selectedFile = null; this.previewUrl = null;
    this.selectedCommittee.set(null); this.adminAccounts.set([]);
  }
}
