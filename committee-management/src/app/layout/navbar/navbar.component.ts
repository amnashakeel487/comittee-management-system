import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <button class="btn btn-ghost btn-icon toggle-btn" (click)="toggleSidebar.emit()">
          <span class="material-icons">{{ sidebarCollapsed ? 'menu_open' : 'menu' }}</span>
        </button>
        <div class="breadcrumb">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
      </div>

      <div class="navbar-right">
        <!-- Search -->
        <div class="search-box">
          <span class="material-icons search-icon">search</span>
          <input type="text" placeholder="Search..." class="search-input">
        </div>

        <!-- Theme Toggle -->
        <button class="btn btn-ghost btn-icon" (click)="themeService.toggle()" title="Toggle theme">
          <span class="material-icons">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
        </button>

        <!-- Notifications -->
        <div class="notification-wrapper">
          <button class="btn btn-ghost btn-icon" (click)="toggleNotifications()">
            <span class="material-icons">notifications</span>
            <span class="notif-badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
          </button>

          <div class="dropdown notifications-dropdown" *ngIf="showNotifications()">
            <div class="dropdown-header">
              <span>Notifications</span>
              <button class="btn btn-ghost btn-sm" (click)="markAllRead()" *ngIf="unreadCount() > 0">
                Mark all read
              </button>
            </div>
            <div class="notif-list">
              <div *ngIf="notifications().length === 0" class="notif-empty">
                <span class="material-icons">notifications_none</span>
                <p>No notifications yet</p>
              </div>
              <div *ngFor="let n of notifications()" class="notif-item" [class.unread]="!n.read"
                   (click)="markRead(n)">
                <div class="notif-icon" [ngClass]="getNotifIconClass(n.type)">
                  <span class="material-icons">{{ getNotifIcon(n.type) }}</span>
                </div>
                <div class="notif-content">
                  <p class="notif-title">{{ n.title }}</p>
                  <p class="notif-msg">{{ n.message }}</p>
                  <span class="notif-time">{{ getTimeAgo(n.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Menu -->
        <div class="user-menu-wrapper">
          <button class="user-menu-btn" (click)="toggleUserMenu()">
            <div class="avatar avatar-sm user-avatar">{{ getUserInitials() }}</div>
            <div class="user-info">
              <span class="user-name">
                {{ auth.currentUser()?.name || 'User' }}
                <span class="verified-badge-nav" *ngIf="auth.currentUser()?.verified" title="Verified">
                  <span class="material-icons">verified</span>
                </span>
              </span>
              <span class="user-role">{{ auth.currentUser()?.role === 'super_admin' ? 'Super Admin' : 'Admin' }}</span>
            </div>
            <span class="material-icons chevron">expand_more</span>
          </button>

          <div class="dropdown user-dropdown" *ngIf="showUserMenu()">
            <a routerLink="/profile" class="dropdown-item" (click)="showUserMenu.set(false)">
              <span class="material-icons">person</span> My Profile
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" (click)="logout()">
              <span class="material-icons">logout</span> Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Overlay to close dropdowns -->
    <div class="dropdown-overlay" *ngIf="showNotifications() || showUserMenu()"
         (click)="closeAll()"></div>
  `,
  styles: [`
    .navbar {
      height: var(--navbar-height);
      background: #ffffff;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 1px 4px rgba(15,23,42,0.08);
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .toggle-btn { color: #475569; }

    .page-title {
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #EEF3FA;
      border-radius: 8px;
      padding: 8px 14px;
      border: 1.5px solid #E2E8F0;
      transition: all 0.2s;

      &:focus-within {
        background: white;
        border-color: #2d8cff;
        box-shadow: 0 0 0 3px rgba(30,58,95,0.12);
      }
    }

    .search-icon { font-size: 18px; color: #94A3B8; }

    .search-input {
      border: none;
      background: none;
      outline: none;
      font-size: 14px;
      color: #334155;
      width: 200px;
      &::placeholder { color: #94A3B8; }
    }

    .notification-wrapper, .user-menu-wrapper {
      position: relative;
    }

    .notif-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #2d8cff;
      color: white;
      font-size: 10px;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(15,23,42,0.15);
      border: 1px solid #E2E8F0;
      z-index: 200;
      animation: slideUp 0.2s ease;
    }

    .notifications-dropdown {
      width: 360px;
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 12px;
      border-bottom: 1px solid #E2E8F0;
      font-weight: 600;
      font-size: 15px;
      color: #0F172A;
    }

    .notif-list { padding: 8px; }

    .notif-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      transition: background 0.15s;
      cursor: pointer;

      &:hover { background: #EEF3FA; }
      &.unread { background: #EEF3FA; }
    }

    .notif-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.success { background: var(--success-light); .material-icons { color: var(--success); font-size: 18px; } }
      &.warning { background: var(--warning-light); .material-icons { color: var(--warning); font-size: 18px; } }
      &.info { background: #EEF3FA; .material-icons { color: #2d8cff; font-size: 18px; } }
    }

    .notif-content { flex: 1; }
    .notif-title { font-size: 13px; font-weight: 600; color: #0F172A; }
    .notif-msg { font-size: 12px; color: #475569; margin-top: 2px; }
    .notif-time { font-size: 11px; color: #94A3B8; margin-top: 4px; display: block; }

    .user-menu-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px 6px 6px;
      border-radius: 10px;
      border: 1.5px solid #E2E8F0;
      background: white;
      cursor: pointer;
      transition: all 0.15s;

      &:hover { border-color: #2d8cff; background: #EEF3FA; }
    }

    .user-avatar {
      background: linear-gradient(135deg, #2d8cff, #3B82F6);
      font-size: 13px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .user-name { font-size: 13px; font-weight: 600; color: #f0f4ff; display: flex; align-items: center; gap: 4px; }
    .verified-badge-nav { display: inline-flex; align-items: center; .material-icons { font-size: 14px; color: #2d8cff; } }
    .user-role { font-size: 11px; color: rgba(255,255,255,0.4); }
    .chevron { font-size: 18px; color: #94A3B8; }

    .user-dropdown { width: 200px; padding: 8px; }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 14px;
      color: #334155;
      text-decoration: none;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      transition: background 0.15s;

      &:hover { background: #EEF3FA; }
      &.danger { color: var(--danger); &:hover { background: #fee2e2; } }

      .material-icons { font-size: 18px; color: #2E5490; }
    }

    .dropdown-divider { height: 1px; background: #E2E8F0; margin: 4px 0; }

    .notif-empty {
      text-align: center;
      padding: 32px 20px;
      color: #94A3B8;
      .material-icons { font-size: 40px; display: block; margin-bottom: 8px; color: #CBD5E1; }
      p { font-size: 13px; margin: 0; }
    }

    .dropdown-overlay {
      position: fixed;
      inset: 0;
      z-index: 150;
    }

    @media (max-width: 768px) {
      .search-box { display: none; }
      .user-info { display: none; }
      .page-title { font-size: 16px; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  @Input() sidebarCollapsed = false;
  @Input() pageTitle = 'Dashboard';
  @Output() toggleSidebar = new EventEmitter<void>();

  showNotifications = signal(false);
  showUserMenu = signal(false);
  notifications = signal<any[]>([]);
  unreadCount = signal(0);

  constructor(
    public auth: AuthService,
    public themeService: ThemeService,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await this.loadNotifications();
  }

  async loadNotifications() {
    try {
      const data = await this.dataService.getNotifications();
      this.notifications.set(data);
      this.unreadCount.set(data.filter((n: any) => !n.read).length);
    } catch (e) {
      // silently fail — notifications are non-critical
    }
  }

  async toggleNotifications() {
    const opening = !this.showNotifications();
    this.showNotifications.update(v => !v);
    this.showUserMenu.set(false);
    // Reload when opening to get fresh data
    if (opening) await this.loadNotifications();
  }

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
    this.showNotifications.set(false);
  }

  closeAll() {
    this.showNotifications.set(false);
    this.showUserMenu.set(false);
  }

  async markRead(notification: any) {
    if (notification.read) return;
    await this.dataService.markNotificationRead(notification.id);
    this.notifications.update(list =>
      list.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    this.unreadCount.update(c => Math.max(0, c - 1));
  }

  async markAllRead() {
    await this.dataService.markAllNotificationsRead();
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.unreadCount.set(0);
  }

  getNotifIcon(type: string): string {
    return { success: 'check_circle', warning: 'warning', error: 'error', info: 'info' }[type] || 'notifications';
  }

  getNotifIconClass(type: string): string {
    return { success: 'success', warning: 'warning', error: 'error', info: 'info' }[type] || 'info';
  }

  getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  getUserInitials(): string {
    const name = this.auth.currentUser()?.name || 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout() {
    this.auth.logout();
  }
}
