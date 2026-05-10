import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberDataService } from '../../../services/member-data.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-member-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="m-notifications">
      <div class="page-header">
        <div class="page-title"><h1>Notifications</h1><p>Your recent activity and alerts</p></div>
        <button class="btn-outline" (click)="markAllRead()" *ngIf="hasUnread()">
          <span class="material-icons">done_all</span> Mark All Read
        </button>
      </div>

      <div *ngIf="loading()" class="loading-center"><div class="spinner"></div></div>

      <div class="notif-card" *ngIf="!loading()">
        <div *ngIf="notifications().length === 0" class="empty-state">
          <span class="material-icons empty-icon">notifications_none</span>
          <h3>No Notifications</h3>
          <p>You're all caught up!</p>
        </div>

        <div *ngFor="let n of notifications()" class="notif-item" [class.unread]="!n.read">
          <div class="notif-icon" [ngClass]="'notif-' + n.type">
            <span class="material-icons">{{ getIcon(n.type) }}</span>
          </div>
          <div class="notif-body">
            <p class="notif-title">{{ n.title }}</p>
            <p class="notif-msg">{{ n.message }}</p>
            <span class="notif-time">{{ n.created_at | date:'MMM d, yyyy h:mm a' }}</span>
          </div>
          <div class="unread-dot" *ngIf="!n.read"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .m-notifications { animation: fadeIn 0.3s ease; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; color: #2A1F14; }
    .page-header p { font-size: 14px; color: #93785B; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: 1.5px solid #865D36; background: transparent; color: #865D36; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; &:hover { background: #F0E8DF; } .material-icons { font-size: 16px; } }

    .notif-card { background: white; border-radius: 12px; border: 1px solid #E2D8CE; overflow: hidden; box-shadow: 0 1px 4px rgba(62,54,46,0.06); }
    .empty-state { text-align: center; padding: 60px 20px; .empty-icon { font-size: 56px; color: #C9BAA8; display: block; margin-bottom: 16px; } h3 { font-size: 18px; color: #4E3D2E; margin-bottom: 8px; } p { font-size: 14px; color: #A69080; } }

    .notif-item { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; border-bottom: 1px solid #F0EBE4; transition: background 0.12s; &:last-child { border-bottom: none; } &:hover { background: #FAF7F4; } &.unread { background: #F0E8DF; } }
    .notif-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { font-size: 20px; } }
    .notif-info { background: #F0E8DF; .material-icons { color: #865D36; } }
    .notif-success { background: #d1fae5; .material-icons { color: #10b981; } }
    .notif-warning { background: #fef3c7; .material-icons { color: #f59e0b; } }
    .notif-error { background: #fee2e2; .material-icons { color: #ef4444; } }
    .notif-body { flex: 1; }
    .notif-title { font-size: 14px; font-weight: 600; color: #2A1F14; margin: 0 0 4px; }
    .notif-msg { font-size: 13px; color: #6B5544; margin: 0 0 6px; line-height: 1.5; }
    .notif-time { font-size: 11px; color: #A69080; }
    .unread-dot { width: 8px; height: 8px; background: #865D36; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
  `]
})
export class MemberNotificationsComponent implements OnInit {
  loading = signal(true);
  notifications = signal<any[]>([]);

  constructor(private memberData: MemberDataService, private toast: ToastService, private auth: AuthService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const data = await this.memberData.getNotifications();
      this.notifications.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  hasUnread() { return this.notifications().some(n => !n.read); }

  async markAllRead() {
    await this.memberData.markAllRead();
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.toast.success('All notifications marked as read');
  }

  getIcon(type: string): string {
    return { info: 'info', success: 'check_circle', warning: 'warning', error: 'error' }[type] || 'notifications';
  }
}
