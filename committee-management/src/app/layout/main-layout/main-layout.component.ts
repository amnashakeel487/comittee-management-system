import { Component, signal, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ToastContainerComponent } from '../../shared/toast-container/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NavbarComponent, ToastContainerComponent],
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar [collapsed]="sidebarCollapsed()"></app-sidebar>

      <div class="main-content">
        <app-navbar
          [sidebarCollapsed]="sidebarCollapsed()"
          [pageTitle]="currentPageTitle()"
          (toggleSidebar)="toggleSidebar()">
        </app-navbar>

        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-primary, #f8fafc);
    }

    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      transition: margin-left 0.3s ease;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .app-layout.sidebar-collapsed .main-content {
      margin-left: var(--sidebar-collapsed);
    }

    .page-content {
      flex: 1;
      padding: 28px;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .main-content { margin-left: 0; }
      .page-content { padding: 16px; }
    }
  `]
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);

  private routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/committees': 'My Committees',
    '/committees/create': 'Create Committee',
    '/members': 'Members',
    '/payments': 'Payments',
    '/payouts': 'Payouts',
    '/reports': 'Reports',
    '/profile': 'Profile',
  };

  currentPageTitle = signal('Dashboard');

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url = e.urlAfterRedirects.split('?')[0];
      this.currentPageTitle.set(this.routeTitles[url] || 'CommitteeHub');
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }
}
