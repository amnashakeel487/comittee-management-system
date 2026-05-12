import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-super-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="sa-login-page">
  <div class="sa-login-bg"></div>

  <div class="sa-login-card">
    <!-- Header -->
    <div class="sa-login-header">
      <div class="sa-login-icon">
        <span class="material-icons">shield</span>
      </div>
      <h1>Super Admin</h1>
      <p>Platform Control Center</p>
      <div class="sa-login-badge">🔒 Restricted Access</div>
    </div>

    <!-- Form -->
    <form (ngSubmit)="onLogin()" class="sa-login-form">
      <div class="sa-form-group">
        <label>Admin Email</label>
        <div class="sa-input-wrap">
          <span class="material-icons sa-input-icon">email</span>
          <input type="email" [(ngModel)]="email" name="email"
                 placeholder="superadmin@domain.com" required
                 [class.error]="submitted() && !email">
        </div>
      </div>

      <div class="sa-form-group">
        <label>Password</label>
        <div class="sa-input-wrap">
          <span class="material-icons sa-input-icon">lock</span>
          <input [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="password" name="password"
                 placeholder="Enter password" required
                 [class.error]="submitted() && !password">
          <button type="button" class="sa-pwd-toggle" (click)="showPwd.update(v=>!v)">
            <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>
      </div>

      <div class="sa-error-msg" *ngIf="errorMsg()">
        <span class="material-icons">error</span> {{ errorMsg() }}
      </div>

      <button type="submit" class="sa-login-btn" [disabled]="loading()">
        <span class="material-icons" *ngIf="!loading()">login</span>
        <div class="sa-spinner" *ngIf="loading()"></div>
        {{ loading() ? 'Authenticating...' : 'Access Control Center' }}
      </button>
    </form>

    <div class="sa-login-footer">
      <a routerLink="/" class="sa-back-link">
        <span class="material-icons">arrow_back</span> Back to Home
      </a>
      <a routerLink="/auth/login" class="sa-back-link">Sub-Admin Login</a>
    </div>
  </div>
</div>
  `,
  styles: [`
    .sa-login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #020b18;
      position: relative;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }
    .sa-login-bg {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 60% 50% at 50% 50%, rgba(30,58,95,0.8) 0%, transparent 70%),
        radial-gradient(ellipse 30% 30% at 20% 80%, rgba(45,140,255,0.08) 0%, transparent 60%);
    }
    .sa-login-card {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 420px;
      background: rgba(10,37,64,0.9);
      border: 1px solid rgba(45,140,255,0.25);
      border-radius: 20px;
      padding: 40px;
      backdrop-filter: blur(20px);
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      margin: 20px;
    }
    .sa-login-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .sa-login-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #1E3A5F, #2563EB);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 8px 24px rgba(37,99,235,0.3);
      .material-icons { color: white; font-size: 32px; }
    }
    .sa-login-header h1 {
      font-size: 24px;
      font-weight: 800;
      color: white;
      margin-bottom: 4px;
    }
    .sa-login-header p {
      font-size: 14px;
      color: rgba(255,255,255,0.5);
      margin-bottom: 12px;
    }
    .sa-login-badge {
      display: inline-block;
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
      padding: 4px 12px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
    }
    .sa-login-form { display: flex; flex-direction: column; gap: 16px; }
    .sa-form-group { display: flex; flex-direction: column; gap: 6px; }
    .sa-form-group label {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
    }
    .sa-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .sa-input-icon {
      position: absolute;
      left: 12px;
      color: rgba(255,255,255,0.3);
      font-size: 18px;
      z-index: 1;
    }
    .sa-input-wrap input {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 11px 44px;
      color: white;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      &:focus { border-color: rgba(45,140,255,0.5); box-shadow: 0 0 0 3px rgba(45,140,255,0.1); }
      &::placeholder { color: rgba(255,255,255,0.2); }
      &.error { border-color: rgba(239,68,68,0.5); }
    }
    .sa-pwd-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.3);
      display: flex;
      .material-icons { font-size: 18px; }
      &:hover { color: rgba(255,255,255,0.7); }
    }
    .sa-error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #f87171;
      .material-icons { font-size: 16px; }
    }
    .sa-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 13px;
      background: linear-gradient(135deg, #1E3A5F, #2563EB);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 4px;
      .material-icons { font-size: 18px; }
      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,99,235,0.4); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .sa-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sa-login-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .sa-back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: rgba(255,255,255,0.35);
      text-decoration: none;
      transition: color 0.2s;
      .material-icons { font-size: 15px; }
      &:hover { color: rgba(255,255,255,0.7); }
    }
  `]
})
export class SuperAdminLoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  submitted = signal(false);
  showPwd = signal(false);
  errorMsg = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  async onLogin() {
    this.submitted.set(true);
    this.errorMsg.set('');
    if (!this.email || !this.password) return;

    this.loading.set(true);
    try {
      const result = await this.auth.login(this.email, this.password);
      if (result.success) {
        if (result.role === 'super_admin') {
          this.router.navigate(['/super-admin/dashboard']);
        } else {
          // Logged in but not super_admin — sign out and show error
          await this.auth.logout();
          this.errorMsg.set('🚫 Access denied. This portal is for Super Admins only.');
        }
      } else {
        this.errorMsg.set(result.error || 'Authentication failed');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
