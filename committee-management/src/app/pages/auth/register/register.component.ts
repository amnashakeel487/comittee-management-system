import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <!-- Left Panel -->
      <div class="auth-left">
        <div class="auth-brand">
          <div class="brand-icon">
            <span class="material-icons">account_balance</span>
          </div>
          <h1>CommitteeHub</h1>
          <p>Join thousands of committee managers</p>
        </div>

        <div class="auth-illustration">
          <div class="illustration-card">
            <div class="ill-header">
              <span class="material-icons">groups</span>
              <span>Family Savings Circle</span>
            </div>
            <div class="ill-stats">
              <div class="ill-stat">
                <span class="ill-val">PKR 50,000</span>
                <span class="ill-label">Monthly Pool</span>
              </div>
              <div class="ill-stat">
                <span class="ill-val">10</span>
                <span class="ill-label">Members</span>
              </div>
            </div>
            <div class="ill-progress">
              <div class="ill-progress-bar" style="width:60%"></div>
            </div>
            <span class="ill-month">Month 6 of 10</span>
          </div>
        </div>

        <div class="auth-footer-text">
          <p>Free to use • Secure • Transparent</p>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-card-header">
            <h2>Create Account</h2>
            <p>Start managing your committees today</p>
          </div>

          <form (ngSubmit)="onRegister()" class="auth-form">
            <div class="form-group">
              <label>Full Name</label>
              <div class="input-icon-wrap">
                <span class="material-icons input-icon">person</span>
                <input type="text" class="form-control" placeholder="Your full name"
                       [(ngModel)]="name" name="name" required
                       [class.error]="submitted() && !name">
              </div>
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <div class="input-icon-wrap">
                <span class="material-icons input-icon">email</span>
                <input type="email" class="form-control" placeholder="you@example.com"
                       [(ngModel)]="email" name="email" required
                       [class.error]="submitted() && !email">
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-icon-wrap">
                <span class="material-icons input-icon">lock</span>
                <input [type]="showPwd() ? 'text' : 'password'" class="form-control"
                       placeholder="Create a strong password"
                       [(ngModel)]="password" name="password" required
                       [class.error]="submitted() && !password">
                <button type="button" class="pwd-toggle" (click)="showPwd.update(v => !v)">
                  <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Confirm Password</label>
              <div class="input-icon-wrap">
                <span class="material-icons input-icon">lock_reset</span>
                <input [type]="showConfirm() ? 'text' : 'password'" class="form-control"
                       placeholder="Confirm your password"
                       [(ngModel)]="confirmPassword" name="confirmPassword" required
                       [class.error]="submitted() && password !== confirmPassword">
                <button type="button" class="pwd-toggle" (click)="showConfirm.update(v => !v)">
                  <span class="material-icons">{{ showConfirm() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <span class="form-error" *ngIf="submitted() && password && confirmPassword && password !== confirmPassword">
                <span class="material-icons" style="font-size:14px">error</span> Passwords do not match
              </span>
            </div>

            <div class="terms-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="agreeTerms" name="agreeTerms">
                <span>I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a></span>
              </label>
            </div>

            <div class="form-error-msg" *ngIf="errorMsg()">
              <span class="material-icons">error</span>
              {{ errorMsg() }}
            </div>

            <button type="submit" class="btn btn-primary btn-full" [disabled]="loading()">
              <span class="material-icons" *ngIf="!loading()">person_add</span>
              <div class="btn-spinner" *ngIf="loading()"></div>
              {{ loading() ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>

          <div class="auth-card-footer">
            <p>Already have an account? <a routerLink="/auth/login">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; background: #060e1a; color: #f0f4ff; font-family: 'Plus Jakarta Sans','Inter',sans-serif; }

    /* LEFT */
    .auth-left { flex: 1; padding: 2.5rem 3.5rem; display: flex; flex-direction: column; background: linear-gradient(155deg, #0f2035 0%, #060e1a 60%); border-right: 1px solid rgba(255,255,255,0.06); }
    .auth-brand { margin-bottom: 3rem; }
    .brand-icon { width: 52px; height: 52px; background: rgba(45,140,255,0.15); border: 1px solid rgba(45,140,255,0.3); border-radius: 13px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .brand-icon .material-icons { color: #2d8cff; font-size: 26px; }
    .auth-brand h1 { font-size: 1.5rem; font-weight: 700; color: #f0f4ff; margin-bottom: 4px; }
    .auth-brand p { font-size: .85rem; color: rgba(240,244,255,0.5); }

    .auth-illustration { flex: 1; display: flex; align-items: center; }
    .illustration-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(45,140,255,0.2); border-radius: 14px; padding: 1.4rem; width: 100%; max-width: 380px; }
    .ill-header { display: flex; align-items: center; gap: 8px; color: #f0f4ff; font-size: .9rem; font-weight: 600; margin-bottom: 1.2rem; }
    .ill-header .material-icons { font-size: 18px; color: #2d8cff; }
    .ill-stats { display: flex; gap: 1.5rem; margin-bottom: 1.2rem; }
    .ill-val { display: block; font-size: 1.2rem; font-weight: 700; color: #f0f4ff; }
    .ill-label { display: block; font-size: .72rem; color: rgba(240,244,255,0.45); }
    .ill-progress { height: 5px; background: rgba(255,255,255,0.1); border-radius: 50px; margin-bottom: 6px; }
    .ill-progress-bar { height: 100%; background: #2d8cff; border-radius: 50px; }
    .ill-month { font-size: .72rem; color: rgba(240,244,255,0.4); }

    .auth-footer-text { margin-top: 2rem; }
    .auth-footer-text p { font-size: .75rem; color: rgba(240,244,255,0.35); }

    /* RIGHT */
    .auth-right { width: 480px; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #060e1a; }
    .auth-card { width: 100%; max-width: 420px; background: rgba(255,255,255,0.04); border: 1px solid rgba(45,140,255,0.25); border-radius: 16px; padding: 2rem; }
    .auth-card-header { margin-bottom: 1.5rem; }
    .auth-card-header h2 { font-size: 1.5rem; font-weight: 700; color: #f0f4ff; margin-bottom: 4px; }
    .auth-card-header p { font-size: .83rem; color: rgba(240,244,255,0.5); }

    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; font-size: .78rem; font-weight: 600; color: rgba(240,244,255,0.7); margin-bottom: 5px; }

    .input-icon-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 10px; color: rgba(240,244,255,0.3); font-size: 17px; z-index: 1; }
    .input-icon-wrap .form-control { padding-left: 2.4rem; padding-right: 2.4rem; }

    .form-control { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: .62rem .85rem; color: #f0f4ff; font-family: inherit; font-size: .875rem; outline: none; transition: border-color .2s; }
    .form-control:focus { border-color: rgba(45,140,255,0.5); }
    .form-control::placeholder { color: rgba(240,244,255,0.2); }
    .form-control.error { border-color: rgba(239,68,68,0.5); }

    .pwd-toggle { position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: rgba(240,244,255,0.3); display: flex; }
    .pwd-toggle .material-icons { font-size: 17px; }
    .pwd-toggle:hover { color: rgba(240,244,255,0.7); }

    .form-error { font-size: .75rem; color: #f87171; margin-top: 3px; display: flex; align-items: center; gap: 3px; }

    .terms-row { margin-bottom: 10px; }
    .checkbox-label { display: flex; align-items: flex-start; gap: 8px; font-size: .8rem; color: rgba(240,244,255,0.55); cursor: pointer; line-height: 1.5; }
    .checkbox-label input[type="checkbox"] { width: 15px; height: 15px; accent-color: #2d8cff; flex-shrink: 0; margin-top: 2px; }
    .terms-link { color: #2d8cff; text-decoration: none; }
    .terms-link:hover { text-decoration: underline; }

    .form-error-msg { display: flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: .65rem .9rem; font-size: .82rem; color: #f87171; margin-bottom: 8px; }
    .form-error-msg .material-icons { font-size: 16px; }

    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: none; cursor: pointer; font-family: inherit; transition: all .2s; }
    .btn-primary { background: #2d8cff; color: white; border-radius: 8px; }
    .btn-primary:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-full { width: 100%; padding: .75rem; font-size: .9rem; font-weight: 600; }

    .btn-spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-card-footer { text-align: center; margin-top: 1.2rem; padding-top: 1.1rem; border-top: 1px solid rgba(255,255,255,0.06); }
    .auth-card-footer p { font-size: .82rem; color: rgba(240,244,255,0.45); }
    .auth-card-footer a { color: #2d8cff; font-weight: 600; text-decoration: none; }
    .auth-card-footer a:hover { text-decoration: underline; }

    @media (max-width: 1024px) { .auth-left { display: none; } .auth-right { width: 100%; background: #060e1a; } }
    @media (max-width: 480px) { .auth-right { padding: 1rem; } .auth-card { padding: 1.5rem 1.25rem; } }
  `]
})
export class RegisterComponent {
  name = '';
  email = '';
  phone = '';
  cnic = '';
  password = '';
  confirmPassword = '';
  agreeTerms = false;
  loading = signal(false);
  submitted = signal(false);
  showPwd = signal(false);
  showConfirm = signal(false);
  errorMsg = signal('');

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  async onRegister() {
    this.submitted.set(true);
    this.errorMsg.set('');

    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.toast.error('Please fill all required fields');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMsg.set('Passwords do not match');
      return;
    }

    if (!this.agreeTerms) {
      this.toast.warning('Please agree to the terms and conditions');
      return;
    }

    this.loading.set(true);
    try {
      const result = await this.auth.register(this.email, this.password, this.name, this.phone, this.cnic);
      if (result.success) {
        this.toast.success('Account created! Please check your email to verify.');
        this.router.navigate(['/auth/login']);
      } else {
        this.errorMsg.set(result.error || 'Registration failed');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
