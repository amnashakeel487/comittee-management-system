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
    .auth-page { min-height: 100vh; display: flex; }

    .auth-left {
      flex: 1;
      background: linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%);
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -100px;
        right: -100px;
        width: 400px;
        height: 400px;
        background: rgba(255,255,255,0.05);
        border-radius: 50%;
      }
    }

    .auth-brand {
      position: relative;
      z-index: 1;
    }

    .brand-icon {
      width: 60px;
      height: 60px;
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      .material-icons { color: white; font-size: 30px; }
    }

    .auth-brand h1 { font-size: 32px; font-weight: 800; color: white; margin-bottom: 8px; }
    .auth-brand p { font-size: 16px; color: rgba(255,255,255,0.7); }

    .auth-illustration {
      position: relative;
      z-index: 1;
    }

    .illustration-card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 16px;
      padding: 24px;
    }

    .ill-header {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
      .material-icons { font-size: 22px; }
    }

    .ill-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
    }

    .ill-stat { }
    .ill-val { display: block; font-size: 20px; font-weight: 700; color: white; }
    .ill-label { display: block; font-size: 12px; color: rgba(255,255,255,0.6); }

    .ill-progress {
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .ill-progress-bar {
      height: 100%;
      background: white;
      border-radius: 4px;
    }

    .ill-month { font-size: 12px; color: rgba(255,255,255,0.6); }

    .auth-footer-text {
      position: relative;
      z-index: 1;
      p { font-size: 13px; color: rgba(255,255,255,0.5); }
    }

    .auth-right {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: var(--gray-50);
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: var(--shadow-xl);
    }

    .auth-card-header {
      margin-bottom: 28px;
      h2 { font-size: 26px; font-weight: 800; color: var(--gray-900); margin-bottom: 6px; }
      p { font-size: 14px; color: var(--gray-500); }
    }

    .auth-form { display: flex; flex-direction: column; gap: 4px; }

    .form-group {
      margin-bottom: 14px;
      label { display: block; font-size: 13px; font-weight: 600; color: var(--gray-700); margin-bottom: 6px; }
    }

    .input-icon-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      color: var(--gray-400);
      font-size: 18px;
      z-index: 1;
    }

    .input-icon-wrap .form-control { padding-left: 42px; padding-right: 44px; }

    .pwd-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--gray-400);
      display: flex;
      .material-icons { font-size: 18px; }
    }

    .form-control.error { border-color: var(--danger); }

    .terms-row { margin-bottom: 12px; }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: var(--gray-600);
      cursor: pointer;
      line-height: 1.5;

      input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--primary); flex-shrink: 0; margin-top: 2px; }
    }

    .terms-link { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } }

    .form-error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fee2e2;
      border-radius: 8px;
      color: #991b1b;
      font-size: 13px;
      margin-bottom: 8px;
      .material-icons { font-size: 18px; }
    }

    .btn-full { width: 100%; justify-content: center; padding: 12px; font-size: 15px; }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .auth-card-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--gray-200);
      p { font-size: 14px; color: var(--gray-600); }
      a { color: var(--primary); font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } }
    }

    @media (max-width: 1024px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; }
    }
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
