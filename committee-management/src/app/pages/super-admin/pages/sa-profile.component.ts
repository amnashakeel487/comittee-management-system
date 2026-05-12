import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-sa-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <div class="sa-page-header">
    <h2>My Profile</h2>
    <p>Manage your Super Admin account settings</p>
  </div>

  <div class="profile-grid">

    <!-- Profile Card -->
    <div class="profile-card">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar">{{ getInitials() }}</div>
        <div class="profile-badge">Super Admin</div>
      </div>
      <div class="profile-name">{{ auth.currentUser()?.name || 'Super Admin' }}</div>
      <div class="profile-email">{{ auth.currentUser()?.email }}</div>
      <div class="profile-meta">
        <div class="pm-item"><span class="material-icons">shield</span><span>Full Platform Access</span></div>
        <div class="pm-item"><span class="material-icons">verified</span><span>Verified Account</span></div>
      </div>
    </div>

    <!-- Edit Forms -->
    <div class="profile-forms">

      <!-- Personal Info -->
      <div class="sa-form-card">
        <div class="sa-form-card-header">
          <h3><span class="material-icons">person</span> Personal Information</h3>
          <button class="edit-toggle" (click)="editMode.update(v=>!v)">
            <span class="material-icons">{{ editMode() ? 'close' : 'edit' }}</span>
            {{ editMode() ? 'Cancel' : 'Edit' }}
          </button>
        </div>
        <div class="sa-form-body">
          <div class="form-row">
            <div class="fg">
              <label>Full Name</label>
              <input type="text" class="finp" [(ngModel)]="profileForm.name"
                     [disabled]="!editMode()" placeholder="Your full name">
            </div>
            <div class="fg">
              <label>Email Address</label>
              <input type="email" class="finp" [(ngModel)]="profileForm.email"
                     [disabled]="true" placeholder="Email cannot be changed here">
              <span class="field-hint">Use Change Password section to update email</span>
            </div>
          </div>
          <div class="form-row">
            <div class="fg">
              <label>Phone Number</label>
              <input type="tel" class="finp" [(ngModel)]="profileForm.phone"
                     [disabled]="!editMode()" placeholder="e.g. 0300-1234567">
            </div>
            <div class="fg">
              <label>City</label>
              <input type="text" class="finp" [(ngModel)]="profileForm.city"
                     [disabled]="!editMode()" placeholder="e.g. Karachi">
            </div>
          </div>
          <div class="form-actions" *ngIf="editMode()">
            <button class="sa-btn sa-btn-ghost" (click)="editMode.set(false)">Cancel</button>
            <button class="sa-btn sa-btn-primary" (click)="saveProfile()" [disabled]="savingProfile()">
              <span class="material-icons">{{ savingProfile() ? 'hourglass_empty' : 'save' }}</span>
              {{ savingProfile() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Change Password -->
      <div class="sa-form-card">
        <div class="sa-form-card-header">
          <h3><span class="material-icons">lock</span> Change Password</h3>
        </div>
        <div class="sa-form-body">
          <div class="form-row">
            <div class="fg">
              <label>New Password</label>
              <div class="input-wrap">
                <input [type]="showNewPwd() ? 'text' : 'password'" class="finp"
                       [(ngModel)]="pwdForm.newPassword" placeholder="Enter new password">
                <button type="button" class="eye-btn" (click)="showNewPwd.update(v=>!v)">
                  <span class="material-icons">{{ showNewPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>
            <div class="fg">
              <label>Confirm New Password</label>
              <div class="input-wrap">
                <input [type]="showConfirmPwd() ? 'text' : 'password'" class="finp"
                       [(ngModel)]="pwdForm.confirmPassword" placeholder="Confirm new password">
                <button type="button" class="eye-btn" (click)="showConfirmPwd.update(v=>!v)">
                  <span class="material-icons">{{ showConfirmPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>
          </div>
          <div class="pwd-rules">
            <span [class.ok]="pwdForm.newPassword.length >= 8">✓ At least 8 characters</span>
            <span [class.ok]="pwdForm.newPassword === pwdForm.confirmPassword && pwdForm.newPassword.length > 0">✓ Passwords match</span>
          </div>
          <div class="pwd-error" *ngIf="pwdError()">
            <span class="material-icons">error</span> {{ pwdError() }}
          </div>
          <div class="form-actions">
            <button class="sa-btn sa-btn-primary" (click)="changePassword()" [disabled]="changingPwd()">
              <span class="material-icons">{{ changingPwd() ? 'hourglass_empty' : 'lock_reset' }}</span>
              {{ changingPwd() ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Change Email -->
      <div class="sa-form-card">
        <div class="sa-form-card-header">
          <h3><span class="material-icons">email</span> Change Email</h3>
        </div>
        <div class="sa-form-body">
          <div class="form-row">
            <div class="fg">
              <label>Current Email</label>
              <input type="email" class="finp" [value]="auth.currentUser()?.email || ''" disabled>
            </div>
            <div class="fg">
              <label>New Email Address</label>
              <input type="email" class="finp" [(ngModel)]="newEmail" placeholder="Enter new email">
            </div>
          </div>
          <div class="info-note">
            <span class="material-icons">info</span>
            A confirmation link will be sent to your new email address. You must click it to complete the change.
          </div>
          <div class="form-actions">
            <button class="sa-btn sa-btn-primary" (click)="changeEmail()" [disabled]="changingEmail()">
              <span class="material-icons">{{ changingEmail() ? 'hourglass_empty' : 'send' }}</span>
              {{ changingEmail() ? 'Sending...' : 'Send Confirmation' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="sa-form-card danger-card">
        <div class="sa-form-card-header">
          <h3><span class="material-icons">warning</span> Session & Security</h3>
        </div>
        <div class="sa-form-body">
          <div class="danger-row">
            <div>
              <div class="danger-title">Sign Out</div>
              <div class="danger-desc">Sign out from the Super Admin control center</div>
            </div>
            <button class="sa-btn sa-btn-danger" (click)="logout()">
              <span class="material-icons">logout</span> Sign Out
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    .sa-page { color: white; }
    .sa-page-header { margin-bottom: 28px; h2 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 4px; } p { font-size: 14px; color: rgba(255,255,255,0.45); } }

    .profile-grid { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }

    /* Profile Card */
    .profile-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px 20px; text-align: center; position: sticky; top: 20px; }
    .profile-avatar-wrap { position: relative; display: inline-block; margin-bottom: 14px; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #1E3A5F, #2563EB); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: white; margin: 0 auto; border: 3px solid rgba(37,99,235,0.4); }
    .profile-badge { position: absolute; bottom: 0; right: -4px; background: #2563EB; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
    .profile-name { font-size: 17px; font-weight: 700; color: white; margin-bottom: 4px; }
    .profile-email { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 20px; word-break: break-all; }
    .profile-meta { display: flex; flex-direction: column; gap: 8px; }
    .pm-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.04); border-radius: 8px; padding: 8px 12px; .material-icons { font-size: 16px; color: #2563EB; } }

    /* Form Cards */
    .profile-forms { display: flex; flex-direction: column; gap: 20px; }
    .sa-form-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
    .sa-form-card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,0.06); h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: white; .material-icons { font-size: 18px; color: #2563EB; } } }
    .edit-toggle { display: flex; align-items: center; gap: 5px; padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; .material-icons { font-size: 15px; } &:hover { background: rgba(255,255,255,0.1); color: white; } }
    .sa-form-body { padding: 20px 22px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.65); }
    .finp { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; color: white; font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.2s; &:focus { border-color: rgba(37,99,235,0.5); } &::placeholder { color: rgba(255,255,255,0.2); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .field-hint { font-size: 11px; color: rgba(255,255,255,0.3); }
    .input-wrap { position: relative; }
    .input-wrap .finp { padding-right: 40px; width: 100%; }
    .eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); display: flex; .material-icons { font-size: 17px; } &:hover { color: rgba(255,255,255,0.7); } }
    .pwd-rules { display: flex; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; span { font-size: 12px; color: rgba(255,255,255,0.3); &.ok { color: #4ade80; } } }
    .pwd-error { display: flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #f87171; margin-bottom: 14px; .material-icons { font-size: 16px; } }
    .info-note { display: flex; align-items: flex-start; gap: 8px; background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2); border-radius: 8px; padding: 12px 14px; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 14px; line-height: 1.5; .material-icons { font-size: 16px; color: #2563EB; flex-shrink: 0; margin-top: 1px; } }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }

    /* Buttons */
    .sa-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: all 0.15s; .material-icons { font-size: 16px; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .sa-btn-primary { background: #2563EB; color: white; &:hover:not(:disabled) { background: #1D4ED8; } }
    .sa-btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); &:hover { background: rgba(255,255,255,0.1); color: white; } }
    .sa-btn-danger { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); &:hover { background: rgba(239,68,68,0.2); } }

    /* Danger Zone */
    .danger-card { border-color: rgba(239,68,68,0.15); }
    .danger-card .sa-form-card-header h3 .material-icons { color: #f87171; }
    .danger-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .danger-title { font-size: 14px; font-weight: 600; color: white; margin-bottom: 3px; }
    .danger-desc { font-size: 13px; color: rgba(255,255,255,0.45); }

    @media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr; } .profile-card { position: static; } .form-row { grid-template-columns: 1fr; } }
  `]
})
export class SaProfileComponent implements OnInit {
  editMode = signal(false);
  savingProfile = signal(false);
  changingPwd = signal(false);
  changingEmail = signal(false);
  showNewPwd = signal(false);
  showConfirmPwd = signal(false);
  pwdError = signal('');
  newEmail = '';

  profileForm = { name: '', email: '', phone: '', city: '' };
  pwdForm = { newPassword: '', confirmPassword: '' };

  constructor(
    public auth: AuthService,
    private supabase: SupabaseService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const u = this.auth.currentUser();
    this.profileForm = {
      name: u?.name || '',
      email: u?.email || '',
      phone: u?.phone || '',
      city: ''
    };
  }

  async saveProfile() {
    if (!this.profileForm.name.trim()) { this.toast.error('Name is required'); return; }
    this.savingProfile.set(true);
    try {
      const userId = this.auth.currentUser()?.id;
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ name: this.profileForm.name, phone: this.profileForm.phone || null })
        .eq('id', userId);
      if (error) throw new Error(error.message);
      // Update auth metadata
      await this.supabase.client.auth.updateUser({ data: { name: this.profileForm.name } });
      // Refresh current user
      await this.auth.loadUserProfile({ id: userId, email: this.auth.currentUser()?.email });
      this.toast.success('Profile updated successfully');
      this.editMode.set(false);
    } catch (e: any) {
      this.toast.error('Failed: ' + e?.message);
    } finally {
      this.savingProfile.set(false);
    }
  }

  async changePassword() {
    this.pwdError.set('');
    if (!this.pwdForm.newPassword) { this.pwdError.set('Please enter a new password'); return; }
    if (this.pwdForm.newPassword.length < 8) { this.pwdError.set('Password must be at least 8 characters'); return; }
    if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) { this.pwdError.set('Passwords do not match'); return; }

    this.changingPwd.set(true);
    try {
      const { error } = await this.supabase.client.auth.updateUser({ password: this.pwdForm.newPassword });
      if (error) throw new Error(error.message);
      this.pwdForm = { newPassword: '', confirmPassword: '' };
      this.toast.success('Password updated successfully');
    } catch (e: any) {
      this.pwdError.set(e?.message || 'Failed to update password');
    } finally {
      this.changingPwd.set(false);
    }
  }

  async changeEmail() {
    if (!this.newEmail.trim() || !this.newEmail.includes('@')) {
      this.toast.error('Please enter a valid email address'); return;
    }
    this.changingEmail.set(true);
    try {
      const { error } = await this.supabase.client.auth.updateUser({ email: this.newEmail });
      if (error) throw new Error(error.message);
      this.toast.success('Confirmation sent! Check your new email to complete the change.');
      this.newEmail = '';
    } catch (e: any) {
      this.toast.error('Failed: ' + e?.message);
    } finally {
      this.changingEmail.set(false);
    }
  }

  logout() { this.auth.logout(); }

  getInitials(): string {
    const name = this.auth.currentUser()?.name || 'SA';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
