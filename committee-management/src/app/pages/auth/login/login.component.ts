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
  <!-- Animated background -->
  <div class="auth-bg"></div>
  <div class="auth-grid"></div>
  <div class="auth-dots">
    <div *ngFor="let d of dots" class="dot" [style]="d"></div>
  </div>

  <!-- Left panel -->
  <div class="auth-left">
    <a routerLink="/" class="auth-logo">Committee<span>Hub</span></a>
    <div class="auth-left-content">
      <div class="auth-badge"><i class="ti ti-shield-check"></i> Trusted Committee Platform</div>
      <h1 class="auth-title">Smart Committee<br><span class="accent">Management System</span></h1>
      <p class="auth-sub">Manage committees, payments, members, and monthly turns easily — with full transparency and trust.</p>
      <div class="auth-features">
        <div class="af-item" *ngFor="let f of features">
          <div class="af-icon"><i [class]="'ti ' + f.icon"></i></div>
          <div><div class="af-title">{{ f.title }}</div><div class="af-desc">{{ f.desc }}</div></div>
        </div>
      </div>
    </div>
    <div class="auth-left-footer">
      <p>Trusted by committee managers across Pakistan</p>
      <div class="dev-credits">
        <span>Designed & Developed by</span>
        <a href="https://muhammadabdullahcv.vercel.app/#/" target="_blank">Muhammad Abdullah</a>
        <span>&</span>
        <a href="https://amnashakeel-portfolio.vercel.app/" target="_blank">Amna Shakeel</a>
      </div>
    </div>
  </div>

  <!-- Right panel -->
  <div class="auth-right">
    <div class="auth-card">
      <div class="auth-card-top">
        <div class="auth-card-icon"><i class="ti ti-building-bank"></i></div>
        <h2>Welcome Back</h2>
        <p>Sign in to your CommitteeHub account</p>
      </div>

      <form (ngSubmit)="onLogin()" class="auth-form">
        <div class="form-group">
          <label class="form-label"><i class="ti ti-mail"></i> Email Address</label>
          <input class="form-input" type="email" placeholder="you@example.com"
                 [(ngModel)]="email" name="email" required
                 [class.error]="submitted() && !email">
          <span class="form-err" *ngIf="submitted() && !email">Email is required</span>
        </div>

        <div class="form-group">
          <div class="form-label-row">
            <label class="form-label"><i class="ti ti-lock"></i> Password</label>
            <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
          </div>
          <div class="input-wrap">
            <input class="form-input" [type]="showPwd() ? 'text' : 'password'"
                   placeholder="Enter your password"
                   [(ngModel)]="password" name="password" required
                   [class.error]="submitted() && !password">
            <button type="button" class="pwd-toggle" (click)="showPwd.update(v=>!v)">
              <i [class]="'ti ' + (showPwd() ? 'ti-eye-off' : 'ti-eye')"></i>
            </button>
          </div>
          <span class="form-err" *ngIf="submitted() && !password">Password is required</span>
        </div>

        <div class="form-error-msg" *ngIf="errorMsg()">
          <i class="ti ti-alert-circle"></i> {{ errorMsg() }}
        </div>

        <button type="submit" class="btn-submit" [disabled]="loading()">
          <span *ngIf="!loading()"><i class="ti ti-login"></i> Sign In</span>
          <span *ngIf="loading()" class="btn-spinner"></span>
          <span *ngIf="loading()">Signing in...</span>
        </button>
      </form>

      <div class="auth-card-footer">
        <p>Don't have an account? <a routerLink="/auth/register">Create Account</a></p>
        <a routerLink="/" class="back-home"><i class="ti ti-arrow-left"></i> Back to Home</a>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .auth-page { min-height: 100vh; display: flex; position: relative; overflow: hidden; font-family: "DM Sans", sans-serif; background: #020b18; color: #fff; }
    .auth-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 30% 50%, rgba(14,52,96,0.9) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 20%, rgba(45,140,255,0.1) 0%, transparent 60%); }
    .auth-grid { position: absolute; inset: 0; opacity: .04; background-image: linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px); background-size: 50px 50px; }
    .auth-dots { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .dot { position: absolute; border-radius: 50%; animation: float 6s ease-in-out infinite; }
    @keyframes float { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* LEFT */
    .auth-left { flex: 1; padding: 2.5rem 3rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; z-index: 2; }
    .auth-logo { font-family: "Syne", sans-serif; font-weight: 800; font-size: 1.4rem; color: #fff; text-decoration: none; display: inline-block; margin-bottom: 2rem; span { color: #2d8cff; } }
    .auth-left-content { flex: 1; display: flex; flex-direction: column; justify-content: center; max-width: 480px; }
    .auth-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(45,140,255,0.12); border: 1px solid rgba(45,140,255,0.3); color: #5aabff; padding: .35rem .9rem; border-radius: 50px; font-size: .8rem; font-weight: 500; margin-bottom: 1.5rem; animation: fadeInUp .6s ease both; }
    .auth-title { font-family: "Syne", sans-serif; font-size: clamp(2rem,4vw,3rem); font-weight: 800; line-height: 1.2; margin-bottom: 1rem; animation: fadeInUp .7s .1s ease both; .accent { background: linear-gradient(135deg, #5aabff, #7ec8ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; } }
    .auth-sub { font-size: 1rem; color: rgba(255,255,255,0.55); margin-bottom: 2rem; font-weight: 300; line-height: 1.7; animation: fadeInUp .7s .2s ease both; }
    .auth-features { display: flex; flex-direction: column; gap: 1rem; animation: fadeInUp .7s .3s ease both; }
    .af-item { display: flex; gap: 12px; align-items: flex-start; }
    .af-icon { width: 38px; height: 38px; min-width: 38px; border-radius: 10px; background: rgba(45,140,255,0.12); border: 1px solid rgba(45,140,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 1rem; color: #2d8cff; }
    .af-title { font-family: "Syne", sans-serif; font-size: .88rem; font-weight: 700; margin-bottom: 2px; }
    .af-desc { font-size: .78rem; color: rgba(255,255,255,0.5); font-weight: 300; }
    .auth-left-footer { font-size: .78rem; color: rgba(255,255,255,0.4); }
    .dev-credits { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; align-items: center; a { color: #2d8cff; text-decoration: none; &:hover { text-decoration: underline; } } }

    /* RIGHT */
    .auth-right { width: 480px; display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 2; }
    .auth-card { width: 100%; max-width: 420px; background: rgba(10,37,64,0.8); border: 1px solid rgba(45,140,255,0.2); border-radius: 22px; padding: 2.5rem; backdrop-filter: blur(20px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: fadeInUp .8s .1s ease both; }
    .auth-card-top { text-align: center; margin-bottom: 2rem; }
    .auth-card-icon { width: 56px; height: 56px; background: rgba(45,140,255,0.15); border: 1px solid rgba(45,140,255,0.3); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem; color: #2d8cff; }
    .auth-card-top h2 { font-family: "Syne", sans-serif; font-size: 1.6rem; font-weight: 800; margin-bottom: .4rem; }
    .auth-card-top p { font-size: .88rem; color: rgba(255,255,255,0.5); font-weight: 300; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: .4rem; }
    .form-label { font-size: .8rem; font-weight: 500; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: .3rem; }
    .form-label-row { display: flex; justify-content: space-between; align-items: center; }
    .forgot-link { font-size: .78rem; color: #2d8cff; text-decoration: none; &:hover { text-decoration: underline; } }
    .input-wrap { position: relative; }
    .form-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: .7rem 1rem; color: #fff; font-family: "DM Sans", sans-serif; font-size: .9rem; outline: none; transition: border-color .2s; &:focus { border-color: rgba(45,140,255,0.5); box-shadow: 0 0 0 3px rgba(45,140,255,0.1); } &::placeholder { color: rgba(255,255,255,0.2); } &.error { border-color: rgba(239,68,68,0.5); } }
    .input-wrap .form-input { padding-right: 2.8rem; }
    .pwd-toggle { position: absolute; right: .8rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.4); font-size: 1rem; display: flex; &:hover { color: rgba(255,255,255,0.8); } }
    .form-err { font-size: .75rem; color: #f87171; }
    .form-error-msg { display: flex; align-items: center; gap: .5rem; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: .75rem 1rem; font-size: .85rem; color: #f87171; }
    .btn-submit { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: .85rem; background: #2d8cff; color: #fff; border: none; border-radius: 50px; font-family: "DM Sans", sans-serif; font-size: .95rem; font-weight: 600; cursor: pointer; transition: all .25s; margin-top: .5rem; &:hover:not(:disabled) { background: #5aabff; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(45,140,255,0.3); } &:disabled { opacity: .6; cursor: not-allowed; } }
    .btn-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin .8s linear infinite; }
    .auth-card-footer { text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.06); p { font-size: .85rem; color: rgba(255,255,255,0.5); margin-bottom: .75rem; a { color: #2d8cff; text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } } } }
    .back-home { display: inline-flex; align-items: center; gap: 4px; font-size: .8rem; color: rgba(255,255,255,0.35); text-decoration: none; transition: color .2s; &:hover { color: rgba(255,255,255,0.7); } }
    @media (max-width: 900px) { .auth-left { display: none; } .auth-right { width: 100%; } }
    @media (max-width: 480px) { .auth-right { padding: 1rem; } .auth-card { padding: 1.75rem 1.5rem; } }
  `]
})
export class LoginComponent {
  email = "";
  password = "";
  loading = signal(false);
  submitted = signal(false);
  showPwd = signal(false);
  errorMsg = signal("");

  dots = Array.from({ length: 10 }, () => {
    const size = Math.random() * 4 + 2;
    return `width:${size}px;height:${size}px;background:rgba(45,140,255,${(Math.random()*.25+.05).toFixed(2)});left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${(Math.random()*4).toFixed(1)}s;animation-duration:${(5+Math.random()*5).toFixed(1)}s;`;
  });

  features = [
    { icon: "ti-building-community", title: "Manage Committees", desc: "Create and manage multiple ROSCA committees effortlessly" },
    { icon: "ti-receipt-2", title: "Track Payments", desc: "Monitor all contributions and payment statuses in real-time" },
    { icon: "ti-rotate-clockwise-2", title: "Spin Wheel Turns", desc: "Fair, transparent turn selection with animated spin wheel" },
    { icon: "ti-chart-bar", title: "Analytics & Reports", desc: "Get detailed insights into your committee performance" }
  ];

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
