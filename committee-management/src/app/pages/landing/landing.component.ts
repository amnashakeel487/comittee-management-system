import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vxvgagkwgsjetvyvxdxg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dmdhZ2t3Z3NqZXR2eXZ4ZHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTI1NTUsImV4cCI6MjA5Mzk2ODU1NX0.knri6Kwk9p09rJ1zLwhOokbcCj-ByKdIlt774hKyJn8'
);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="landing">

  <!-- Navbar -->
  <nav class="navbar">
    <div class="nav-inner">
      <div class="nav-brand">
        <div class="brand-icon"><span class="material-icons">account_balance</span></div>
        <span class="brand-name">CommitteeHub</span>
      </div>
      <div class="nav-actions">
        <a routerLink="/auth/login" class="btn-nav-outline">Login</a>
        <a routerLink="/auth/register" class="btn-nav-solid">Create Committee</a>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-badge">🇵🇰 Pakistan's #1 ROSCA Platform</div>
      <h1 class="hero-title">Manage Your Committee<br><span class="hero-accent">With Confidence</span></h1>
      <p class="hero-sub">Transparent, secure, and easy-to-use committee management for savings groups across Pakistan.</p>
      <div class="hero-btns">
        <a routerLink="/auth/register" class="btn-hero-primary">
          <span class="material-icons">add_circle</span> Start Your Committee
        </a>
        <a routerLink="/auth/login" class="btn-hero-outline">
          <span class="material-icons">login</span> Sign In
        </a>
      </div>
      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-num">{{ stats().committees }}</span>
          <span class="stat-lbl">Active Committees</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ stats().members }}</span>
          <span class="stat-lbl">Members</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ stats().admins }}</span>
          <span class="stat-lbl">Committee Admins</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Committees Section -->
  <section class="committees-section">
    <div class="section-inner">
      <div class="section-header">
        <h2>Browse Committees</h2>
        <p>Join an existing committee or create your own</p>
      </div>

      <div *ngIf="loading()" class="loading-center">
        <div class="spinner"></div>
      </div>

      <div class="committees-grid" *ngIf="!loading()">
        <div *ngFor="let c of committees()" class="committee-card">
          <div class="cc-top">
            <span class="cc-status" [class.active]="c.status==='active'" [class.pending]="c.status==='pending'">
              {{ c.status | titlecase }}
            </span>
            <span class="cc-pool">PKR {{ (c.monthly_amount * c.total_members) | number }} Pool</span>
          </div>
          <h3 class="cc-name">{{ c.name }}</h3>
          <p class="cc-desc" *ngIf="c.description">{{ c.description }}</p>

          <!-- Admin info -->
          <div class="cc-admin" (click)="openAdminProfile(c)" style="cursor:pointer">
            <div class="admin-avatar" [style.background]="getColor(c.profiles?.name || '')">
              {{ getInitials(c.profiles?.name || 'A') }}
            </div>
            <div class="admin-info">
              <span class="admin-name">{{ c.profiles?.name || 'Admin' }}</span>
              <span class="admin-label">Committee Admin</span>
            </div>
            <span class="material-icons view-icon">open_in_new</span>
          </div>

          <div class="cc-stats">
            <div class="cc-stat"><span class="material-icons">payments</span> PKR {{ c.monthly_amount | number }}/mo</div>
            <div class="cc-stat"><span class="material-icons">people</span> {{ c.total_members }} members</div>
            <div class="cc-stat"><span class="material-icons">schedule</span> {{ c.duration_months }} months</div>
          </div>

          <a routerLink="/auth/login" class="btn-join">
            <span class="material-icons">person_add</span> Request to Join
          </a>
        </div>

        <div *ngIf="committees().length === 0" class="empty-committees">
          <span class="material-icons">groups</span>
          <p>No committees yet. Be the first to create one!</p>
          <a routerLink="/auth/register" class="btn-hero-primary" style="margin-top:16px">Create Committee</a>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="features-section">
    <div class="section-inner">
      <div class="section-header light">
        <h2>Why CommitteeHub?</h2>
        <p>Everything you need to run a successful ROSCA committee</p>
      </div>
      <div class="features-grid">
        <div class="feature-card" *ngFor="let f of features">
          <div class="feature-icon"><span class="material-icons">{{ f.icon }}</span></div>
          <h4>{{ f.title }}</h4>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="brand-icon sm"><span class="material-icons">account_balance</span></div>
        <span>CommitteeHub</span>
      </div>
      <p class="footer-copy">© 2026 CommitteeHub. Designed & Developed by</p>
      <div class="footer-devs">
        <a href="https://muhammadabdullahcv.vercel.app/#/" target="_blank" class="dev-link">Muhammad Abdullah</a>
        <span>&</span>
        <a href="https://amnashakeel-portfolio.vercel.app/" target="_blank" class="dev-link">Amna Shakeel</a>
      </div>
    </div>
  </footer>

  <!-- Admin Profile Modal -->
  <div class="modal-overlay" *ngIf="selectedAdmin()" (click)="closeAdminProfile()">
    <div class="admin-modal" (click)="$event.stopPropagation()">
      <button class="modal-close" (click)="closeAdminProfile()">
        <span class="material-icons">close</span>
      </button>
      <div class="admin-modal-header">
        <div class="admin-modal-avatar" [style.background]="getColor(selectedAdmin()?.name || '')">
          {{ getInitials(selectedAdmin()?.name || 'A') }}
        </div>
        <div>
          <h3>{{ selectedAdmin()?.name }}</h3>
          <span class="admin-badge">Committee Admin</span>
        </div>
      </div>
      <div class="admin-modal-body">
        <div class="info-row" *ngIf="selectedAdmin()?.email">
          <span class="material-icons">email</span>
          <span>{{ selectedAdmin()?.email }}</span>
        </div>
        <div class="info-row" *ngIf="selectedAdmin()?.phone">
          <span class="material-icons">phone</span>
          <span>{{ selectedAdmin()?.phone }}</span>
        </div>
        <h4 style="margin:16px 0 10px;font-size:14px;color:#334155">Committees Managed</h4>
        <div *ngFor="let c of adminCommittees()" class="admin-committee-row">
          <span class="material-icons" style="color:#1E3A5F;font-size:16px">groups</span>
          <span>{{ c.name }}</span>
          <span class="cc-status sm" [class.active]="c.status==='active'" [class.pending]="c.status==='pending'">{{ c.status }}</span>
        </div>
      </div>
      <div class="admin-modal-footer">
        <a routerLink="/auth/login" class="btn-join" (click)="closeAdminProfile()">
          <span class="material-icons">login</span> Login to Join a Committee
        </a>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .landing { font-family: 'Inter', sans-serif; color: #0F172A; }

    /* Navbar */
    .navbar { background: #1E3A5F; padding: 0 24px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(0,0,0,0.2); }
    .nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .nav-brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; .material-icons { color: white; font-size: 20px; } }
    .brand-icon.sm { width: 28px; height: 28px; .material-icons { font-size: 16px; } }
    .brand-name { font-size: 18px; font-weight: 800; color: white; }
    .nav-actions { display: flex; gap: 10px; }
    .btn-nav-outline { padding: 8px 18px; border: 1.5px solid rgba(255,255,255,0.4); border-radius: 8px; color: white; text-decoration: none; font-size: 13px; font-weight: 600; transition: all 0.2s; &:hover { background: rgba(255,255,255,0.1); } }
    .btn-nav-solid { padding: 8px 18px; background: white; border-radius: 8px; color: #1E3A5F; text-decoration: none; font-size: 13px; font-weight: 700; transition: all 0.2s; &:hover { background: #EEF3FA; } }

    /* Hero */
    .hero { background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #2E5490 100%); padding: 80px 24px 60px; }
    .hero-inner { max-width: 800px; margin: 0 auto; text-align: center; }
    .hero-badge { display: inline-block; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
    .hero-title { font-size: 52px; font-weight: 800; color: white; line-height: 1.15; margin-bottom: 20px; }
    .hero-accent { color: #60A5FA; }
    .hero-sub { font-size: 18px; color: rgba(255,255,255,0.7); margin-bottom: 36px; line-height: 1.6; }
    .hero-btns { display: flex; gap: 14px; justify-content: center; margin-bottom: 48px; flex-wrap: wrap; }
    .btn-hero-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: #2563EB; color: white; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 700; transition: all 0.2s; .material-icons { font-size: 18px; } &:hover { background: #1D4ED8; transform: translateY(-1px); } }
    .btn-hero-outline { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border: 2px solid rgba(255,255,255,0.4); color: white; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; transition: all 0.2s; .material-icons { font-size: 18px; } &:hover { background: rgba(255,255,255,0.1); } }

    /* Stats bar */
    .stats-bar { display: inline-flex; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 20px 40px; gap: 40px; backdrop-filter: blur(10px); }
    .stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .stat-num { font-size: 28px; font-weight: 800; color: white; }
    .stat-lbl { font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 500; }
    .stat-divider { width: 1px; background: rgba(255,255,255,0.2); }

    /* Committees section */
    .committees-section { padding: 64px 24px; background: #F8FAFC; }
    .section-inner { max-width: 1200px; margin: 0 auto; }
    .section-header { text-align: center; margin-bottom: 40px; h2 { font-size: 32px; font-weight: 800; color: #0F172A; margin-bottom: 8px; } p { font-size: 16px; color: #64748B; } }
    .section-header.light { h2 { color: white; } p { color: rgba(255,255,255,0.7); } }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 40px; height: 40px; border: 3px solid #E2E8F0; border-top-color: #1E3A5F; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* Committee cards */
    .committees-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .committee-card { background: white; border-radius: 14px; border: 1px solid #E2E8F0; padding: 22px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.06); transition: all 0.2s; &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,23,42,0.12); } }
    .cc-top { display: flex; justify-content: space-between; align-items: center; }
    .cc-status { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; &.active { background: #d1fae5; color: #065f46; } &.pending { background: #fef3c7; color: #92400e; } &.sm { font-size: 10px; padding: 2px 8px; } }
    .cc-pool { font-size: 12px; font-weight: 700; color: #1E3A5F; background: #EEF3FA; padding: 3px 10px; border-radius: 20px; }
    .cc-name { font-size: 17px; font-weight: 700; color: #0F172A; }
    .cc-desc { font-size: 13px; color: #64748B; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .cc-admin { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #EEF3FA; border-radius: 10px; border: 1px solid #D0DFF2; transition: all 0.15s; &:hover { background: #D0DFF2; } }
    .admin-avatar { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; flex-shrink: 0; }
    .admin-info { flex: 1; display: flex; flex-direction: column; }
    .admin-name { font-size: 13px; font-weight: 700; color: #0F172A; }
    .admin-label { font-size: 11px; color: #64748B; }
    .view-icon { font-size: 16px; color: #1E3A5F; }
    .cc-stats { display: flex; flex-wrap: wrap; gap: 8px; }
    .cc-stat { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #475569; font-weight: 500; .material-icons { font-size: 14px; color: #1E3A5F; } }
    .btn-join { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; background: #1E3A5F; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: all 0.15s; margin-top: auto; .material-icons { font-size: 16px; } &:hover { background: #152C4A; } }
    .empty-committees { grid-column: 1/-1; text-align: center; padding: 60px; .material-icons { font-size: 56px; color: #CBD5E1; display: block; margin-bottom: 16px; } p { color: #64748B; font-size: 16px; } }

    /* Features */
    .features-section { padding: 64px 24px; background: linear-gradient(135deg, #0F172A, #1E3A5F); }
    .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .feature-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 28px; transition: all 0.2s; &:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); } }
    .feature-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; .material-icons { color: #60A5FA; font-size: 24px; } }
    .feature-card h4 { font-size: 16px; font-weight: 700; color: white; margin-bottom: 8px; }
    .feature-card p { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6; }

    /* Footer */
    .footer { background: #0F172A; padding: 32px 24px; text-align: center; }
    .footer-inner { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .footer-brand { display: flex; align-items: center; gap: 8px; color: white; font-size: 16px; font-weight: 700; }
    .footer-copy { font-size: 13px; color: #64748B; }
    .footer-devs { display: flex; gap: 8px; align-items: center; font-size: 13px; color: #64748B; }
    .dev-link { color: #60A5FA; text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } }

    /* Admin Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
    .admin-modal { background: white; border-radius: 20px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s ease; position: relative; overflow: hidden; }
    .modal-close { position: absolute; top: 16px; right: 16px; background: #F1F5F9; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; .material-icons { font-size: 18px; color: #475569; } &:hover { background: #E2E8F0; } }
    .admin-modal-header { background: linear-gradient(135deg, #1E3A5F, #2E5490); padding: 28px 24px; display: flex; align-items: center; gap: 16px; }
    .admin-modal-avatar { width: 60px; height: 60px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: white; flex-shrink: 0; border: 3px solid rgba(255,255,255,0.3); }
    .admin-modal-header h3 { font-size: 20px; font-weight: 700; color: white; margin-bottom: 6px; }
    .admin-badge { background: rgba(255,255,255,0.2); color: white; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .admin-modal-body { padding: 20px 24px; }
    .info-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #334155; .material-icons { font-size: 18px; color: #1E3A5F; } }
    .admin-committee-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #F8FAFC; border-radius: 8px; margin-bottom: 6px; font-size: 13px; color: #334155; font-weight: 500; }
    .admin-modal-footer { padding: 16px 24px; border-top: 1px solid #E2E8F0; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) { .committees-grid, .features-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) {
      .committees-grid, .features-grid { grid-template-columns: 1fr; }
      .hero-title { font-size: 32px; }
      .stats-bar { flex-direction: column; gap: 16px; padding: 20px; }
      .stat-divider { display: none; }
    }
  `]
})
export class LandingComponent implements OnInit {
  loading = signal(true);
  committees = signal<any[]>([]);
  stats = signal({ committees: 0, members: 0, admins: 0 });
  selectedAdmin = signal<any>(null);
  adminCommittees = signal<any[]>([]);

  features = [
    { icon: 'groups', title: 'Manage Committees', desc: 'Create and manage multiple ROSCA committees with full member tracking and payout schedules.' },
    { icon: 'payments', title: 'Track Payments', desc: 'Monitor all contributions and payment statuses in real-time with instant notifications.' },
    { icon: 'account_balance_wallet', title: 'Automated Payouts', desc: 'Schedule and release payouts with complete transparency and audit trail.' },
    { icon: 'bar_chart', title: 'Analytics & Reports', desc: 'Get detailed insights into your committee performance and financial health.' },
    { icon: 'security', title: 'Secure & Trusted', desc: 'Bank-grade security with Supabase backend. Your data is always safe and private.' },
    { icon: 'phone_android', title: 'Works Everywhere', desc: 'Access your committee from any device — desktop, tablet, or mobile.' }
  ];

  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2'];

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    try {
      const [committeesRes, membersRes, adminsRes] = await Promise.all([
        supabase.from('committees').select('*, profiles(name, email, phone)').in('status', ['active', 'pending']).order('created_at', { ascending: false }),
        supabase.from('members').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
      ]);

      this.committees.set(committeesRes.data || []);
      this.stats.set({
        committees: committeesRes.data?.length || 0,
        members: membersRes.count || 0,
        admins: adminsRes.count || 0
      });
    } catch (e) {
      console.error('Landing load error:', e);
    } finally {
      this.loading.set(false);
    }
  }

  openAdminProfile(committee: any) {
    const admin = committee.profiles;
    if (!admin) return;
    this.selectedAdmin.set({ ...admin, id: committee.created_by });
    // Find all committees by this admin
    const adminCs = this.committees().filter(c => c.created_by === committee.created_by);
    this.adminCommittees.set(adminCs);
  }

  closeAdminProfile() {
    this.selectedAdmin.set(null);
    this.adminCommittees.set([]);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getColor(name: string): string {
    return this.colors[(name.charCodeAt(0) || 0) % this.colors.length];
  }
}
