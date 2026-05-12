import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-verification-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="vr-page">
  <div class="page-header">
    <div class="page-title">
      <h1>Verification Request</h1>
      <p>Get your account verified to build trust with committee members</p>
    </div>
  </div>

  <!-- Status Banner -->
  <div class="status-banner" [class]="'status-' + currentStatus()">
    <div class="sb-icon">
      <span class="material-icons">{{ statusIcon() }}</span>
    </div>
    <div class="sb-content">
      <div class="sb-title">{{ statusTitle() }}</div>
      <div class="sb-desc">{{ statusDesc() }}</div>
    </div>
    <div class="sb-badge" [class]="'badge-' + currentStatus()">{{ statusLabel() }}</div>
  </div>

  <!-- Benefits -->
  <div class="benefits-row" *ngIf="currentStatus() === 'unverified'">
    <div class="benefit" *ngFor="let b of benefits">
      <span class="material-icons">{{ b.icon }}</span>
      <span>{{ b.text }}</span>
    </div>
  </div>

  <!-- Rejection reason -->
  <div class="rejection-box" *ngIf="currentStatus() === 'rejected' && existingRequest()?.rejection_reason">
    <span class="material-icons">info</span>
    <div>
      <strong>Rejection Reason:</strong>
      <p>{{ existingRequest()?.rejection_reason }}</p>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loading()" class="loading-state"><div class="spinner"></div></div>

  <!-- Form — show if unverified or rejected -->
  <div class="vr-form-card" *ngIf="!loading() && (currentStatus() === 'unverified' || currentStatus() === 'rejected')">
    <div class="vr-form-header">
      <h3>Submit Verification Request</h3>
      <p>All information is kept confidential and used only for verification purposes.</p>
    </div>

    <form (ngSubmit)="submitRequest()" class="vr-form">
      <!-- Personal Info -->
      <div class="form-section">
        <div class="form-section-title">Personal Information</div>
        <div class="form-grid">
          <div class="fg">
            <label>Full Name *</label>
            <input type="text" class="finp" [(ngModel)]="form.fullName" name="fullName"
                   placeholder="As on CNIC" required>
          </div>
          <div class="fg">
            <label>CNIC Number *</label>
            <input type="text" class="finp" [(ngModel)]="form.cnicNumber" name="cnic"
                   placeholder="XXXXX-XXXXXXX-X" required>
          </div>
          <div class="fg">
            <label>Phone Number *</label>
            <input type="tel" class="finp" [(ngModel)]="form.phone" name="phone"
                   placeholder="0300-1234567" required>
          </div>
          <div class="fg full">
            <label>Home Address *</label>
            <input type="text" class="finp" [(ngModel)]="form.address" name="address"
                   placeholder="Full residential address" required>
          </div>
        </div>
      </div>

      <!-- Document Upload -->
      <div class="form-section">
        <div class="form-section-title">Document Upload</div>
        <div class="upload-grid">

          <!-- CNIC Front -->
          <div class="upload-box" (click)="cnicFrontInput.click()" [class.has-file]="previews.cnicFront">
            <input #cnicFrontInput type="file" accept="image/*,.pdf" style="display:none"
                   (change)="onFileSelect($event, 'cnicFront')">
            <img *ngIf="previews.cnicFront" [src]="previews.cnicFront" class="upload-preview">
            <div *ngIf="!previews.cnicFront" class="upload-placeholder">
              <span class="material-icons">credit_card</span>
              <span>CNIC Front *</span>
              <span class="upload-hint">JPG, PNG or PDF</span>
            </div>
            <div class="upload-overlay" *ngIf="previews.cnicFront">
              <span class="material-icons">check_circle</span>
              <span>CNIC Front ✓</span>
            </div>
          </div>

          <!-- CNIC Back -->
          <div class="upload-box" (click)="cnicBackInput.click()" [class.has-file]="previews.cnicBack">
            <input #cnicBackInput type="file" accept="image/*,.pdf" style="display:none"
                   (change)="onFileSelect($event, 'cnicBack')">
            <img *ngIf="previews.cnicBack" [src]="previews.cnicBack" class="upload-preview">
            <div *ngIf="!previews.cnicBack" class="upload-placeholder">
              <span class="material-icons">credit_card</span>
              <span>CNIC Back *</span>
              <span class="upload-hint">JPG, PNG or PDF</span>
            </div>
            <div class="upload-overlay" *ngIf="previews.cnicBack">
              <span class="material-icons">check_circle</span>
              <span>CNIC Back ✓</span>
            </div>
          </div>

          <!-- Selfie -->
          <div class="upload-box" (click)="selfieInput.click()" [class.has-file]="previews.selfie">
            <input #selfieInput type="file" accept="image/*" style="display:none"
                   (change)="onFileSelect($event, 'selfie')">
            <img *ngIf="previews.selfie" [src]="previews.selfie" class="upload-preview">
            <div *ngIf="!previews.selfie" class="upload-placeholder">
              <span class="material-icons">face</span>
              <span>Selfie Photo</span>
              <span class="upload-hint">Clear face photo</span>
            </div>
            <div class="upload-overlay" *ngIf="previews.selfie">
              <span class="material-icons">check_circle</span>
              <span>Selfie ✓</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <div class="fg">
          <label>Additional Notes (Optional)</label>
          <textarea class="finp" rows="3" [(ngModel)]="form.notes" name="notes"
                    placeholder="Any additional information for the reviewer..."></textarea>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="vr-disclaimer">
        <span class="material-icons">security</span>
        <p>Your documents are encrypted and stored securely. They will only be reviewed by the Super Admin for verification purposes and will not be shared with anyone.</p>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="submit" class="btn-submit" [disabled]="submitting()">
          <span class="material-icons">{{ submitting() ? 'hourglass_empty' : 'verified_user' }}</span>
          {{ submitting() ? 'Submitting...' : 'Submit Verification Request' }}
        </button>
      </div>
    </form>
  </div>

  <!-- Pending state details -->
  <div class="pending-card" *ngIf="!loading() && currentStatus() === 'pending'">
    <div class="pending-icon"><span class="material-icons">hourglass_top</span></div>
    <h3>Request Under Review</h3>
    <p>Your verification request has been submitted and is currently being reviewed by the Super Admin. You will be notified once a decision is made.</p>
    <div class="pending-details" *ngIf="existingRequest()">
      <div class="pd-row"><span>Submitted</span><strong>{{ existingRequest()?.created_at | date:'MMM d, y h:mm a' }}</strong></div>
      <div class="pd-row"><span>Full Name</span><strong>{{ existingRequest()?.full_name }}</strong></div>
      <div class="pd-row"><span>CNIC</span><strong>{{ existingRequest()?.cnic_number }}</strong></div>
      <div class="pd-row"><span>Status</span><strong class="status-pending">Pending Review</strong></div>
    </div>
  </div>

  <!-- Verified state -->
  <div class="verified-card" *ngIf="!loading() && currentStatus() === 'verified'">
    <div class="verified-icon"><span class="material-icons">verified</span></div>
    <h3>Account Verified!</h3>
    <p>Your account has been verified. A verified badge now appears on your profile and committees.</p>
    <div class="verified-badge-preview">
      <span class="material-icons">verified</span>
      {{ auth.currentUser()?.name }} <span class="vbp-text">Verified</span>
    </div>
  </div>

