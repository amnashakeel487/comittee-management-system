import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="sa-shell">
  <!-- Sidebar -->
  <aside class="sa-sidebar" [class.collapsed]="collapsed()">
    <div class="sa-sidebar-logo">
      <div class="sa-logo-icon"><span class="material-icons">shield</span></div>
      <div class="sa-logo-text" *ngIf="!collapsed()">
        <span class="sa-logo-name">SuperAdmin</span>
        <span class="sa-logo-sub">Control Center</span>
      </div>
      <button class="sa-collapse-btn" (click)="collapsed.update(v=>!v)">
        <span class="material-icons">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</span>
      </button>
    </div>

    <nav class="sa-nav">
      <a routerLink="/super-admin/dashboard/overview" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Overview' : ''">
        <span class="material-icons">dashboard</span>
        <span *ngIf="!collapsed()">Overview</span>
      </a>
      <a routerLink="/super-admin/dashboard/users" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Users' : ''">
        <span class="material-icons">people</span>
        <span *ngIf="!collapsed()">User Management</span>
      </a>
      <a routerLink="/super-admin/dashboard/members" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Members' : ''">
        <span class="material-icons">person_add</span>
        <span *ngIf="!collapsed()">Members</span>
      </a>
      <a routerLink="/super-admin/dashboard/committees" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Committees' : ''">
        <span class="material-icons">groups</span>
        <span *ngIf="!collapsed()">Committees</span>
      </a>
      <a routerLink="/super-admin/dashboard/fraud" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Fraud' : ''">
        <span class="material-icons">report</span>
        <span *ngIf="!collapsed()">Fraud Reports</span>
      </a>
      <a routerLink="/super-admin/dashboard/payments" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Payments' : ''">
        <span class="material-icons">payments</span>
        <span *ngIf="!collapsed()">Payments</span>
      </a>
      <a routerLink="/super-admin/dashboard/announcements" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Announcements' : ''">
        <span class="material-icons">campaign</span>
        <span *ngIf="!collapsed()">Announcements</span>
      </a>
      <a routerLink="/super-admin/dashboard/profile" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'My Profile' : ''">
        <span class="material-icons">manage_accounts</span>
        <span *ngIf="!collapsed()">My Profile</span>
      </a>
      <a routerLink="/super-admin/dashboard/verification" routerLinkActive="active" class="sa-nav-item" [title]="collapsed() ? 'Verifications' : ''">
        <span class="material-icons">verified_user</span>
        <span *ngIf="!collapsed()">Verifications</span>
      </a>
    </nav>

    <div class="sa-sidebar-user" *ngIf="!collapsed()">
      <div class="sa-user-av">{{ getInitials() }}</div>
      <div class="sa-user-info">
        <span class="sa-user-name">{{ auth.currentUser()?.name }}</span>
        <span class="sa-user-role">Super Admin</span>
      </div>
      <button class="sa-logout-btn" (click)="logout()" title="Logout">
        <span class="material-icons">logout</span>
      </button>
    </div>
    <button *ngIf="collapsed()" class="sa-nav-item sa-logout-collapsed" (click)="logout()" title="Logout">
      <span class="material-icons">logout</span>
    </button>
  </aside>

  <!-- Main content -->
  <div class="sa-main" [class.expanded]="collapsed()">
    <header class="sa-topbar">
      <div class="sa-topbar-left">
        <span class="sa-topbar-title">Platform Control Center</span>
      </div>
      <div class="sa-topbar-right">
        <div class="sa-topbar-user">
          <div class="sa-user-av sm">{{ getInitials() }}</div>
          <span>{{ auth.currentUser()?.name }}</span>
          <span class="sa-role-badge">Super Admin</span>
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
    .sa-shell { display: flex; min-height: 100vh; background: #0F172A; font-family: 'Inter', sans-serif; }

    /* Sidebar */
    .sa-sidebar {
      width: 240px;
      background: #020b18;
      border-right: 1px solid rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0; top: 0; bottom: 0;
      z-index: 50;
      transition: width 0.3s ease;
      overflow: hidden;
    }
    .sa-sidebar.collapsed { width: 64px; }

    .sa-sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      min-height: 64px;
    }
    .sa-logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #1E3A5F, #2563EB);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-icons { color: white; font-size: 20px; }
    }
    .sa-logo-text { flex: 1; overflow: hidden; }
    .sa-logo-name { display: block; font-size: 14px; font-weight: 800; color: white; white-space: nowrap; }
    .sa-logo-sub { display: block; font-size: 11px; color: #2563EB; white-space: nowrap; }
    .sa-collapse-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.3);
      display: flex;
      padding: 4px;
      border-radius: 6px;
      flex-shrink: 0;
      .material-icons { font-size: 18px; }
      &:hover { color: white; background: rgba(255,255,255,0.08); }
    }

    .sa-nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .sa-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      color: rgba(255,255,255,0.5);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.15s;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      white-space: nowrap;
      .material-icons { font-size: 20px; flex-shrink: 0; }
      &:hover { background: rgba(255,255,255,0.06); color: white; }
      &.active { background: rgba(37,99,235,0.15); color: #60A5FA; border-left: 3px solid #2563EB; padding-left: 9px; }
    }
    .sa-logout-collapsed { margin-top: auto; margin-bottom: 12px; color: rgba(239,68,68,0.6); &:hover { color: #f87171; background: rgba(239,68,68,0.1); } }

    .sa-sidebar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
    }
    .sa-user-av {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #1E3A5F, #2563EB);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
      &.sm { width: 28px; height: 28px; font-size: 11px; }
    }
    .sa-user-info { flex: 1; overflow: hidden; }
    .sa-user-name { display: block; font-size: 12px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sa-user-role { display: block; font-size: 10px; color: #2563EB; }
    .sa-logout-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.3);
      display: flex;
      padding: 4px;
      border-radius: 6px;
      .material-icons { font-size: 18px; }
      &:hover { color: #f87171; background: rgba(239,68,68,0.1); }
    }

    /* Main */
    .sa-main {
      margin-left: 240px;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      transition: margin-left 0.3s ease;
    }
    .sa-main.expanded { margin-left: 64px; }

    .sa-topbar {
      height: 64px;
      background: #020b18;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .sa-topbar-title { font-size: 16px; font-weight: 700; color: white; }
    .sa-topbar-right { display: flex; align-items: center; gap: 12px; }
    .sa-topbar-user { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.7); }
    .sa-role-badge { background: rgba(37,99,235,0.15); border: 1px solid rgba(37,99,235,0.3); color: #60A5FA; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }

    .sa-content { flex: 1; padding: 28px; overflow-y: auto; }
  `]
})
export class SuperAdminShellComponent {
  collapsed = signal(false);
  constructor(public auth: AuthService) {}
  logout() { this.auth.logout(); }
  getInitials(): string {
    const name = this.auth.currentUser()?.name || 'SA';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
