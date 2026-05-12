import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="sa-layout">
  <!-- SIDEBAR -->
  <aside class="sa-sidebar" [class.collapsed]="collapsed()">
    <div class="sa-sidebar-top">
      <div class="sa-sidebar-brand" *ngIf="!collapsed()">
        <div class="sa-brand-badge">⚡</div>
        <div>
          <div class="sa-brand-name">CommitteeHub</div>
          <div class="sa-brand-role">Super Admin</div>
        </div>
      </div>
      <div class="sa-brand-badge-sm" *ngIf="collapsed()">⚡</div>
      <button class="sa-collapse-btn" (click)="collapsed.update(v=>!v)">
        {{ collapsed() ? '→' : '←' }}
      </button>
    </div>

    <nav class="sa-nav">
      <a routerLink="/super-admin/dashboard" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Dashboard' : ''">
        <span class="sa-nav-icon">📊</span>
        <span *ngIf="!collapsed()">Dashboard</span>
      </a>
      <a routerLink="/super-admin/users" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Users' : ''">
        <span class="sa-nav-icon">👥</span>
        <span *ngIf="!collapsed()">User Management</span>
      </a>
      <a routerLink="/super-admin/committees" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Committees' : ''">
        <span class="sa-nav-icon">🏛</span>
        <span *ngIf="!collapsed()">Committees</span>
      </a>
      <a routerLink="/super-admin/fraud" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Fraud' : ''">
        <span class="sa-nav-icon">🚨</span>
        <span *ngIf="!collapsed()">Fraud Reports</span>
        <span class="sa-badge" *ngIf="!collapsed() && fraudCount() > 0">{{ fraudCount() }}</span>
      </a>
      <a routerLink="/super-admin/payments" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Payments' : ''">
        <span class="sa-nav-icon">💳</span>
        <span *ngIf="!collapsed()">Payments</span>
      </a>
      <a routerLink="/super-admin/verification" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Verification' : ''">
        <span class="sa-nav-icon">✅</span>
        <span *ngIf="!collapsed()">Verification</span>
      </a>
      <a routerLink="/super-admin/announcements" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Announcements' : ''">
        <span class="sa-nav-icon">📢</span>
        <span *ngIf="!collapsed()">Announcements</span>
      </a>
      <a routerLink="/super-admin/audit" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Audit' : ''">
        <span class="sa-nav-icon">📋</span>
        <span *ngIf="!collapsed()">Audit Logs</span>
      </a>
      <a routerLink="/super-admin/settings" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Settings' : ''">
        <span class="sa-nav-icon">⚙</span>
        <span *ngIf="!collapsed()">Settings</span>
      </a>
    </nav>

    <div class="sa-sidebar-bottom">
      <div class="sa-user-info" *ngIf="!collapsed()">
        <div class="sa-user-av">{{ getInitials() }}</div>
        <div>
          <div class="sa-user-name">{{ auth.currentUser()?.name }}</div>
          <div class="sa-user-role">Super Admin</div>
        </div>
      </div>
      <button class="sa-logout-btn" (click)="logout()" [title]="collapsed() ? 'Logout' : ''">
        <span>🚪</span>
        <span *ngIf="!collapsed()">Logout</span>
      </button>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="sa-main" [class.expanded]="collapsed()">
    <header class="sa-topbar">
      <div class="sa-topbar-left">
        <div class="sa-topbar-title">Super Admin Control Center</div>
      </div>
      <div class="sa-topbar-right">
        <div class="sa-topbar-user">
          <div class="sa-user-av sm">{{ getInitials() }}</div>
          <span>{{ auth.currentUser()?.name }}</span>
          <span class="sa-role-chip">SUPER ADMIN</span>
        </div>
      </div>
    </header>
    <main class="sa-content">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .sa-layout { display: flex; min-height: 100vh; background: #0a0f1e; font-family: 'Inter', sans-serif; }

    /* SIDEBAR */
    .sa-sidebar { width: 240px; background: #0d1526; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; transition: width 0.25s ease; z-index: 50; overflow: hidden; }
    .sa-sidebar.collapsed { width: 64px; }
    .sa-sidebar-top { padding: 16px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; min-height: 64px; }
    .sa-sidebar-brand { display: flex; align-items: center; gap: 10px; }
    .sa-brand-badge { width: 34px; height: 34px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .sa-brand-badge-sm { width: 34px; height: 34px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; margin: 0 auto; }
    .sa-brand-name { font-size: 14px; font-weight: 800; color: #fff; white-space: nowrap; }
    .sa-brand-role { font-size: 10px; color: #f59e0b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .sa-collapse-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: rgba(255,255,255,0.5); cursor: pointer; padding: 4px 8px; font-size: 12px; flex-shrink: 0; }
    .sa-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
    .sa-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 10px; border-radius: 8px; color: rgba(255,255,255,0.55); text-decoration: none; font-size: 13px; font-weight: 500; transition: all 0.15s; white-space: nowrap; position: relative; &:hover { background: rgba(255,255,255,0.06); color: #fff; } &.active { background: rgba(245,158,11,0.12); color: #f59e0b; border-left: 3px solid #f59e0b; padding-left: 7px; } }
    .sa-nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
    .sa-badge { background: #ef4444; color: #fff; border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; margin-left: auto; }
    .sa-sidebar-bottom { padding: 12px 8px; border-top: 1px solid rgba(255,255,255,0.06); }
    .sa-user-info { display: flex; align-items: center; gap: 8px; padding: 8px 10px; margin-bottom: 6px; }
    .sa-user-av { width: 32px; height: 32px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; &.sm { width: 28px; height: 28px; font-size: 11px; } }
    .sa-user-name { font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
    .sa-user-role { font-size: 10px; color: #f59e0b; font-weight: 600; }
    .sa-logout-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 10px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); border-radius: 8px; color: #f87171; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; &:hover { background: rgba(239,68,68,0.15); } }

    /* MAIN */
    .sa-main { flex: 1; margin-left: 240px; transition: margin-left 0.25s ease; display: flex; flex-direction: column; min-height: 100vh; }
    .sa-main.expanded { margin-left: 64px; }
    .sa-topbar { background: #0d1526; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 28px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 40; }
    .sa-topbar-title { font-size: 15px; font-weight: 700; color: #fff; }
    .sa-topbar-right { display: flex; align-items: center; gap: 12px; }
    .sa-topbar-user { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.7); }
    .sa-role-chip { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
    .sa-content { flex: 1; padding: 24px 28px; background: #0a0f1e; }

    @media (max-width: 768px) { .sa-sidebar { width: 64px; } .sa-main { margin-left: 64px; } }
  `]
})
export class SuperAdminLayoutComponent {
  collapsed = signal(false);
  fraudCount = signal(0);

  constructor(public auth: AuthService) {}

  getInitials(): string {
    const name = this.auth.currentUser()?.name || 'SA';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout() { this.auth.logout(); }
}
