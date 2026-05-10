import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { MemberDataService } from '../../../services/member-data.service';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="m-profile">
      <div class="page-header">
        <div class="page-title"><h1>My Profile</h1><p>Manage your account information</p></div>
      </div>

      <div class="profile-layout">
        <!-- Profile Card -->
        <div class="profile-card">
          <div class="profile-cover"></div>
          <div class="profile-body">
            <div class="avatar-wrap">
              <div class="profile-avatar">{{ getInitials() }}</div>
            </div>
            <h2>{{ auth.currentUser()?.name }}</h2>
            <p class="profile-email">{{ auth.currentUser()?.email }}</p>
            <span class="member-badge">
              <span class="material-icons">person</span> Member
            </span>
          </div>
        </div>

        <!-- Edit Forms -->
        <div class="forms-col">
          <!-- Personal Info -->
          <div class="form-card">
            <div class="form-card-header">
              <h3><span class="material-icons">person</span> Personal Information</h3>
              <button class="btn-ghost" (click)="editMode.update(v => !v)">
                <span class="material-icons">{{ editMode() ? 'close' : 'edit' }}</span>
                {{ editMode() ? 'Cancel' : 'Edit' }}
              </button>
            </div>
            <div class="form-card-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" class="form-control" [(ngModel)]="profileForm.name" [disabled]="!editMode()">
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" class="form-control" [value]="auth.currentUser()?.email" disabled>
                  <span class="form-hint">Email cannot be changed</span>
                </div>
                <div class="form-group">
                  <label>Phone Number</label>
                  <input type="tel" class="form-control" [(ngModel)]="profileForm.phone" [disabled]="!editMode()" placeholder="0300-1234567">
                </div>
                <div class="form-group">
                  <label>CNIC</label>
                  <input type="text" class="form-control" [(ngModel)]="profileForm.cnic" [disabled]="!editMode()" placeholder="35202-1234567-8">
                </div>
                <div class="form-group full-col">
                  <label>Address</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="profileForm.address" [disabled]="!editMode()" placeholder="Your address"></textarea>
                </div>
              </div>
              <div class="form-actions" *ngIf="editMode()">
                <button class="btn btn-secondary" (click)="editMode.set(false)">Cancel</button>
                <button class="btn btn-primary" (click)="saveProfile()" [disabled]="saving()">
                  <span class="material-icons">save</span>
                  {{ saving() ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Change Password -->
          <div class="form-card">
            <div class="form-card-header">
              <h3><span class="material-icons">lock</span> Change Password</h3>
            </div>
            <div class="form-card-body">
              <div class="form-group">
                <label>New Password</label>
                <div class="pwd-wrap">
                  <input [type]="showPwd() ? 'text' : 'password'" class="form-control" [(ngModel)]="pwdForm.newPwd" placeholder="New password">
                  <button type="button" class="pwd-toggle" (click)="showPwd.update(v => !v)">
                    <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <input [type]="showPwd() ? 'text' : 'password'" class="form-control" [(ngModel)]="pwdForm.confirmPwd" placeholder="Confirm password">
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" (click)="changePassword()" [disabled]="changingPwd()">
                  <span class="material-icons">lock_reset</span>
                  {{ changingPwd() ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .m-profile { animation: fadeIn 0.3s ease; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; color: #2A1F14; }
    .page-header p { font-size: 14px; color: #93785B; }

    .profile-layout { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }

    .profile-card { background: white; border-radius: 12px; border: 1px solid #E2D8CE; overflow: hidden; box-shadow: 0 1px 4px rgba(62,54,46,0.06); }
    .profile-cover { height: 80px; background: linear-gradient(135deg, #3E362E 0%, #865D36 60%, #AC8968 100%); }
    .profile-body { padding: 0 20px 24px; text-align: center; }
    .avatar-wrap { margin-top: -36px; margin-bottom: 12px; }
    .profile-avatar { width: 72px; height: 72px; background: linear-gradient(135deg, #865D36, #AC8968); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; color: white; border: 4px solid white; box-shadow: 0 2px 8px rgba(62,54,46,0.2); }
    .profile-body h2 { font-size: 18px; font-weight: 700; margin: 0 0 4px; color: #2A1F14; }
    .profile-email { font-size: 13px; color: #93785B; margin: 0 0 12px; }
    .member-badge { display: inline-flex; align-items: center; gap: 4px; background: #F0E8DF; color: #865D36; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; .material-icons { font-size: 14px; } }

    .forms-col { display: flex; flex-direction: column; gap: 20px; }
    .form-card { background: white; border-radius: 12px; border: 1px solid #E2D8CE; overflow: hidden; box-shadow: 0 1px 4px rgba(62,54,46,0.06); }
    .form-card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #F0EBE4; }
    .form-card-header h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; margin: 0; color: #2A1F14; .material-icons { font-size: 18px; color: #865D36; } }
    .form-card-body { padding: 20px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-col { grid-column: 1 / -1; }
    .form-group { }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #4E3D2E; margin-bottom: 6px; }
    .form-hint { font-size: 12px; color: #93785B; margin-top: 4px; display: block; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 1px solid #F0EBE4; }

    .form-control { width: 100%; padding: 10px 14px; border: 1.5px solid #E2D8CE; border-radius: 8px; font-size: 14px; color: #2A1F14; background: white; outline: none; font-family: inherit; transition: all 0.2s; &:focus { border-color: #865D36; box-shadow: 0 0 0 3px rgba(134,93,54,0.12); } &::placeholder { color: #A69080; } &:disabled { background: #FAF7F4; color: #93785B; cursor: not-allowed; } }
    textarea.form-control { resize: vertical; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: #865D36; color: white; &:hover:not(:disabled) { background: #6B4A28; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-secondary { background: #F0EBE4; color: #4E3D2E; &:hover { background: #E2D8CE; } }
    .btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: none; background: none; color: #6B5544; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; &:hover { background: #F0EBE4; } .material-icons { font-size: 16px; } }

    .pwd-wrap { position: relative; display: flex; align-items: center; }
    .pwd-wrap .form-control { padding-right: 44px; }
    .pwd-toggle { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: #A69080; display: flex; .material-icons { font-size: 18px; } &:hover { color: #6B5544; } }

    @media (max-width: 1024px) { .profile-layout { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .full-col { grid-column: 1; } }
  `]
})
export class MemberProfileComponent implements OnInit {
  editMode = signal(false);
  saving = signal(false);
  changingPwd = signal(false);
  showPwd = signal(false);

  profileForm = { name: '', phone: '', cnic: '', address: '' };
  pwdForm = { newPwd: '', confirmPwd: '' };

  constructor(public auth: AuthService, private memberData: MemberDataService, private supabase: SupabaseService, private toast: ToastService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    const u = this.auth.currentUser();
    this.profileForm = { name: u?.name || '', phone: u?.phone || '', cnic: u?.cnic || '', address: u?.address || '' };
  }

  getInitials(): string {
    const n = this.auth.currentUser()?.name || 'U';
    return n.split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2);
  }

  async saveProfile() {
    this.saving.set(true);
    try {
      await this.memberData.updateProfile(this.profileForm);
      this.toast.success('Profile updated successfully');
      this.editMode.set(false);
    } catch (e: any) { this.toast.error('Failed: ' + (e?.message || '')); }
    finally { this.saving.set(false); }
  }

  async changePassword() {
    if (!this.pwdForm.newPwd || this.pwdForm.newPwd.length < 6) { this.toast.error('Password must be at least 6 characters'); return; }
    if (this.pwdForm.newPwd !== this.pwdForm.confirmPwd) { this.toast.error('Passwords do not match'); return; }
    this.changingPwd.set(true);
    try {
      const { error } = await this.supabase.client.auth.updateUser({ password: this.pwdForm.newPwd });
      if (error) throw new Error(error.message);
      this.toast.success('Password updated successfully');
      this.pwdForm = { newPwd: '', confirmPwd: '' };
    } catch (e: any) { this.toast.error('Failed: ' + (e?.message || '')); }
    finally { this.changingPwd.set(false); }
  }
}
