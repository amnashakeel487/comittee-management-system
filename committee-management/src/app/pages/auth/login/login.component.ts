import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { ToastService } from "../../../services/toast.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-brand">
          <div class="brand-icon"><span class="material-icons">account_balance</span></div>
          <h1>CommitteeHub</h1>
          <p>Your trusted ROSCA management platform</p>
        </div>
        <div class="auth-features">
          <div class="feature-item">
            <div class="feature-icon"><span class="material-icons">groups</span></div>
            <div><h4>Manage Committees</h4><p>Create and manage multiple ROSCA committees effortlessly</p></div>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><span class="material-icons">payments</span></div>
            <div><h4>Track Payments</h4><p>Monitor all contributions and payment statuses in real-time</p></div>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><span class="material-icons">account_balance_wallet</span></div>
            <div><h4>Automated Payouts</h4><p>Schedule and release payouts with complete transparency</p></div>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><span class="material-icons">bar_chart</span></div>
            <div><h4>Analytics & Reports</h4><p>Get detailed insights into your committee performance</p></div>
          </div>
        </div>
        <div class="auth-footer-text">
          <p>Trusted by 10,000+ committee managers across Pakistan</p>
        </div>
        <div class="dev-credits">
          <p class="dev-label">Designed & Developed by</p>
          <div class="dev-cards">
            <a href="https://muhammadabdullahcv.vercel.app/#/" target="_blank" rel="noopener" class="dev-card">
              <div class="dev-avatar">MA</div>
              <div class="dev-info"><span class="dev-name">Muhammad Abdullah</span><span class="dev-role">Full Stack Developer</span></div>
              <span class="material-icons dev-link-icon">open_in_new</span>
            </a>
            <a href="https://amnashakeel-portfolio.vercel.app/" target="_blank" rel="noopener" class="dev-card">
              <div class="dev-avatar">AS</div>
              <div class="dev-info"><span class="dev-name">Amna Shakeel</span><span class="dev-role">Full Stack Developer</span></div>
              <span class="material-icons dev-link-icon">open_in_new</span>
            </a>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-card-header">
            <div class="auth-logo"><span class="material-icons">account_balance</span></div>
            <h2>Welcome back</h2>
            <p>Sign in to your CommitteeHub account</p>
          </div>

          <form (ngSubmit)="onLogin()" class="auth-form">
            <div class="form-group">
              <label>Email Address</label>
              <div class="input-icon-wrap">
                <span class="material-icons input-icon">email</span>
                <input type="email" class="form-control" placeholder="you@example.com"
                       [(ngModel)]="email" name="email" required [class.error]="submitted() && !email">
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
                       [(ngModel)]="password" name="password" required [class.error]="submitted() && !password">
                <button type="button" class="pwd-toggle" (click)="showPwd.update(v => !v)">
                  <span class="material-icons">{{ showPwd() ? "visibility_off" : "visibility" }}</span>
                </button>
              </div>
              <span class="form-error" *ngIf="submitted() && !password">
                <span class="material-icons" style="font-size:14px">error</span> Password is required
              </span>
            </div>

            <div class="form-error-msg" *ngIf="errorMsg()">
              <span class="material-icons">error</span>{{ errorMsg() }}
            </div>

            <button type="submit" class="btn btn-primary btn-full" [disabled]="loading()">
              <span class="material-icons" *ngIf="!loading()">login</span>
              <div class="btn-spinner" *ngIf="loading()"></div>
              {{ loading() ? "Signing in..." : "Sign In" }}
            </button>
          </form>

          <div class="auth-card-footer">
            <p>Don't have an account? <a routerLink="/auth/register">Create Account</a></p>
            <a routerLink="/" class="back-home"><span class="material-icons">home</span> Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; }
    .auth-left { flex: 1; background: linear-gradient(160deg, #0F172A 0%, #1E3A5F 55%, #2E5490 100%); padding: 48px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; &::before { content: ""; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: rgba(255,255,255,0.04); border-radius: 50%; } }
    .auth-brand { position: relative; z-index: 1; }
    .brand-icon { width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.25); .material-icons { color: white; font-size: 30px; } }
    .auth-brand h1 { font-size: 32px; font-weight: 800; color: white; margin-bottom: 8px; }
    .auth-brand p { font-size: 16px; color: rgba(255,255,255,0.7); }
    .auth-features { display: flex; flex-direction: column; gap: 24px; position: relative; z-index: 1; }
    .feature-item { display: flex; gap: 16px; align-items: flex-start; }
    .feature-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.12); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.2); .material-icons { color: white; font-size: 20px; } }
    .feature-item h4 { font-size: 15px; font-weight: 600; color: white; margin-bottom: 4px; }
    .feature-item p { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5; }
    .auth-footer-text { position: relative; z-index: 1; p { font-size: 13px; color: rgba(255,255,255,0.5); } }
    .dev-credits { position: relative; z-index: 1; margin-top: 20px; }
    .dev-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
    .dev-cards { display: flex; flex-direction: column; gap: 8px; }
    .dev-card { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; text-decoration: none; transition: all 0.2s; &:hover { background: rgba(255,255,255,0.15); transform: translateY(-1px); } }
    .dev-avatar { width: 34px; height: 34px; border-radius: 8px; background: rgba(255,255,255,0.2); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .dev-info { flex: 1; display: flex; flex-direction: column; }
    .dev-name { font-size: 13px; font-weight: 600; color: white; }
    .dev-role { font-size: 11px; color: rgba(255,255,255,0.55); }
    .dev-link-icon { font-size: 14px; color: rgba(255,255,255,0.4); }
    .auth-right { width: 520px; display: flex; align-items: center; justify-content: center; padding: 40px; background: #F8FAFC; }
    .auth-card { width: 100%; max-width: 440px; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(15,23,42,0.12); border: 1px solid #E2E8F0; }
    .auth-card-header { margin-bottom: 28px; text-align: center; }
    .auth-logo { width: 56px; height: 56px; background: #EEF3FA; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; .material-icons { color: #1E3A5F; font-size: 28px; } }
    .auth-card-header h2 { font-size: 26px; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
    .auth-card-header p { font-size: 14px; color: #64748B; }
    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .form-group { margin-bottom: 16px; label { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; } }
    .forgot-link { font-size: 12px; color: #1E3A5F; text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } }
    .input-icon-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 12px; color: #94A3B8; font-size: 18px; z-index: 1; }
    .input-icon-wrap .form-control { padding-left: 42px; padding-right: 44px; border-color: #E2E8F0; color: #0F172A; &:focus { border-color: #1E3A5F; box-shadow: 0 0 0 3px rgba(30,58,95,0.12); } &::placeholder { color: #94A3B8; } }
    .pwd-toggle { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: #94A3B8; display: flex; .material-icons { font-size: 18px; } &:hover { color: #475569; } }
    .form-control.error { border-color: var(--danger); }
    .form-error { font-size: 12px; color: var(--danger); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
    .form-error-msg { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fee2e2; border-radius: 8px; color: #991b1b; font-size: 13px; margin-bottom: 8px; .material-icons { font-size: 18px; } }
    .btn-full { width: 100%; justify-content: center; padding: 13px; font-size: 15px; font-weight: 700; }
    .btn-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .auth-card-footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #E2E8F0; p { font-size: 14px; color: #475569; margin-bottom: 10px; } a { color: #1E3A5F; font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } } }
    .back-home { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #64748B !important; font-weight: 500 !important; .material-icons { font-size: 15px; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1024px) { .auth-left { display: none; } .auth-right { width: 100%; } }
    @media (max-width: 480px) { .auth-right { padding: 20px; } .auth-card { padding: 28px 24px; } }
  `]
})
export class LoginComponent {
  email = "";
  password = "";
  loading = signal(false);
  submitted = signal(false);
  showPwd = signal(false);
  errorMsg = signal("");

  constructor(private auth: AuthService, private toast: ToastService, private router: Router) {}

  async onLogin() {
    this.submitted.set(true);
    this.errorMsg.set("");
    if (!this.email || !this.password) return;
    this.loading.set(true);
    try {
      const result = await this.auth.login(this.email, this.password);
      if (result.success) {
        if (result.role === "super_admin") {
          this.toast.success("Welcome, Super Admin!");
          this.router.navigate(["/super-admin"]);
        } else {
          this.toast.success("Welcome back!");
          this.router.navigate(["/dashboard"]);
        }
      } else {
        this.errorMsg.set(result.error || "Invalid credentials");
      }
    } finally {
      this.loading.set(false);
    }
  }
}
