import { Component, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badgeSignal?: () => number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <span class="material-icons">account_balance</span>
        </div>
        <div class="logo-text" *ngIf="!collapsed">
          <span class="logo-name">CommitteeHub</span>
          <span class="logo-tagline">ROSCA Manager</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-label" *ngIf="!collapsed">MAIN MENU</span>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Dashboard' : ''">
            <span class="material-icons nav-icon">dashboard</span>
            <span class="nav-label" *ngIf="!collapsed">Dashboard</span>
          </a>
        </div>

        <div class="nav-section">
          <span class="nav-section-label" *ngIf="!collapsed">MY COMMITTEES</span>
          <a routerLink="/committees" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item" [title]="collapsed ? 'My Committees' : ''">
            <span class="material-icons nav-icon">groups</span>
            <span class="nav-label" *ngIf="!collapsed">My Committees</span>
          </a>
          <a routerLink="/committees/create" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Create Committee' : ''">
            <span class="material-icons nav-icon">add_circle</span>
            <span class="nav-label" *ngIf="!collapsed">Create Committee</span>
          </a>
          <a routerLink="/members" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Members' : ''">
            <span class="material-icons nav-icon">people</span>
            <span class="nav-label" *ngIf="!collapsed">Members</span>
          </a>
          <a routerLink="/payments" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item" [title]="collapsed ? 'Payments' : ''">
            <span class="material-icons nav-icon">payments</span>
            <span class="nav-label" *ngIf="!collapsed">Payments</span>
            <span class="nav-badge" *ngIf="pendingPaymentsCount() > 0 && !collapsed">{{ pendingPaymentsCount() }}</span>
          </a>
          <a routerLink="/join-requests" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Join Requests' : ''">
            <span class="material-icons nav-icon">person_add</span>
            <span class="nav-label" *ngIf="!collapsed">Join Requests</span>
            <span class="nav-badge" *ngIf="pendingRequestsCount() > 0 && !collapsed">{{ pendingRequestsCount() }}</span>
          </a>
          <a routerLink="/payouts" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Payouts' : ''">
            <span class="material-icons nav-icon">account_balance_wallet</span>
            <span class="nav-label" *ngIf="!collapsed">Payouts</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Reports' : ''">
            <span class="material-icons nav-icon">bar_chart</span>
            <span class="nav-label" *ngIf="!collapsed">Reports</span>
          </a>
        </div>

        <div class="nav-section">
          <span class="nav-section-label" *ngIf="!collapsed">PARTICIPATION</span>
          <a routerLink="/joined-committees" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Joined Committees' : ''">
            <span class="material-icons nav-icon">how_to_reg</span>
            <span class="nav-label" *ngIf="!collapsed">Joined Committees</span>
          </a>
          <a routerLink="/browse" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Browse & Join' : ''">
            <span class="material-icons nav-icon">explore</span>
            <span class="nav-label" *ngIf="!collapsed">Browse & Join</span>
          </a>
          <a routerLink="/my-payments" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item" [title]="collapsed ? 'My Payments' : ''">
            <span class="material-icons nav-icon">receipt_long</span>
            <span class="nav-label" *ngIf="!collapsed">My Payments (Upload)</span>
          </a>
          <a routerLink="/verification" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Get Verified' : ''">
            <span class="material-icons nav-icon">verified_user</span>
            <span class="nav-label" *ngIf="!collapsed">Get Verified</span>
            <span class="nav-badge" *ngIf="!collapsed && !auth.currentUser()?.verified" style="background:#f59e0b">!</span>
          </a>
          <a routerLink="/reviews" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Reviews' : ''">
            <span class="material-icons nav-icon">reviews</span>
            <span class="nav-label" *ngIf="!collapsed">Reviews & Reputation</span>
          </a>
        </div>

        <div class="nav-section nav-bottom">
          <span class="nav-section-label" *ngIf="!collapsed">ACCOUNT</span>
          <a routerLink="/profile" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Profile' : ''">
            <span class="material-icons nav-icon">person</span>
            <span class="nav-label" *ngIf="!collapsed">Profile</span>
          </a>
          <button class="nav-item nav-logout" (click)="onLogout()" [title]="collapsed ? 'Logout' : ''">
            <span class="material-icons nav-icon">logout</span>
            <span class="nav-label" *ngIf="!collapsed">Logout</span>
          </button>
        </div>
      </nav>

      <!-- User Info -->
      <div class="sidebar-user" *ngIf="!collapsed">
        <div class="avatar avatar-sm user-avatar">
          {{ getUserInitials() }}
        </div>
        <div class="user-info">
          <span class="user-name">
            {{ auth.currentUser()?.name || 'User' }}
            <span class="sb-verified" *ngIf="auth.currentUser()?.verified" title="Verified">
              <span class="material-icons">verified</span>
            </span>
          </span>
          <span class="user-email">{{ auth.currentUser()?.email || '' }}</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: #060e1a;
      border-right: none;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      transition: width 0.3s ease;
      overflow: hidden;
      box-shadow: 4px 0 20px rgba(15,23,42,0.15);
      color: #EEF3FA;
    }

    .sidebar.collapsed {
      width: var(--sidebar-collapsed);
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      min-height: var(--navbar-height);
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #0a2540, #2d8cff);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-icons { color: white; font-size: 20px; }
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .logo-name {
      font-size: 16px;
      font-weight: 700;
      color: #EEF3FA;
      white-space: nowrap;
    }

    .logo-tagline {
      font-size: 11px;
      color: #2d8cff;
      white-space: nowrap;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 10px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-section-label {
      font-size: 10px;
      font-weight: 700;
      color: rgba(255,255,255,0.35);
      letter-spacing: 0.08em;
      padding: 8px 10px 4px;
      text-transform: uppercase;
    }

    .nav-bottom {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      color: #CBD5E1;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s ease;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      white-space: nowrap;

      &:hover {
        background: rgba(45,140,255,0.08);
        color: #EEF3FA;
        .nav-icon { color: #2d8cff; }
      }

      &.active {
        background: rgba(45,140,255,0.15);
        color: #EEF3FA;
        font-weight: 600;
        border-left: 3px solid #2d8cff;
        padding-left: 9px;
        .nav-icon { color: #2d8cff; }
      }
    }

    .nav-logout:hover {
      background: rgba(239,68,68,0.15) !important;
      color: #fca5a5 !important;
      .nav-icon { color: #fca5a5 !important; }
    }

    .nav-icon {
      font-size: 20px;
      color: rgba(255,255,255,0.35);
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .nav-label { flex: 1; }

    .nav-badge {
      background: #060e1a;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.15);
    }

    .user-avatar {
      background: linear-gradient(135deg, #0a2540, #2d8cff);
      font-size: 13px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: #EEF3FA;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .sb-verified { display: inline-flex; align-items: center; flex-shrink: 0; .material-icons { font-size: 13px; color: #2d8cff; } }

    .user-email {
      font-size: 11px;
      color: rgba(255,255,255,0.35);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;

  pendingPaymentsCount = signal(0);
  pendingRequestsCount = signal(0);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    // MY COMMITTEES section
    { label: 'My Committees', icon: 'groups', route: '/committees' },
    { label: 'Create Committee', icon: 'add_circle', route: '/committees/create' },
    { label: 'Members', icon: 'people', route: '/members' },
    { label: 'Payments', icon: 'payments', route: '/payments', badgeSignal: () => this.pendingPaymentsCount() },
    { label: 'Join Requests', icon: 'person_add', route: '/join-requests', badgeSignal: () => this.pendingRequestsCount() },
    { label: 'Payouts', icon: 'account_balance_wallet', route: '/payouts' },
    { label: 'Reports', icon: 'bar_chart', route: '/reports' },
  ];

  constructor(public auth: AuthService, private dataService: DataService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await this.loadPendingCount();
  }

  async loadPendingCount() {
    try {
      const [payments, requests] = await Promise.all([
        this.dataService.getPayments(),
        this.dataService.getPendingJoinRequestsCount()
      ]);
      const count = payments.filter(p =>
        p.status === 'pending' || p.status === 'under_review'
      ).length;
      this.pendingPaymentsCount.set(count);
      this.pendingRequestsCount.set(requests);
    } catch (e) {
      // non-critical
    }
  }

  getUserInitials(): string {
    const name = this.auth.currentUser()?.name || 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onLogout() {
    this.auth.logout();
  }
}
