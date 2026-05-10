import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page forgot-page">
      <div class="auth-left">
        <div class="auth-brand">
          <div class="brand-icon">
            <span class="material-icons">account_balance</span>
          </div>
          <h1>CommitteeHub</h1>
          <p>Reset your password securely</p>
        </div>
        <div class="lock-illustration">
          <div class="lock-icon">
            <span class="material-icons">lock_reset</span>
          </div>
          <h3>Forgot your password?</h3>
          <p>No worries! Enter your email and we'll send you a reset link.</p>
        </div>
        <div class="auth-footer-text">
          <p>Secure password reset via email</p>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <ng-container *ngIf="!sent()">
            <div class="auth-card-header">
              <div class="back-link">
                <a routerLink="/auth/login" class="btn btn-ghost btn-sm">
                  <span class="material-icons">arrow_back</span> Back to Login
                </a>
              </div>
              <h2>Reset Password</h2>
              <p>Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            <form (ngSubmit)="onSubmit()" class="auth-form">
              <div class="form-group">
                <label>Email Address</label>
                <div class="input-icon-wrap">
                  <span class="material-icons input-icon">email</span>
                  <input type="email" class="form-control" placeholder="you@example.com"
                         [(ngModel)]="email" name="email" required>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-full" [disabled]="loading()">
                <span class="material-icons" *ngIf="!loading()">send</span>
                <div class="btn-spinner" *ngIf="loading()"></div>
                {{ loading() ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </form>
          </ng-container>

          <ng-container *ngIf="sent()">
            <div class="success-state">
              <div class="success-icon">
                <span class="material-icons">mark_email_read</span>
              </div>
              <h2>Check your email</h2>
              <p>We've sent a password reset link to <strong>{{ email }}</strong></p>
              <p class="text-sm text-muted">Didn't receive it? Check your spam folder or try again.</p>
              <div class="success-actions">
                <button class="btn btn-outline" (click)="sent.set(false)">Try again</button>
                <a routerLink="/auth/login" class="btn btn-primary">Back to Login</a>
              </div>
            </div>
          </ng-container>

          <div class="auth-card-footer" *ngIf="!sent()">
            <p>Remember your password? <a routerLink="/auth/login">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; }

    .auth-left {
      flex: 1;
      background: linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%);
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .auth-brand {
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
      h1 { font-size: 32px; font-weight: 800; color: white; margin-bottom: 8px; }
      p { font-size: 16px; color: rgba(255,255,255,0.7); }
    }

    .lock-illustration {
      text-align: center;
      .lock-icon {
        width: 100px;
        height: 100px;
        background: rgba(255,255,255,0.15);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        .material-icons { font-size: 48px; color: white; }
      }
      h3 { font-size: 22px; font-weight: 700; color: white; margin-bottom: 12px; }
      p { font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.6; }
    }

    .auth-footer-text p { font-size: 13px; color: rgba(255,255,255,0.5); }

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

    .back-link { margin-bottom: 20px; }

    .auth-card-header {
      margin-bottom: 28px;
      h2 { font-size: 26px; font-weight: 800; color: var(--gray-900); margin-bottom: 8px; }
      p { font-size: 14px; color: var(--gray-500); line-height: 1.6; }
    }

    .auth-form { display: flex; flex-direction: column; gap: 16px; }

    .form-group {
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
    }

    .input-icon-wrap .form-control { padding-left: 42px; }

    .btn-full { width: 100%; justify-content: center; padding: 12px; font-size: 15px; }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .success-state {
      text-align: center;
      padding: 20px 0;

      .success-icon {
        width: 80px;
        height: 80px;
        background: var(--success-light);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        .material-icons { font-size: 40px; color: var(--success); }
      }

      h2 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
      p { font-size: 14px; color: var(--gray-600); margin-bottom: 8px; line-height: 1.6; }
    }

    .success-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }

    .auth-card-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--gray-200);
      p { font-size: 14px; color: var(--gray-600); }
      a { color: var(--primary); font-weight: 600; text-decoration: none; }
    }

    @media (max-width: 1024px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; }
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  sent = signal(false);

  constructor(private auth: AuthService, private toast: ToastService) {}

  async onSubmit() {
    if (!this.email) {
      this.toast.error('Please enter your email address');
      return;
    }
    this.loading.set(true);
    try {
      const result = await this.auth.forgotPassword(this.email);
      if (result.success) {
        this.sent.set(true);
      } else {
        this.toast.error(result.error || 'Failed to send reset email');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
