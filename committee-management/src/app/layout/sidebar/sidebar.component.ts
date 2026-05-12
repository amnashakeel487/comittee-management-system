import { Component, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
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
        <!-- MAIN MENU (no header — just Dashboard) -->
        <div class="nav-section">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Dashboard' : ''">
            <span class="material-icons nav-icon">dashboard</span>
            <span class="nav-label" *ngIf="!collapsed">Dashboard</span>
          </a>
        </div>

        <!-- MY COMMITTEES (collapsible) — things I run as an admin -->
        <div class="nav-section">
          <button *ngIf="!collapsed"
                  type="button"
                  class="nav-section-header"
                  [class.open]="isOpen('committees')"
                  (click)="toggleSection('committees')">
            <span class="nav-section-label">MY COMMITTEES</span>
            <span class="material-icons section-chevron">{{ isOpen('committees') ? 'expand_more' : 'chevron_right' }}</span>
          </button>
          <div class="nav-section-body" [class.open]="collapsed || isOpen('committees')">
            <a routerLink="/committees" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item" [title]="collapsed ? 'My Committees' : ''">
              <span class="material-icons nav-icon">groups</span>
              <span class="nav-label" *ngIf="!collapsed">My Committees</span>
            </a>
            <a routerLink="/committees/create" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Create Committee' : ''">
              <span class="material-icons nav-icon">add_circle</span>
              <span class="nav-label" *ngIf="!collapsed">Create Committee</span>
            </a>
            <a routerLink="/join-requests" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Join Requests' : ''">
              <span class="material-icons nav-icon">person_add</span>
              <span class="nav-label" *ngIf="!collapsed">Join Requests</span>
              <span class="nav-badge" *ngIf="pendingRequestsCount() > 0 && !collapsed">{{ pendingRequestsCount() }}</span>
            </a>
          </div>
        </div>

        <!-- FINANCE (collapsible) — money flow as an admin -->
        <div class="nav-section">
          <button *ngIf="!collapsed"
                  type="button"
                  class="nav-section-header"
                  [class.open]="isOpen('finance')"
                  (click)="toggleSection('finance')">
            <span class="nav-section-label">FINANCE</span>
            <span class="material-icons section-chevron">{{ isOpen('finance') ? 'expand_more' : 'chevron_right' }}</span>
          </button>
          <div class="nav-section-body" [class.open]="collapsed || isOpen('finance')">
            <a routerLink="/payments" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item" [title]="collapsed ? 'Payments' : ''">
              <span class="material-icons nav-icon">payments</span>
              <span class="nav-label" *ngIf="!collapsed">Payments</span>
              <span class="nav-badge" *ngIf="pendingPaymentsCount() > 0 && !collapsed">{{ pendingPaymentsCount() }}</span>
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
        </div>

        <!-- PARTICIPATION (collapsible) — things I do as a member -->
        <div class="nav-section">
          <button *ngIf="!collapsed"
                  type="button"
                  class="nav-section-header"
                  [class.open]="isOpen('participation')"
                  (click)="toggleSection('participation')">
            <span class="nav-section-label">PARTICIPATION</span>
            <span class="material-icons section-chevron">{{ isOpen('participation') ? 'expand_more' : 'chevron_right' }}</span>
          </button>
          <div class="nav-section-body" [class.open]="collapsed || isOpen('participation')">
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
              <span class="nav-label" *ngIf="!collapsed">My Payments</span>
            </a>
          </div>
        </div>

        <!-- ACCOUNT (collapsible) — my identity & reputation -->
        <div class="nav-section">
          <button *ngIf="!collapsed"
                  type="button"
                  class="nav-section-header"
                  [class.open]="isOpen('account')"
                  (click)="toggleSection('account')">
            <span class="nav-section-label">ACCOUNT</span>
            <span class="material-icons section-chevron">{{ isOpen('account') ? 'expand_more' : 'chevron_right' }}</span>
          </button>
          <div class="nav-section-body" [class.open]="collapsed || isOpen('account')">
            <a routerLink="/profile" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Profile' : ''">
              <span class="material-icons nav-icon">person</span>
              <span class="nav-label" *ngIf="!collapsed">Profile</span>
            </a>
            <a routerLink="/verification" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Get Verified' : ''">
              <span class="material-icons nav-icon">verified_user</span>
              <span class="nav-label" *ngIf="!collapsed">Get Verified</span>
              <span class="nav-badge" *ngIf="!collapsed && !auth.currentUser()?.verified" style="background:#f59e0b">!</span>
            </a>
            <a routerLink="/reviews" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Reviews' : ''">
              <span class="material-icons nav-icon">reviews</span>
              <span class="nav-label" *ngIf="!collapsed">Reviews</span>
            </a>
          </div>
        </div>

        <!-- Logout (always pinned bottom) -->
        <div class="nav-section nav-bottom">
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
      gap: 10px;
      padding: 14px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      min-height: var(--navbar-height);
    }

    .logo-icon {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #0a2540, #2d8cff);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-icons { color: white; font-size: 18px; }
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
      padding: 8px 8px 4px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
      /* Slim scrollbar in WebKit */
      &::-webkit-scrollbar { width: 5px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      &::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    /* Click-to-collapse section header */
    .nav-section-header {
      all: unset;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px 4px;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.04); }
    }

    .nav-section-label {
      font-size: 10px;
      font-weight: 700;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .section-chevron {
      font-size: 16px !important;
      color: rgba(255,255,255,0.35);
      transition: transform 0.2s ease, color 0.15s;
    }
    .nav-section-header.open .section-chevron { color: rgba(255,255,255,0.55); }
    .nav-section-header:hover .section-chevron { color: #2d8cff; }

    /* Collapsible body */
    .nav-section-body {
      display: flex;
      flex-direction: column;
      gap: 1px;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease;
    }
    .nav-section-body.open {
      max-height: 600px; /* enough for any realistic section */
    }

    .nav-bottom {
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 7px 10px;
      border-radius: 7px;
      color: #CBD5E1;
      text-decoration: none;
      font-size: 13px;
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
        padding-left: 7px;
        .nav-icon { color: #2d8cff; }
      }
    }

    .nav-logout:hover {
      background: rgba(239,68,68,0.15) !important;
      color: #fca5a5 !important;
      .nav-icon { color: #fca5a5 !important; }
    }

    .nav-icon {
      font-size: 18px;
      color: rgba(255,255,255,0.4);
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .nav-label { flex: 1; }

    .nav-badge {
      background: #2d8cff;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.18);
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

  // Routes that live under each collapsible section.  Used both to
  // auto-open the section that owns the current route and to persist
  // expand/collapse state in localStorage.
  private sectionRoutes: Record<string, string[]> = {
    committees:    ['/committees', '/join-requests'],
    finance:       ['/payments', '/payouts', '/reports'],
    participation: ['/joined-committees', '/browse', '/my-payments'],
    account:       ['/profile', '/verification', '/reviews']
  };

  // Default to collapsed for all — auto-opens the active one on init.
  // Keeps the sidebar from spilling beyond the viewport.
  sectionsOpen = signal<Record<string, boolean>>({
    committees: false,
    finance: false,
    participation: false,
    account: false
  });

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'My Committees', icon: 'groups', route: '/committees' },
    { label: 'Create Committee', icon: 'add_circle', route: '/committees/create' },
    { label: 'Payments', icon: 'payments', route: '/payments', badgeSignal: () => this.pendingPaymentsCount() },
    { label: 'Join Requests', icon: 'person_add', route: '/join-requests', badgeSignal: () => this.pendingRequestsCount() },
    { label: 'Payouts', icon: 'account_balance_wallet', route: '/payouts' },
    { label: 'Reports', icon: 'bar_chart', route: '/reports' },
  ];

  constructor(
    public auth: AuthService,
    private dataService: DataService,
    private router: Router
  ) {
    // Restore any previously toggled state from localStorage so the
    // user's preference sticks across refreshes / navigations.
    try {
      const saved = localStorage.getItem('sidebar-sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.sectionsOpen.set({ ...this.sectionsOpen(), ...parsed });
        }
      }
    } catch { /* ignore corrupt local storage */ }

    // Auto-open the section that owns the current URL on every nav,
    // so that the relevant items are always visible without manual
    // scrolling / expanding.
    this.openActiveSection(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.openActiveSection(e.urlAfterRedirects || e.url));
  }

  async ngOnInit() {
    await this.auth.waitForAuth();
    await this.loadPendingCount();
  }

  /** Auto-expand whichever section contains the supplied URL. */
  private openActiveSection(url: string) {
    if (!url) return;
    const path = url.split('?')[0];
    let changed = false;
    const next = { ...this.sectionsOpen() };
    for (const [key, prefixes] of Object.entries(this.sectionRoutes)) {
      const inside = prefixes.some(p => path === p || path.startsWith(p + '/'));
      if (inside && !next[key]) { next[key] = true; changed = true; }
    }
    if (changed) this.sectionsOpen.set(next);
  }

  isOpen(section: string): boolean {
    return !!this.sectionsOpen()[section];
  }

  toggleSection(section: string) {
    const next = { ...this.sectionsOpen(), [section]: !this.sectionsOpen()[section] };
    this.sectionsOpen.set(next);
    try {
      localStorage.setItem('sidebar-sections', JSON.stringify(next));
    } catch { /* ignore */ }
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