</div>
  `,
  styles: [`
    .vr-page { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .page-header { margin-bottom: 24px; h1 { font-size: 24px; font-weight: 700; color: var(--gray-900); } p { font-size: 14px; color: var(--gray-500); margin-top: 4px; } }
    .loading-state { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--gray-200); border-top-color: #1E3A5F; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Status Banner */
    .status-banner { display: flex; align-items: center; gap: 16px; padding: 18px 22px; border-radius: 14px; margin-bottom: 20px; border: 1px solid; }
    .status-unverified { background: rgba(100,116,139,0.08); border-color: rgba(100,116,139,0.2); }
    .status-pending { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.25); }
    .status-verified { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.25); }
    .status-rejected { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); }
    .sb-icon .material-icons { font-size: 28px; }
    .status-unverified .sb-icon .material-icons { color: #94A3B8; }
    .status-pending .sb-icon .material-icons { color: #f59e0b; }
    .status-verified .sb-icon .material-icons { color: #10b981; }
    .status-rejected .sb-icon .material-icons { color: #ef4444; }
    .sb-content { flex: 1; }
    .sb-title { font-size: 15px; font-weight: 700; color: var(--gray-900); margin-bottom: 3px; }
    .sb-desc { font-size: 13px; color: var(--gray-500); }
    .sb-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .badge-unverified { background: var(--gray-100); color: var(--gray-600); }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-verified { background: #d1fae5; color: #065f46; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }

    /* Benefits */
    .benefits-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .benefit { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 8px 14px; font-size: 13px; color: var(--gray-700); .material-icons { font-size: 16px; color: #1E3A5F; } }

    /* Rejection box */
    .rejection-box { display: flex; gap: 12px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; .material-icons { color: #ef4444; font-size: 20px; flex-shrink: 0; margin-top: 2px; } strong { display: block; font-size: 14px; color: #991b1b; margin-bottom: 4px; } p { font-size: 13px; color: #7f1d1d; } }

    /* Form Card */
    .vr-form-card { background: white; border-radius: 14px; border: 1px solid var(--gray-200); overflow: hidden; box-shadow: 0 1px 4px rgba(15,23,42,0.06); }
    .vr-form-header { padding: 20px 24px; border-bottom: 1px solid var(--gray-200); h3 { font-size: 16px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px; } p { font-size: 13px; color: var(--gray-500); } }
    .vr-form { padding: 24px; }
    .form-section { margin-bottom: 28px; }
    .form-section-title { font-size: 13px; font-weight: 700; color: #1E3A5F; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--gray-100); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .fg { display: flex; flex-direction: column; gap: 5px; }
    .fg.full { grid-column: 1/-1; }
    .fg label { font-size: 13px; font-weight: 600; color: var(--gray-700); }
    .finp { padding: 10px 14px; border: 1.5px solid var(--gray-200); border-radius: 8px; font-size: 14px; color: var(--gray-900); outline: none; font-family: inherit; resize: vertical; transition: border-color 0.2s; &:focus { border-color: #1E3A5F; box-shadow: 0 0 0 3px rgba(30,58,95,0.08); } &::placeholder { color: var(--gray-400); } }

    /* Upload */
    .upload-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .upload-box { border: 2px dashed var(--gray-300); border-radius: 12px; height: 140px; cursor: pointer; position: relative; overflow: hidden; transition: all 0.2s; display: flex; align-items: center; justify-content: center; &:hover { border-color: #1E3A5F; background: #EEF3FA; } &.has-file { border-color: #10b981; border-style: solid; } }
    .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--gray-500); .material-icons { font-size: 28px; color: var(--gray-400); } span { font-size: 13px; font-weight: 600; } }
    .upload-hint { font-size: 11px !important; font-weight: 400 !important; color: var(--gray-400) !important; }
    .upload-preview { width: 100%; height: 100%; object-fit: cover; }
    .upload-overlay { position: absolute; inset: 0; background: rgba(16,185,129,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: white; .material-icons { font-size: 24px; } span { font-size: 12px; font-weight: 600; } }

    /* Disclaimer */
    .vr-disclaimer { display: flex; gap: 10px; align-items: flex-start; background: #EEF3FA; border-radius: 10px; padding: 14px; margin-bottom: 20px; .material-icons { color: #1E3A5F; font-size: 20px; flex-shrink: 0; } p { font-size: 13px; color: var(--gray-600); line-height: 1.6; } }

    /* Actions */
    .form-actions { display: flex; justify-content: flex-end; }
    .btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: #1E3A5F; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; .material-icons { font-size: 18px; } &:hover:not(:disabled) { background: #152C4A; transform: translateY(-1px); } &:disabled { opacity: 0.6; cursor: not-allowed; } }

    /* Pending Card */
    .pending-card { background: white; border-radius: 14px; border: 1px solid #fde68a; padding: 32px; text-align: center; box-shadow: 0 1px 4px rgba(15,23,42,0.06); }
    .pending-icon .material-icons { font-size: 52px; color: #f59e0b; display: block; margin-bottom: 14px; }
    .pending-card h3 { font-size: 20px; font-weight: 700; color: var(--gray-900); margin-bottom: 8px; }
    .pending-card p { font-size: 14px; color: var(--gray-500); margin-bottom: 24px; line-height: 1.6; }
    .pending-details { background: var(--gray-50); border-radius: 10px; padding: 16px; text-align: left; max-width: 400px; margin: 0 auto; }
    .pd-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-100); font-size: 13px; &:last-child { border-bottom: none; } span { color: var(--gray-500); } strong { color: var(--gray-900); } }
    .status-pending { color: #92400e !important; }

    /* Verified Card */
    .verified-card { background: white; border-radius: 14px; border: 1px solid #a7f3d0; padding: 32px; text-align: center; box-shadow: 0 1px 4px rgba(15,23,42,0.06); }
    .verified-icon .material-icons { font-size: 52px; color: #10b981; display: block; margin-bottom: 14px; }
    .verified-card h3 { font-size: 20px; font-weight: 700; color: var(--gray-900); margin-bottom: 8px; }
    .verified-card p { font-size: 14px; color: var(--gray-500); margin-bottom: 24px; }
    .verified-badge-preview { display: inline-flex; align-items: center; gap: 8px; background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 50px; padding: 8px 20px; font-size: 15px; font-weight: 700; color: #065f46; .material-icons { font-size: 18px; color: #10b981; } }
    .vbp-text { font-size: 12px; font-weight: 600; color: #10b981; }

    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .upload-grid { grid-template-columns: 1fr 1fr; } .fg.full { grid-column: 1; } }
  `]
})
export class VerificationRequestComponent implements OnInit {
  loading = signal(true);
  submitting = signal(false);
  existingRequest = signal<any>(null);

  form = { fullName: '', cnicNumber: '', phone: '', address: '', notes: '' };
  files: { cnicFront?: File; cnicBack?: File; selfie?: File } = {};
  previews: { cnicFront?: string; cnicBack?: string; selfie?: string } = {};

  benefits = [
    { icon: 'verified', text: 'Verified badge on your profile' },
    { icon: 'groups', text: 'Badge shown on your committees' },
    { icon: 'thumb_up', text: 'Build trust with members' },
    { icon: 'star', text: 'Higher trust score' }
  ];

  constructor(
    public auth: AuthService,
    private supabase: SupabaseService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    const u = this.auth.currentUser();
    if (u) {
      this.form.fullName = u.name || '';
      this.form.phone = u.phone || '';
    }
    // Force reload profile from DB to get latest verified/verification_status
    await this.refreshProfile();
    await this.loadExistingRequest();
    this.loading.set(false);
  }

  private async refreshProfile() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    try {
      const { data: profile } = await this.supabase.client
        .from('profiles').select('verified, verification_status, name, phone, role, status')
        .eq('id', userId).single();
      if (profile) {
        const current = this.auth.currentUser();
        if (current) {
          this.auth.currentUser.set({
            ...current,
            verified: profile.verified || false
          });
        }
      }
    } catch (e) { console.warn('refreshProfile error:', e); }
  }

  private async loadExistingRequest() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const { data } = await this.supabase.client
      .from('verification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    this.existingRequest.set(data);

    // If profile is verified but request still shows pending, sync it
    if (this.auth.currentUser()?.verified && data?.status === 'pending') {
      await this.supabase.client.from('verification_requests')
        .update({ status: 'approved' }).eq('id', data.id);
      this.existingRequest.set({ ...data, status: 'approved' });
    }
  }

  currentStatus(): string {
    // First check if profile is already verified
    if (this.auth.currentUser()?.verified) return 'verified';
    const req = this.existingRequest();
    if (!req) return 'unverified';
    return req.status || 'pending';
  }

  statusIcon() {
    const s = this.currentStatus();
    if (s === 'verified') return 'verified';
    if (s === 'pending') return 'hourglass_top';
    if (s === 'rejected') return 'cancel';
    return 'verified_user';
  }

  statusTitle() {
    const s = this.currentStatus();
    if (s === 'verified') return 'Account Verified';
    if (s === 'pending') return 'Verification Pending';
    if (s === 'rejected') return 'Verification Rejected';
    return 'Not Verified';
  }

  statusDesc() {
    const s = this.currentStatus();
    if (s === 'verified') return 'Your account is verified. Badge is visible on your profile and committees.';
    if (s === 'pending') return 'Your request is under review. You will be notified once a decision is made.';
    if (s === 'rejected') return 'Your request was rejected. You can submit a new request with correct documents.';
    return 'Submit a verification request to get your account verified by the Super Admin.';
  }

  statusLabel() {
    const s = this.currentStatus();
    if (s === 'verified') return 'Verified';
    if (s === 'pending') return 'Pending Review';
    if (s === 'rejected') return 'Rejected';
    return 'Unverified';
  }

  onFileSelect(event: any, field: 'cnicFront' | 'cnicBack' | 'selfie') {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toast.error('File too large. Max 5MB.'); return; }
    this.files[field] = file;
    const reader = new FileReader();
    reader.onload = (e: any) => { this.previews[field] = e.target.result; };
    reader.readAsDataURL(file);
  }

  private async uploadFile(file: File, path: string): Promise<string | null> {
    const { error } = await this.supabase.client.storage
      .from('verification-docs').upload(path, file, { upsert: true });
    if (error) { console.warn('Upload error:', error.message); return null; }
    const { data } = this.supabase.client.storage.from('verification-docs').getPublicUrl(path);
    return data.publicUrl;
  }

  async submitRequest() {
    if (!this.form.fullName || !this.form.cnicNumber || !this.form.phone || !this.form.address) {
      this.toast.error('Please fill all required fields'); return;
    }
    if (!this.files.cnicFront || !this.files.cnicBack) {
      this.toast.error('Please upload both CNIC front and back images'); return;
    }

    this.submitting.set(true);
    try {
      const userId = this.auth.currentUser()?.id!;
      const ts = Date.now();

      // Upload files
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        this.uploadFile(this.files.cnicFront!, `${userId}/${ts}-cnic-front`),
        this.uploadFile(this.files.cnicBack!, `${userId}/${ts}-cnic-back`),
        this.files.selfie ? this.uploadFile(this.files.selfie, `${userId}/${ts}-selfie`) : Promise.resolve(null)
      ]);

      // Insert request
      const { error } = await this.supabase.client.from('verification_requests').insert({
        user_id: userId,
        full_name: this.form.fullName,
        cnic_number: this.form.cnicNumber,
        phone: this.form.phone,
        address: this.form.address,
        cnic_front_url: frontUrl,
        cnic_back_url: backUrl,
        selfie_url: selfieUrl,
        notes: this.form.notes || null,
        status: 'pending'
      });

      if (error) throw new Error(error.message);

      // Update profile verification_status
      await this.supabase.client.from('profiles')
        .update({ verification_status: 'pending' }).eq('id', userId);

      // Notify super admins
      const { data: superAdmins } = await this.supabase.client
        .from('profiles').select('id').eq('role', 'super_admin');
      if (superAdmins?.length) {
        await this.supabase.client.from('notifications').insert(
          superAdmins.map((sa: any) => ({
            user_id: sa.id,
            title: 'New Verification Request',
            message: `${this.auth.currentUser()?.name} has submitted a verification request.`,
            type: 'info', read: false
          }))
        );
      }

      await this.loadExistingRequest();
      this.toast.success('Verification request submitted! You will be notified once reviewed.');
    } catch (e: any) {
      this.toast.error('Failed: ' + e?.message);
    } finally {
      this.submitting.set(false);
    }
  }
}
