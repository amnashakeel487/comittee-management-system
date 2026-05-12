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
<div class="auth-wrap" [attr.data-theme]="'dark'">
  <div class="auth-left">
    <a routerLink="/" class="auth-logo"><div class="logo-dot"></div>CommitteeHub</a>
    <div class="auth-left-body">
      <div class="auth-badge"><span class="material-icons" style="font-size:13px">verified</span> Trusted Committee Platform</div>
      <h1>Smart <em>Committee</em><br>Management System</h1>
      <p class="auth-sub">Manage committees, payments, members, and monthly turns — with full transparency and trust.</p>
      <div class="auth-feats">
        <div class="af" *ngFor="let f of features">
          <div class="af-ico"><span class="material-icons">{{ f.icon }}</span></div>
          <div><div class="af-t">{{ f.title }}</div><div class="af-d">{{ f.desc }}</div></div>
        </div>
      </div>
    </div>
    <div class="auth-left-foot">
      <p>Trusted by committee managers across Pakistan</p>
      <p>Designed & Developed by
        <a href="https://muhammadabdullahcv.vercel.app/#/" target="_blank">Muhammad Abdullah</a> &
        <a href="https://amnashakeel-portfolio.vercel.app/" target="_blank">Amna Shakeel</a>
      </p>
    </div>
  </div>

  <div class="auth-right">
    <div class="auth-card">
      <div class="auth-card-icon"><span class="material-icons">account_balance</span></div>
      <h2>Welcome Back</h2>
      <p class="auth-card-sub">Sign in to your CommitteeHub account</p>

      <form (ngSubmit)="onLogin()" class="auth-form">
        <div class="fg">
          <label>Email Address</label>
          <div class="fi-wrap">
            <span class="material-icons fi-ico">email</span>
            <input type="email" class="finp" placeholder="you@example.com"
                   [(ngModel)]="email" name="email" required [class.err]="submitted()&&!email">
          </div>
        </div>
        <div class="fg">
          <div class="fg-row">
            <label>Password</label>
            <a routerLink="/auth/forgot-password" class="forgot">Forgot password?</a>
          </div>
          <div class="fi-wrap">
            <span class="material-icons fi-ico">lock</span>
            <input [type]="showPwd()?'text':'password'" class="finp" placeholder="Enter your password"
                   [(ngModel)]="password" name="password" required [class.err]="submitted()&&!password">
            <button type="button" class="fi-eye" (click)="showPwd.update(v=>!v)">
              <span class="material-icons">{{ showPwd()?'visibility_off':'visibility' }}</span>
            </button>
          </div>
        </div>
        <div class="auth-err" *ngIf="errorMsg()">
          <span class="material-icons">error</span> {{ errorMsg() }}
        </div>
        <button type="submit" class="auth-btn" [disabled]="loading()">
          <span *ngIf="!loading()"><span class="material-icons">login</span> Sign In</span>
          <span *ngIf="loading()" class="auth-spinner"></span>
          <span *ngIf="loading()">Signing in...</span>
        </button>
      </form>

      <div class="auth-card-foot">
        <p>Don't have an account? <a routerLink="/auth/register">Create Account</a></p>
        <a routerLink="/" class="back-link"><span class="material-icons">arrow_back</span> Back to Home</a>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .auth-wrap { min-height: 100vh; display: flex; background: #060e1a; color: #f0f4ff; font-family: 'Plus Jakarta Sans','Inter',sans-serif; }

    /* LEFT */
    .auth-left { flex: 1; padding: 2.5rem 4rem 2.5rem 5%; display: flex; flex-direction: column; background: linear-gradient(155deg, #0f2035 0%, #060e1a 60%); border-right: 1px solid rgba(255,255,255,0.06); }
    .auth-logo { font-weight: 700; font-size: 1.2rem; color: #f0f4ff; text-decoration: none; display: flex; align-items: center; gap: 7px; margin-bottom: 2.5rem; }
    .logo-dot { width: 8px; height: 8px; border-radius: 50%; background: #2d8cff; flex-shrink: 0; }
    .auth-left-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; max-width: 480px; }
    .auth-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(45,140,255,0.12); border: 1px solid rgba(45,140,255,0.35); color: #2d8cff; padding: .26rem .72rem; border-radius: 50px; font-size: .78rem; font-weight: 600; margin-bottom: 1.2rem; width: fit-content; }
    h1 { font-size: clamp(2rem,4vw,3rem); font-weight: 700; line-height: 1.2; margin-bottom: .9rem; color: #f0f4ff; }
    h1 em { font-style: normal; color: #2d8cff; }
    .auth-sub { color: rgba(240,244,255,0.55); font-size: 1rem; margin-bottom: 1.8rem; line-height: 1.65; }
    .auth-feats { display: flex; flex-direction: column; gap: .9rem; }
    .af { display: flex; gap: .75rem; align-items: flex-start; }
    .af-ico { width: 36px; height: 36px; min-width: 36px; border-radius: 9px; background: rgba(45,140,255,0.12); border: 1px solid rgba(45,140,255,0.2); display: flex; align-items: center; justify-content: center; color: #2d8cff; .material-icons { font-size: 18px; } }
    .af-t { font-size: .95rem; font-weight: 700; color: #f0f4ff; margin-bottom: 2px; }
    .af-d { font-size: .85rem; color: rgba(240,244,255,0.5); line-height: 1.5; }
    .auth-left-foot { margin-top: 2rem; font-size: .84rem; color: rgba(240,244,255,0.35); line-height: 1.7; a { color: #2d8cff; text-decoration: none; &:hover { text-decoration: underline; } } }

    /* RIGHT */
    .auth-right { width: 520px; display: flex; align-items: center; justify-content: flex-start; padding: 2.5rem 5% 2.5rem 3rem; background: #060e1a; }
    .auth-card { width: 100%; max-width: 400px; background: rgba(255,255,255,0.04); border: 1px solid rgba(45,140,255,0.25); border-radius: 16px; padding: 2.25rem; }
    .auth-card-icon { width: 52px; height: 52px; background: rgba(45,140,255,0.15); border: 1px solid rgba(45,140,255,0.3); border-radius: 13px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; .material-icons { color: #2d8cff; font-size: 26px; } }
    h2 { font-size: 1.7rem; font-weight: 700; color: #f0f4ff; text-align: center; margin-bottom: .3rem; }
    .auth-card-sub { font-size: .93rem; color: rgba(240,244,255,0.5); text-align: center; margin-bottom: 1.6rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .fg { display: flex; flex-direction: column; gap: .38rem; }
    .fg label { font-size: .88rem; font-weight: 600; color: rgba(240,244,255,0.7); }
    .fg-row { display: flex; justify-content: space-between; align-items: center; }
    .forgot { font-size: .75rem; color: #2d8cff; text-decoration: none; &:hover { text-decoration: underline; } }
    .fi-wrap { position: relative; display: flex; align-items: center; }
    .fi-ico { position: absolute; left: 10px; color: rgba(240,244,255,0.3); font-size: 17px; z-index: 1; }
    .finp { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: .7rem .9rem .7rem 2.5rem; color: #f0f4ff; font-family: inherit; font-size: .95rem; outline: none; transition: border-color .2s; &:focus { border-color: rgba(45,140,255,0.5); } &::placeholder { color: rgba(240,244,255,0.2); } &.err { border-color: rgba(239,68,68,0.5); } }
    .fi-eye { position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: rgba(240,244,255,0.3); display: flex; .material-icons { font-size: 17px; } &:hover { color: rgba(240,244,255,0.7); } }
    .auth-err { display: flex; align-items: center; gap: .5rem; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: .65rem .9rem; font-size: .82rem; color: #f87171; .material-icons { font-size: 16px; } }
    .auth-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px; padding: .82rem; background: #2d8cff; color: #fff; border: none; border-radius: 8px; font-family: inherit; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all .2s; margin-top: .25rem; .material-icons { font-size: 18px; } &:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); } &:disabled { opacity: .6; cursor: not-allowed; } }
    .auth-spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-card-foot { text-align: center; margin-top: 1.4rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.06); p { font-size: .92rem; color: rgba(240,244,255,0.45); margin-bottom: .6rem; a { color: #2d8cff; font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } } } }
    .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; color: rgba(240,244,255,0.3); text-decoration: none; .material-icons { font-size: 14px; } &:hover { color: rgba(240,244,255,0.6); } }

    @media (max-width: 900px) { .auth-left { display: none; } .auth-right { width: 100%; } }
    @media (max-width: 480px) { .auth-right { padding: 1rem; } .auth-card { padding: 1.75rem 1.25rem; } }
  `]
})
export class LoginComponent {
  email = ""; password = ""; loading = signal(false); submitted = signal(false); showPwd = signal(false); errorMsg = signal("");
  features = [
    { icon: "groups", title: "Manage Committees", desc: "Create and manage multiple ROSCA committees effortlessly" },
    { icon: "payments", title: "Track Payments", desc: "Monitor all contributions and payment statuses in real-time" },
    { icon: "casino", title: "Spin Wheel Turns", desc: "Fair, transparent turn selection with animated spin wheel" },
    { icon: "bar_chart", title: "Analytics & Reports", desc: "Get detailed insights into your committee performance" }
  ];
  constructor(private auth: AuthService, private toast: ToastService, private router: Router) {}
  async onLogin() {
    this.submitted.set(true); this.errorMsg.set("");
    if (!this.email || !this.password) return;
    this.loading.set(true);
    try {
      const result = await this.auth.login(this.email, this.password);
      if (result.success) {
        if (result.role === "super_admin") { this.toast.success("Welcome, Super Admin!"); this.router.navigate(["/super-admin/dashboard"]); }
        else { this.toast.success("Welcome back!"); this.router.navigate(["/dashboard"]); }
      } else { this.errorMsg.set(result.error || "Invalid credentials"); }
    } finally { this.loading.set(false); }
  }
}
