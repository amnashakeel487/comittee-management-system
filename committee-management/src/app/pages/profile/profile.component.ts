import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { SupabaseService } from '../../services/supabase.service';

interface PaymentAccount {
  id?: string;
  account_type: string;
  account_title: string;
  account_number: string;
  bank_name: string;
  iban: string;
  is_primary: boolean;
  is_active: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <div class="page-title">
          <h1>My Profile</h1>
          <p>Manage your account information and payment details</p>
        </div>
      </div>

      <div class="profile-layout">
        <!-- Profile Card -->
        <div class="card profile-card">
          <div class="profile-cover"></div>
          <div class="profile-info">
            <div class="profile-avatar-wrapper">
              <div class="avatar avatar-xl profile-avatar">{{ getInitials() }}</div>
            </div>
            <h2 class="profile-name">{{ auth.currentUser()?.name || 'User' }}</h2>
            <p class="profile-email">{{ auth.currentUser()?.email || '' }}</p>
            <span class="badge badge-primary profile-role">
              <span class="material-icons" style="font-size:12px">admin_panel_settings</span>
              Committee Admin
            </span>
          </div>
        </div>

        <!-- Edit Forms -->
        <div class="profile-forms">
          <!-- Personal Info -->
          <div class="card">
            <div class="card-header">
              <h3><span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">person</span>Personal Information</h3>
              <button class="btn btn-ghost btn-sm" (click)="editMode.set(!editMode())">
                <span class="material-icons">{{ editMode() ? 'close' : 'edit' }}</span>
                {{ editMode() ? 'Cancel' : 'Edit' }}
              </button>
            </div>
            <div class="card-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" class="form-control" [(ngModel)]="profileForm.name" [disabled]="!editMode()" placeholder="Your full name">
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" class="form-control" [(ngModel)]="profileForm.email" [disabled]="true">
                  <span class="form-hint">Email cannot be changed</span>
                </div>
                <div class="form-group">
                  <label>Phone Number</label>
                  <input type="tel" class="form-control" [(ngModel)]="profileForm.phone" [disabled]="!editMode()" placeholder="0300-1234567">
                </div>
                <div class="form-group">
                  <label>City</label>
                  <input type="text" class="form-control" [(ngModel)]="profileForm.city" [disabled]="!editMode()" placeholder="Lahore">
                </div>
                <div class="form-group full-width">
                  <label>Address</label>
                  <textarea class="form-control" [(ngModel)]="profileForm.address" [disabled]="!editMode()" rows="2"></textarea>
                </div>
              </div>
              <div class="form-actions" *ngIf="editMode()">
                <button class="btn btn-secondary" (click)="editMode.set(false)">Cancel</button>
                <button class="btn btn-primary" (click)="saveProfile()" [disabled]="saving()">
                  <span class="material-icons">save</span> {{ saving() ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </div>

          <!-- ── PAYMENT ACCOUNTS ─────────────────────────────── -->
          <div class="card">
            <div class="card-header">
              <h3>
                <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">account_balance</span>
                Payment Accounts
                <span class="accounts-hint">Shown to members when they submit payments</span>
              </h3>
              <button class="btn btn-primary btn-sm" (click)="openAccountModal()">
                <span class="material-icons">add</span> Add Account
              </button>
            </div>
            <div class="card-body" style="padding:0">

              <div *ngIf="loadingAccounts()" class="loading-accounts">
                <div class="spinner" style="width:28px;height:28px;border-width:2px"></div>
              </div>

              <div *ngIf="!loadingAccounts() && paymentAccounts().length === 0" class="no-accounts">
                <span class="material-icons">account_balance_wallet</span>
                <p>No payment accounts added yet.</p>
                <p class="hint">Add your bank or wallet details so members know where to send payments.</p>
              </div>

              <div class="accounts-list" *ngIf="!loadingAccounts() && paymentAccounts().length > 0">
                <div *ngFor="let acc of paymentAccounts()" class="account-row" [class.primary-row]="acc.is_primary" [class.inactive-row]="!acc.is_active">
                  <div class="acc-type-icon" [ngClass]="'type-' + acc.account_type">
                    <span class="material-icons">{{ getAccountIcon(acc.account_type) }}</span>
                  </div>
                  <div class="acc-details">
                    <div class="acc-title-row">
                      <span class="acc-title">{{ acc.account_title }}</span>
                      <span class="primary-badge" *ngIf="acc.is_primary">Primary</span>
                      <span class="inactive-badge" *ngIf="!acc.is_active">Inactive</span>
                    </div>
                    <span class="acc-type-label">{{ getAccountTypeLabel(acc.account_type) }}</span>
                    <span class="acc-number">{{ acc.account_number }}</span>
                    <span class="acc-bank" *ngIf="acc.bank_name">{{ acc.bank_name }}</span>
                    <span class="acc-iban" *ngIf="acc.iban">IBAN: {{ acc.iban }}</span>
                  </div>
                  <div class="acc-actions">
                    <button class="icon-btn" (click)="editAccount(acc)" title="Edit">
                      <span class="material-icons">edit</span>
                    </button>
                    <button class="icon-btn" (click)="togglePrimary(acc)" title="Set as primary" *ngIf="!acc.is_primary">
                      <span class="material-icons">star_border</span>
                    </button>
                    <button class="icon-btn danger" (click)="deleteAccount(acc)" title="Delete">
                      <span class="material-icons">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Change Password -->
          <div class="card">
            <div class="card-header">
              <h3><span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">lock</span>Change Password</h3>
            </div>
            <div class="card-body">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>New Password</label>
                  <div class="password-input">
                    <input [type]="showNewPwd() ? 'text' : 'password'" class="form-control" [(ngModel)]="passwordForm.new" placeholder="New password">
                    <button class="pwd-toggle" (click)="showNewPwd.update(v => !v)"><span class="material-icons">{{ showNewPwd() ? 'visibility_off' : 'visibility' }}</span></button>
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>Confirm New Password</label>
                  <div class="password-input">
                    <input [type]="showConfirmPwd() ? 'text' : 'password'" class="form-control" [(ngModel)]="passwordForm.confirm" placeholder="Confirm new password">
                    <button class="pwd-toggle" (click)="showConfirmPwd.update(v => !v)"><span class="material-icons">{{ showConfirmPwd() ? 'visibility_off' : 'visibility' }}</span></button>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" (click)="changePassword()" [disabled]="changingPwd()">
                  <span class="material-icons">lock_reset</span> {{ changingPwd() ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ADD/EDIT ACCOUNT MODAL ──────────────────────────────── -->
    <div class="modal-overlay" *ngIf="showAccountModal()" (click)="closeAccountModal()">
      <div class="modal" (click)="$event.stopPropagation()" style="max-width:520px">
        <div class="modal-header">
          <h3>
            <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">account_balance</span>
            {{ editingAccount() ? 'Edit' : 'Add' }} Payment Account
          </h3>
          <button class="btn btn-ghost btn-icon" (click)="closeAccountModal()"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Account Type *</label>
              <select class="form-control" [(ngModel)]="accountForm.account_type">
                <option value="bank">Bank Account</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="nayapay">NayaPay</option>
                <option value="sadapay">SadaPay</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Account Title / Name *</label>
              <input type="text" class="form-control" [(ngModel)]="accountForm.account_title" placeholder="e.g. Muhammad Ali">
            </div>
            <div class="form-group">
              <label>Account Number / Phone *</label>
              <input type="text" class="form-control" [(ngModel)]="accountForm.account_number" placeholder="e.g. 0300-1234567 or 1234567890">
            </div>
            <div class="form-group" *ngIf="accountForm.account_type === 'bank'">
              <label>Bank Name</label>
              <input type="text" class="form-control" [(ngModel)]="accountForm.bank_name" placeholder="e.g. HBL, MCB, UBL">
            </div>
            <div class="form-group full-width" *ngIf="accountForm.account_type === 'bank'">
              <label>IBAN (Optional)</label>
              <input type="text" class="form-control" [(ngModel)]="accountForm.iban" placeholder="PK36SCBL0000001123456702">
            </div>
            <div class="form-group full-width">
              <label class="checkbox-row">
                <input type="checkbox" [(ngModel)]="accountForm.is_primary">
                <span>Set as primary account</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeAccountModal()">Cancel</button>
          <button class="btn btn-primary" (click)="saveAccount()" [disabled]="savingAccount()">
            <span class="material-icons">{{ savingAccount() ? 'hourglass_empty' : 'save' }}</span>
            {{ savingAccount() ? 'Saving...' : 'Save Account' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { animation: fadeIn 0.3s ease; }
    .profile-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }

    .profile-card { overflow: hidden; }
    .profile-cover { height: 90px; background: linear-gradient(135deg, #1E3A5F, #1E3A5F, #3B82F6); }
    .profile-info { padding: 0 24px 24px; text-align: center; }
    .profile-avatar-wrapper { position: relative; display: inline-block; margin-top: -40px; margin-bottom: 12px; }
    .profile-avatar { background: linear-gradient(135deg, #1E3A5F, #3B82F6); border: 4px solid white; box-shadow: 0 4px 12px rgba(15,23,42,0.2); font-size: 28px; }
    .profile-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .profile-email { font-size: 13px; color: var(--gray-500); margin-bottom: 12px; }
    .profile-role { margin-bottom: 0; }

    .profile-forms { display: flex; flex-direction: column; gap: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .full-width { grid-column: 1 / -1; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; padding-top: 16px; border-top: 1px solid var(--gray-200); }

    /* Payment Accounts */
    .accounts-hint { font-size: 11px; font-weight: 400; color: var(--gray-400); margin-left: 8px; }
    .loading-accounts { display: flex; justify-content: center; padding: 32px; }
    .no-accounts { text-align: center; padding: 40px 24px; .material-icons { font-size: 44px; color: var(--gray-300); display: block; margin-bottom: 12px; } p { font-size: 14px; color: var(--gray-500); margin: 0 0 4px; } .hint { font-size: 12px; color: var(--gray-400); } }

    .accounts-list { display: flex; flex-direction: column; }
    .account-row {
      display: flex; align-items: center; gap: 14px; padding: 16px 20px;
      border-bottom: 1px solid var(--gray-100); transition: background 0.15s;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--gray-50); }
      &.primary-row { background: #EEF3FA; border-left: 3px solid #1E3A5F; }
      &.inactive-row { opacity: 0.55; }
    }

    .acc-type-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { font-size: 22px; } }
    .type-bank { background: #dbeafe; .material-icons { color: #2563eb; } }
    .type-easypaisa { background: #d1fae5; .material-icons { color: #059669; } }
    .type-jazzcash { background: #fef3c7; .material-icons { color: #d97706; } }
    .type-nayapay { background: #ede9fe; .material-icons { color: #7c3aed; } }
    .type-sadapay { background: #fee2e2; .material-icons { color: #dc2626; } }
    .type-other { background: #EEF3FA; .material-icons { color: #1E3A5F; } }

    .acc-details { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .acc-title-row { display: flex; align-items: center; gap: 8px; }
    .acc-title { font-size: 15px; font-weight: 700; color: var(--gray-900); }
    .primary-badge { background: #1E3A5F; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .inactive-badge { background: var(--gray-200); color: var(--gray-500); font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .acc-type-label { font-size: 11px; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em; }
    .acc-number { font-size: 14px; font-weight: 600; color: var(--gray-700); font-family: monospace; }
    .acc-bank { font-size: 12px; color: var(--gray-500); }
    .acc-iban { font-size: 11px; color: var(--gray-400); font-family: monospace; }

    .acc-actions { display: flex; gap: 4px; }
    .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--gray-400); transition: all 0.15s; .material-icons { font-size: 18px; } &:hover { background: var(--gray-100); color: var(--gray-700); } &.danger:hover { background: #fee2e2; color: var(--danger); } }

    /* Password */
    .password-input { position: relative; display: flex; align-items: center; }
    .password-input .form-control { padding-right: 44px; }
    .pwd-toggle { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: var(--gray-400); display: flex; .material-icons { font-size: 18px; } &:hover { color: var(--gray-600); } }

    /* Modal */
    .checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--gray-700); cursor: pointer; input { width: 16px; height: 16px; accent-color: #1E3A5F; } }

    @media (max-width: 1024px) { .profile-layout { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .full-width { grid-column: 1; } }
  `]
})
export class ProfileComponent implements OnInit {
  editMode = signal(false);
  saving = signal(false);
  changingPwd = signal(false);
  showNewPwd = signal(false);
  showConfirmPwd = signal(false);

  // Payment accounts
  loadingAccounts = signal(true);
  paymentAccounts = signal<PaymentAccount[]>([]);
  showAccountModal = signal(false);
  savingAccount = signal(false);
  editingAccount = signal<PaymentAccount | null>(null);

  profileForm = { name: '', email: '', phone: '', city: '', address: '' };
  passwordForm = { new: '', confirm: '' };
  accountForm: PaymentAccount = this.emptyAccountForm();

  constructor(
    public auth: AuthService,
    private toast: ToastService,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.name = user.name;
      this.profileForm.email = user.email;
      this.profileForm.phone = user.phone || '';
    }
    await this.loadAccounts();
  }

  private emptyAccountForm(): PaymentAccount {
    return { account_type: 'bank', account_title: '', account_number: '', bank_name: '', iban: '', is_primary: false, is_active: true };
  }

  async loadAccounts() {
    this.loadingAccounts.set(true);
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return;
      const { data, error } = await this.supabase.client
        .from('payment_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at');
      if (error) throw error;
      this.paymentAccounts.set(data || []);
    } catch (e: any) {
      this.toast.error('Failed to load accounts: ' + (e?.message || ''));
    } finally {
      this.loadingAccounts.set(false);
    }
  }

  openAccountModal(acc?: PaymentAccount) {
    this.editingAccount.set(acc || null);
    this.accountForm = acc
      ? { ...acc }
      : this.emptyAccountForm();
    this.showAccountModal.set(true);
  }

  editAccount(acc: PaymentAccount) { this.openAccountModal(acc); }

  closeAccountModal() {
    this.showAccountModal.set(false);
    this.editingAccount.set(null);
    this.accountForm = this.emptyAccountForm();
  }

  async saveAccount() {
    if (!this.accountForm.account_title || !this.accountForm.account_number) {
      this.toast.error('Account title and number are required');
      return;
    }
    this.savingAccount.set(true);
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) throw new Error('Not authenticated');

      // If setting as primary, unset others first
      if (this.accountForm.is_primary) {
        await this.supabase.client
          .from('payment_accounts')
          .update({ is_primary: false })
          .eq('user_id', userId);
      }

      if (this.editingAccount()?.id) {
        // Update
        const { error } = await this.supabase.client
          .from('payment_accounts')
          .update({
            account_type: this.accountForm.account_type,
            account_title: this.accountForm.account_title,
            account_number: this.accountForm.account_number,
            bank_name: this.accountForm.bank_name || null,
            iban: this.accountForm.iban || null,
            is_primary: this.accountForm.is_primary,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.editingAccount()!.id!);
        if (error) throw error;
        this.toast.success('Account updated');
      } else {
        // Insert
        const { error } = await this.supabase.client
          .from('payment_accounts')
          .insert({
            user_id: userId,
            account_type: this.accountForm.account_type,
            account_title: this.accountForm.account_title,
            account_number: this.accountForm.account_number,
            bank_name: this.accountForm.bank_name || null,
            iban: this.accountForm.iban || null,
            is_primary: this.accountForm.is_primary,
            is_active: true
          });
        if (error) throw error;
        this.toast.success('Account added');
      }

      await this.loadAccounts();
      this.closeAccountModal();
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.savingAccount.set(false);
    }
  }

  async togglePrimary(acc: PaymentAccount) {
    try {
      const userId = this.auth.currentUser()?.id;
      // Unset all, then set this one
      await this.supabase.client.from('payment_accounts').update({ is_primary: false }).eq('user_id', userId);
      await this.supabase.client.from('payment_accounts').update({ is_primary: true }).eq('id', acc.id!);
      await this.loadAccounts();
      this.toast.success('Primary account updated');
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    }
  }

  async deleteAccount(acc: PaymentAccount) {
    if (!confirm(`Delete account "${acc.account_title}"?`)) return;
    try {
      await this.supabase.client.from('payment_accounts').delete().eq('id', acc.id!);
      this.paymentAccounts.update(list => list.filter(a => a.id !== acc.id));
      this.toast.success('Account deleted');
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    }
  }

  getAccountIcon(type: string): string {
    return { bank: 'account_balance', easypaisa: 'phone_android', jazzcash: 'phone_android', nayapay: 'credit_card', sadapay: 'credit_card', other: 'payments' }[type] || 'payments';
  }

  getAccountTypeLabel(type: string): string {
    return { bank: 'Bank Account', easypaisa: 'EasyPaisa', jazzcash: 'JazzCash', nayapay: 'NayaPay', sadapay: 'SadaPay', other: 'Other' }[type] || type;
  }

  getInitials(): string {
    const name = this.auth.currentUser()?.name || 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  async saveProfile() {
    this.saving.set(true);
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) throw new Error('Not authenticated');
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ name: this.profileForm.name, phone: this.profileForm.phone, address: this.profileForm.address })
        .eq('id', userId);
      if (error) throw error;
      this.toast.success('Profile updated successfully');
      this.editMode.set(false);
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.saving.set(false);
    }
  }

  async changePassword() {
    if (!this.passwordForm.new || this.passwordForm.new.length < 6) { this.toast.error('Password must be at least 6 characters'); return; }
    if (this.passwordForm.new !== this.passwordForm.confirm) { this.toast.error('Passwords do not match'); return; }
    this.changingPwd.set(true);
    try {
      const { error } = await this.supabase.client.auth.updateUser({ password: this.passwordForm.new });
      if (error) throw error;
      this.passwordForm = { new: '', confirm: '' };
      this.toast.success('Password updated successfully');
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.changingPwd.set(false);
    }
  }
}
