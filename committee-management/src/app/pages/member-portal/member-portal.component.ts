import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import { MemberDashboardComponent } from './components/member-dashboard.component';
import { MemberCommitteesComponent } from './components/member-committees.component';
import { MemberPaymentsComponent } from './components/member-payments.component';
import { MemberHistoryComponent } from './components/member-history.component';
import { MemberNotificationsComponent } from './components/member-notifications.component';
import { MemberProfileComponent } from './components/member-profile.component';
import { MemberBrowseCommitteesComponent } from './components/member-browse-committees.component';
import { ToastContainerComponent } from '../../shared/toast-container/toast-container.component';

@Component({
  selector: 'app-member-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive,
    MemberDashboardComponent, MemberCommitteesComponent, MemberPaymentsComponent,
    MemberHistoryComponent, MemberNotificationsComponent, MemberProfileComponent,
    MemberBrowseCommitteesComponent, ToastContainerComponent],
  templateUrl: './member-portal.component.html',
  styleUrls: ['./member-portal.component.scss']
})
export class MemberPortalComponent implements OnInit {
  sidebarCollapsed = signal(false);
  unreadCount = signal(0);
  currentPage = signal('dashboard');

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', page: 'dashboard' },
    { label: 'My Committees', icon: 'groups', page: 'committees' },
    { label: 'Browse Committees', icon: 'explore', page: 'browse' },
    { label: 'Payments', icon: 'payments', page: 'payments' },
    { label: 'Payment History', icon: 'receipt_long', page: 'history' },
    { label: 'Notifications', icon: 'notifications', page: 'notifications' },
    { label: 'Profile', icon: 'person', page: 'profile' },
  ];

  constructor(
    public auth: AuthService,
    private supabase: SupabaseService,
    private toast: ToastService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await this.loadUnreadCount();
  }

  async loadUnreadCount() {
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return;
      const { count } = await this.supabase.client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      this.unreadCount.set(count || 0);
    } catch (e) {}
  }

  setPage(page: string) {
    this.currentPage.set(page);
    if (page === 'notifications') this.unreadCount.set(0);
  }

  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }

  getInitials(): string {
    const name = this.auth.currentUser()?.name || 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout() { this.auth.logout(); }
}
