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
    .auth-page { min-height: 100vh; display: flex; background: #020b18; color: #fff; font-family: 'Inter', 'DM Sans', sans-serif; }

    /* LEFT PANEL */
    .auth-left {
      flex: 1;
      background: linear-gradient(160deg, #020b18 0%, #0a2540 55%, #0e3460 100%);
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      border-right: 1px solid rgba(255,255,255,0.06);
    }
    .auth-left::before {
      content: '';
      position: absolute;
      top: -100px; right: -100px;
      width: 400px; height: 400px;
      background: rgba(45,140,255,0.05);
      border-radius: 50%;
    }
    .auth-brand { position: relative; z-index: 1; }
    .brand-icon {
      width: 56px; height: 56px;
      background: rgba(45,140,255,0.15);
      border: 1px solid rgba(45,140,255,0.3);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
    }
    .brand-icon .material-icons { color: #5aabff; font-size: 28px; }
    .auth-brand h1 { font-size: 28px; font-weight: 800; color: white; margin-bottom: 6px; }
    .auth-brand p { font-size: 15px; color: rgba(255,255,255,0.55); }

    .auth-illustration { position: relative; z-index: 1; }
    .illustration-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(45,140,255,0.2);
      border-radius: 16px;
      padding: 24px;
    }
    .ill-header {
      display: flex; align-items: center; gap: 10px;
      color: white; font-size: 15px; font-weight: 600;
      margin-bottom: 20px;
    }
    .ill-header .material-icons { font-size: 20px; color: #5aabff; }
    .ill-stats { display: flex; gap: 24px; margin-bottom: 20px; }
    .ill-val { display: block; font-size: 20px; font-weight: 700; color: white; }
    .ill-label { display: block; font-size: 12px; color: rgba(255,255,255,0.5); }
    .ill-progress { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 8px; }
    .ill-progress-bar { height: 100%; background: linear-gradient(90deg, #2d8cff, #5aabff); border-radius: 3px; }
    .ill-month { font-size: 12px; color: rgba(255,255,255,0.4); }

    .auth-footer-text { position: relative; z-index: 1; }
    .auth-footer-text p { font-size: 13px; color: rgba(255,255,255,0.35); }

    /* RIGHT PANEL */
    .auth-right {
      width: 500px;
      display: flex; align-items: center; justify-content: center;
      padding: 40px;
      background: rgba(5,21,39,0.95);
    }
    .auth-card {
      width: 100%; max-width: 420px;
      background: rgba(10,37,64,0.8);
      border: 1px solid rgba(45,140,255,0.2);
      border-radius: 20px;
      padding: 36px;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .auth-card-header { margin-bottom: 24px; }
    .auth-card-header h2 { font-size: 24px; font-weight: 800; color: white; margin-bottom: 4px; }
    .auth-card-header p { font-size: 14px; color: rgba(255,255,255,0.45); }

    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 6px; }

    .input-icon-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 12px; color: rgba(255,255,255,0.3); font-size: 18px; z-index: 1; }
    .input-icon-wrap .form-control { padding-left: 42px; padding-right: 44px; }

    .form-control {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 11px 14px;
      color: white;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-control:focus { border-color: rgba(45,140,255,0.5); box-shadow: 0 0 0 3px rgba(45,140,255,0.1); }
    .form-control::placeholder { color: rgba(255,255,255,0.2); }
    .form-control.error { border-color: rgba(239,68,68,0.5); }

    .pwd-toggle {
      position: absolute; right: 12px;
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.3); display: flex;
    }
    .pwd-toggle .material-icons { font-size: 18px; }
    .pwd-toggle:hover { color: rgba(255,255,255,0.7); }

    .form-error {
      font-size: 12px; color: #f87171;
      margin-top: 4px; display: flex; align-items: center; gap: 4px;
    }

    .terms-row { margin-bottom: 12px; }
    .checkbox-label {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 13px; color: rgba(255,255,255,0.55);
      cursor: pointer; line-height: 1.5;
    }
    .checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #2d8cff; flex-shrink: 0; margin-top: 2px; }
    .terms-link { color: #2d8cff; text-decoration: none; }
    .terms-link:hover { text-decoration: underline; }

    .form-error-msg {
      display: flex; align-items: center; gap: 8px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px; padding: 10px 14px;
      font-size: 13px; color: #f87171; margin-bottom: 8px;
    }
    .form-error-msg .material-icons { font-size: 16px; }

    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .btn-primary { background: #2d8cff; color: white; border-radius: 50px; }
    .btn-primary:hover:not(:disabled) { background: #5aabff; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(45,140,255,0.3); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-full { width: 100%; padding: 13px; font-size: 15px; font-weight: 700; }

    .btn-spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-card-footer {
      text-align: center; margin-top: 20px;
      padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.06);
    }
    .auth-card-footer p { font-size: 14px; color: rgba(255,255,255,0.45); }
    .auth-card-footer a { color: #2d8cff; font-weight: 600; text-decoration: none; }
    .auth-card-footer a:hover { text-decoration: underline; }

    @media (max-width: 1024px) { .auth-left { display: none; } .auth-right { width: 100%; background: #020b18; } }
    @media (max-width: 480px) { .auth-right { padding: 20px; } .auth-card { padding: 24px 20px; } }
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
