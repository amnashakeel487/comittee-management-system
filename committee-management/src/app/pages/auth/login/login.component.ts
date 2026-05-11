import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-login',
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
          <p>Your trusted ROSCA management platform</p>
        </div>

        <div class="auth-features">
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons">groups</span>
            </div>
            <div>
              <h4>Manage Committees</h4>
              <p>Create and manage multiple ROSCA committees effortlessly</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons">payments</span>
            </div>
            <div>
              <h4>Track Payments</h4>
              <p>Monitor all contributions and payment statuses in real-time</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons">account_balance_wallet</span>
            </div>
            <div>
              <h4>Automated Payouts</h4>
              <p>Schedule and release payouts with complete transparency</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons">bar_chart</span>
            </div>
            <div>
              <h4>Analytics & Reports</h4>
              <p>Get detailed insights into your committee performance</p>
            </div>
          </div>
        </div>

        <div class="auth-footer-text">
          <p>Trusted by 10,000+ committee managers across Pakistan</p>
        </div>

        <!-- Developer Credits -->
        <div class="dev-credits">
          <p class="dev-label">Designed & Developed by</p>
          <div class="dev-cards">
            <a href="https://muhammadabdullahcv.vercel.app/#/" target="_blank" rel="noopener" class="dev-card">
              <div class="dev-avatar">MA</div>
              <div class="dev-info">
                <span class="dev-name">Muhammad Abdullah</span>
                <span class="dev-role">Full Stack Developer</span>
              </div>
              <span class="material-icons dev-link-icon">open_in_new</span>
            </a>
            <a href="https://amnashakeel-portfolio.vercel.app/" target="_blank" rel="noopener" class="dev-card">
              <div class="dev-avatar">AS</div>
              <div class="dev-info">
                <span class="dev-name">Amna Shakeel</span>
                <span class="dev-role">Full Stack Developer</span>
              </div>
              <span class="material-icons dev-link-icon">open_in_new</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your CommitteeHub account</p>
          </div>

          <!-- Role Selector -->
          <div class="role-selector">
            <div class="role-card" [class.active]="selectedRole() === 'admin'" (click)="selectedRole.set('admin')">
              <div class="role-icon">
                <span class="material-icons">admin_panel_settings</span>
              </div>
              <div class="role-info">
                <span class="role-title">Admin</span>
                <span class="role-desc">Manage committees &amp; members</span>
              </div>
              <div class="role-check" *ngIf="selectedRole() === 'admin'">
                <span class="material-icons">check_circle</span>
              </div>
            </div>

            <div class="role-card" [class.active]="selectedRole() === 'member'" (click)="selectedRole.set('member')">
              <div class="role-icon">
                <span class="material-icons">person</span>
              </div>
              <div class="role-info">
                <span class="role-title">Member</span>
                <span class="role-desc">View your committee &amp; payments</span>
              </div>
              <div class="role-check" *ngIf="selectedRole() === 'member'">
                <span class="material-icons">check_circle</span>
              </div>
            </div>
          </div>

          <form (ngSubmit)="onLogin()" class="auth-form">
            <div class="form-group">
              <label>Email Address</label>
              <div class="input-icon-wrap">
                <span class="material-icons input-icon">email</span>
                <input type="email" class="form-control" placeholder="you@example.com"
                       [(ngModel)]="email" name="email" required
                       [class.error]="submitted() && !email">
              </div>
              <span class="form-error" *ngIf="submitted() && !email">
                <span class="material-icons" style="font-size:14px">error</span> Email is required
              </span>
            </div>

            <div class="form-group">
              <label>
                Password
                <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
              </label>
              <div class="input-icon-wrap">
                <span class="material-icons input-icon">lock</span>
                <input [type]="showPwd() ? 'text' : 'password'" class="form-control"
                       placeholder="Enter your password"
                       [(ngModel)]="password" name="password" required
                       [class.error]="submitted() && !password">
                <button type="button" class="pwd-toggle" (click)="showPwd.update(v => !v)">
                  <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <span class="form-error" *ngIf="submitted() && !password">
                <span class="material-icons" style="font-size:14px">error</span> Password is required
              </span>
            </div>

            <div class="remember-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
                <span>Remember me</span>
              </label>
            </div>

            <div class="form-error-msg" *ngIf="errorMsg()">
              <span class="material-icons">error</span>
              {{ errorMsg() }}
            </div>

            <button type="submit" class="btn btn-primary btn-full" [disabled]="loading()">
              <span class="material-icons" *ngIf="!loading()">login</span>
              <div class="btn-spinner" *ngIf="loading()"></div>
              {{ loading() ? 'Signing in...' : 'Sign In as ' + (selectedRole() === 'admin' ? 'Admin' : 'Member') }}
            </button>

            <div class="auth-divider">
              <span>or continue with demo</span>
            </div>

            <button type="button" class="btn btn-secondary btn-full" (click)="demoLogin()">
              <span class="material-icons">play_circle</span>
              Demo Login
            </button>
          </form>

          <div class="auth-card-footer">
            <p>Don't have an account? <a routerLink="/auth/register">Create one</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
    }

    .auth-left {
      flex: 1;
      background: linear-gradient(160deg, #0F172A 0%, #1E3A5F 55%, #2E5490 100%);
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
        background: rgba(255,255,255,0.04);
        border-radius: 50%;
      }

      &::after {
        content: '';
        position: absolute;
        bottom: -150px;
        left: -100px;
        width: 500px;
        height: 500px;
        background: rgba(255,255,255,0.03);
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
      background: rgba(255,255,255,0.15);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.25);

      .material-icons { color: white; font-size: 30px; }
    }

    .auth-brand h1 {
      font-size: 32px;
      font-weight: 800;
      color: white;
      margin-bottom: 8px;
    }

    .auth-brand p {
      font-size: 16px;
      color: rgba(255,255,255,0.7);
    }

    .auth-features {
      display: flex;
      flex-direction: column;
      gap: 24px;
      position: relative;
      z-index: 1;
    }

    .feature-item {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .feature-icon {
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.12);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);

      .material-icons { color: white; font-size: 20px; }
    }

    .feature-item h4 {
      font-size: 15px;
      font-weight: 600;
      color: white;
      margin-bottom: 4px;
    }

    .feature-item p {
      font-size: 13px;
      color: rgba(255,255,255,0.65);
      line-height: 1.5;
    }

    .auth-footer-text {
      position: relative;
      z-index: 1;
      p {
        font-size: 13px;
        color: rgba(255,255,255,0.5);
      }
    }

    .dev-credits {
      position: relative;
      z-index: 1;
      margin-top: 20px;
    }

    .dev-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: rgba(255,255,255,0.4);
      margin-bottom: 10px;
    }

    .dev-cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .dev-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.3);
        transform: translateY(-1px);
      }
    }

    .dev-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(255,255,255,0.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .dev-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .dev-name {
      font-size: 13px;
      font-weight: 600;
      color: white;
    }

    .dev-role {
      font-size: 11px;
      color: rgba(255,255,255,0.55);
    }

    .dev-link-icon {
      font-size: 14px;
      color: rgba(255,255,255,0.4);
    }

    .auth-right {
      width: 520px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: #F8FAFC;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(15,23,42,0.12);
      border: 1px solid #E2E8F0;
    }

    .auth-card-header {
      margin-bottom: 24px;
      h2 { font-size: 26px; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
      p { font-size: 14px; color: #64748B; }
    }

    /* ── Role Selector ── */
    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .role-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.18s ease;
      position: relative;
      background: white;

      &:hover {
        border-color: #1E3A5F;
        background: #EEF3FA;
      }

      &.active {
        border-color: #1E3A5F;
        background: #EEF3FA;
        box-shadow: 0 0 0 3px rgba(30,58,95,0.12);
      }
    }

    .role-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.18s;

      .material-icons { font-size: 20px; color: #2E5490; transition: color 0.18s; }
    }

    .role-card.active .role-icon {
      background: #1E3A5F;
      .material-icons { color: white; }
    }

    .role-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .role-title {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
    }

    .role-card.active .role-title {
      color: #1E3A5F;
    }

    .role-desc {
      font-size: 11px;
      color: #2E5490;
      line-height: 1.4;
      margin-top: 2px;
    }

    .role-check {
      position: absolute;
      top: 8px;
      right: 8px;
      .material-icons { font-size: 16px; color: #1E3A5F; }
    }

    /* ── Form ── */
    .auth-form { display: flex; flex-direction: column; gap: 4px; }

    .form-group {
      margin-bottom: 16px;

      label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 6px;
      }
    }

    .forgot-link {
      font-size: 12px;
      color: #1E3A5F;
      text-decoration: none;
      font-weight: 500;
      &:hover { text-decoration: underline; }
    }

    .input-icon-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      color: #94A3B8;
      font-size: 18px;
      z-index: 1;
    }

    .input-icon-wrap .form-control {
      padding-left: 42px;
      padding-right: 44px;
      border-color: #E2E8F0;
      color: #0F172A;

      &:focus {
        border-color: #1E3A5F;
        box-shadow: 0 0 0 3px rgba(30,58,95,0.12);
      }

      &::placeholder { color: #94A3B8; }
    }

    .pwd-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: #94A3B8;
      display: flex;
      .material-icons { font-size: 18px; }
      &:hover { color: #475569; }
    }

    .form-control.error { border-color: var(--danger); }

    .remember-row {
      margin-bottom: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #475569;
      cursor: pointer;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #1E3A5F;
      }
    }

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

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #E2E8F0;
      }

      span { font-size: 12px; color: #94A3B8; white-space: nowrap; }
    }

    .auth-card-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #E2E8F0;

      p { font-size: 14px; color: #475569; }
      a { color: #1E3A5F; font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } }
    }

    @media (max-width: 1024px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; }
    }

    @media (max-width: 480px) {
      .auth-right { padding: 20px; }
      .auth-card { padding: 28px 24px; }
      .role-selector { grid-template-columns: 1fr; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  selectedRole = signal<'admin' | 'member'>('admin');
  loading = signal(false);
  submitted = signal(false);
  showPwd = signal(false);
  errorMsg = signal('');

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  async onLogin() {
    this.submitted.set(true);
    this.errorMsg.set('');

    if (!this.email || !this.password) return;

    this.loading.set(true);
    try {
      // Pass selectedRole — backend validates it against DB
      const result = await this.auth.login(this.email, this.password, this.selectedRole());
      if (result.success) {
        if (result.role === 'member') {
          this.toast.success('Welcome to your Member Portal!');
          this.router.navigate(['/member-portal']);
        } else {
          this.toast.success('Welcome back, Admin!');
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.errorMsg.set(result.error || 'Invalid credentials');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async demoLogin() {
    this.loading.set(true);
    await new Promise(r => setTimeout(r, 800));
    sessionStorage.setItem('demo_mode', 'true');
    this.loading.set(false);
    this.toast.success('Welcome to CommitteeHub Demo!');
    if (this.selectedRole() === 'member') {
      this.router.navigate(['/member-portal']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
