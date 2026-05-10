import { Component, OnInit, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberDataService } from '../../../services/member-data.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-member-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="m-dashboard">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="wb-left">
          <div class="wb-avatar">{{ getInitials() }}</div>
          <div>
            <h1>Welcome back, {{ auth.currentUser()?.name }}!</h1>
            <p>Here's your committee activity overview</p>
          </div>
        </div>
        <div class="wb-date">
          <span class="material-icons">calendar_today</span>
          {{ today | date:'EEEE, MMMM d, yyyy' }}
        </div>
      </div>

      <div *ngIf="loading()" class="loading-center"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading()">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card" (click)="navigate.emit('committees')">
            <div class="stat-icon brown"><span class="material-icons">groups</span></div>
            <div class="stat-body">
              <div class="stat-value">{{ stats().committees }}</div>
              <div class="stat-label">Committees Joined</div>
            </div>
            <span class="material-icons stat-arrow">arrow_forward_ios</span>
          </div>
          <div class="stat-card" (click)="navigate.emit('history')">
            <div class="stat-icon green"><span class="material-icons">check_circle</span></div>
            <div class="stat-body">
              <div class="stat-value">{{ stats().paid }}</div>
              <div class="stat-label">Paid Payments</div>
            </div>
            <span class="material-icons stat-arrow">arrow_forward_ios</span>
          </div>
          <div class="stat-card" (click)="navigate.emit('payments')">
            <div class="stat-icon orange"><span class="material-icons">pending_actions</span></div>
            <div class="stat-body">
              <div class="stat-value">{{ stats().pending }}</div>
              <div class="stat-label">Pending Payments</div>
            </div>
            <span class="material-icons stat-arrow">arrow_forward_ios</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon tan"><span class="material-icons">format_list_numbered</span></div>
            <div class="stat-body">
              <div class="stat-value">{{ stats().myTurn || '—' }}</div>
              <div class="stat-label">My Turn Position</div>
            </div>
          </div>
        </div>

        <!-- My Committees Quick View -->
        <div class="section-card" *ngIf="memberships().length > 0">
          <div class="section-header">
            <h3><span class="material-icons">groups</span> My Committees</h3>
            <button class="btn-link" (click)="navigate.emit('committees')">
              View All <span class="material-icons">arrow_forward</span>
            </button>
          </div>
          <div class="committees-grid">
            <div *ngFor="let m of memberships().slice(0, 3)" class="committee-mini-card"
                 (click)="navigate.emit('committees')">
              <div class="cmc-header">
                <div class="cmc-icon"><span class="material-icons">groups</span></div>
                <span class="badge" [ngClass]="{
                  'badge-success': m.committee.status === 'active',
                  'badge-warning': m.committee.status === 'pending',
                  'badge-gray': m.committee.status === 'completed'
                }">{{ m.committee.status | titlecase }}</span>
              </div>
              <h4>{{ m.committee.name }}</h4>
              <div class="cmc-stats">
                <span><span class="material-icons">payments</span> PKR {{ m.committee.monthly_amount | number }}</span>
                <span><span class="material-icons">format_list_numbered</span> Turn #{{ m.member.payout_order }}</span>
              </div>
              <div class="progress-bar" *ngIf="m.committee.status === 'active'">
                <div class="progress-fill" [style.width.%]="getProgress(m.committee)"></div>
              </div>
              <div class="cmc-progress-label" *ngIf="m.committee.status === 'active'">
                Month {{ m.committee.current_month || 0 }} / {{ m.committee.duration_months }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Payments -->
        <div class="section-card" *ngIf="recentPayments().length > 0">
          <div class="section-header">
            <h3><span class="material-icons">receipt_long</span> Recent Payments</h3>
            <button class="btn-link" (click)="navigate.emit('history')">
              View All <span class="material-icons">arrow_forward</span>
            </button>
          </div>
          <div class="payments-list">
            <div *ngFor="let p of recentPayments().slice(0, 5)" class="payment-row">
              <div class="pr-month">
                <span class="material-icons">calendar_month</span>
                Month {{ p.month }}
              </div>
              <div class="pr-committee">{{ p.committees?.name || '—' }}</div>
              <div class="pr-amount">PKR {{ p.amount | number }}</div>
              <div class="pr-date">{{ p.payment_date ? (p.payment_date | date:'MMM d') : '—' }}</div>
              <span class="badge" [ngClass]="{
                'badge-success': p.status === 'approved',
                'badge-info': p.status === 'under_review',
                'badge-warning': p.status === 'pending',
                'badge-danger': p.status === 'rejected'
              }">{{ getStatusLabel(p.status) }}</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="memberships().length === 0" class="empty-state-card">
          <span class="material-icons">groups</span>
          <h3>No Committee Memberships Yet</h3>
          <p>You haven't been added to any committee. Contact your admin.</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .m-dashboard { animation: fadeIn 0.3s ease; }

    /* Welcome Banner */
    .welcome-banner {
      background: linear-gradient(135deg, #3E362E 0%, #865D36 60%, #AC8968 100%);
      border-radius: 16px; padding: 28px 32px;
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; color: white; flex-wrap: wrap; gap: 16px;
      box-shadow: 0 4px 20px rgba(62,54,46,0.25);
    }
    .wb-left { display: flex; align-items: center; gap: 16px; }
    .wb-left h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: white; }
    .wb-left p { font-size: 14px; opacity: 0.8; margin: 0; color: rgba(255,255,255,0.85); }
    .wb-avatar { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: white; border: 2px solid rgba(255,255,255,0.35); flex-shrink: 0; }
    .wb-date { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.85); .material-icons { font-size: 16px; } }

    .loading-center { display: flex; justify-content: center; padding: 80px; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      background: white; border-radius: 12px; padding: 20px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 1px 4px rgba(62,54,46,0.08); cursor: pointer;
      transition: all 0.2s; border: 1px solid #E2D8CE;
      &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(62,54,46,0.14); border-color: #AC8968; }
    }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { font-size: 24px; } }
    .stat-icon.brown { background: #F0E8DF; .material-icons { color: #865D36; } }
    .stat-icon.green { background: #d1fae5; .material-icons { color: #10b981; } }
    .stat-icon.orange { background: #fef3c7; .material-icons { color: #f59e0b; } }
    .stat-icon.tan { background: #EDE0D4; .material-icons { color: #93785B; } }
    .stat-body { flex: 1; }
    .stat-value { font-size: 26px; font-weight: 800; color: #2A1F14; line-height: 1; }
    .stat-label { font-size: 12px; color: #93785B; margin-top: 4px; }
    .stat-arrow { font-size: 14px; color: #C9BAA8; }

    /* Section Cards */
    .section-card { background: white; border-radius: 12px; border: 1px solid #E2D8CE; margin-bottom: 24px; overflow: hidden; box-shadow: 0 1px 4px rgba(62,54,46,0.06); }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1px solid #F0EBE4; }
    .section-header h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; margin: 0; color: #2A1F14; .material-icons { font-size: 18px; color: #865D36; } }
    .btn-link { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: #865D36; font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.15s; &:hover { background: #F0E8DF; } .material-icons { font-size: 16px; } }

    /* Committee mini cards */
    .committees-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px; }
    .committee-mini-card { background: #FAF7F4; border-radius: 10px; padding: 16px; cursor: pointer; border: 1px solid #E2D8CE; transition: all 0.15s; &:hover { border-color: #865D36; background: #F0E8DF; transform: translateY(-1px); } }
    .cmc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .cmc-icon { width: 36px; height: 36px; background: #F0E8DF; border-radius: 8px; display: flex; align-items: center; justify-content: center; .material-icons { color: #865D36; font-size: 18px; } }
    .committee-mini-card h4 { font-size: 14px; font-weight: 700; color: #2A1F14; margin: 0 0 10px; }
    .cmc-stats { display: flex; gap: 12px; margin-bottom: 10px; }
    .cmc-stats span { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #6B5544; .material-icons { font-size: 14px; color: #93785B; } }
    .cmc-progress-label { font-size: 11px; color: #A69080; margin-top: 4px; }

    /* Progress bar */
    .progress-bar { height: 6px; background: #E2D8CE; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #865D36, #AC8968); border-radius: 3px; transition: width 0.5s ease; }

    /* Payments list */
    .payments-list { padding: 4px 0; }
    .payment-row { display: flex; align-items: center; gap: 16px; padding: 12px 20px; border-bottom: 1px solid #FAF7F4; &:last-child { border-bottom: none; } &:hover { background: #FAF7F4; } }
    .pr-month { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #2A1F14; min-width: 90px; .material-icons { font-size: 14px; color: #865D36; } }
    .pr-committee { flex: 1; font-size: 13px; color: #6B5544; }
    .pr-amount { font-size: 14px; font-weight: 700; color: #865D36; min-width: 100px; }
    .pr-date { min-width: 70px; font-size: 12px; color: #A69080; }

    /* Badges */
    .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-gray { background: #F0EBE4; color: #6B5544; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #EDE0D4; color: #4E3D2E; }

    /* Empty state */
    .empty-state-card { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px solid #E2D8CE; .material-icons { font-size: 56px; color: #C9BAA8; display: block; margin-bottom: 16px; } h3 { font-size: 18px; color: #4E3D2E; margin-bottom: 8px; } p { font-size: 14px; color: #A69080; } }

    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .committees-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr 1fr; } .committees-grid { grid-template-columns: 1fr; } .welcome-banner { flex-direction: column; } }
  `]
})
export class MemberDashboardComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  loading = signal(true);
  memberships = signal<any[]>([]);
  recentPayments = signal<any[]>([]);
  stats = signal({ committees: 0, paid: 0, pending: 0, myTurn: '' as string | number });
  today = new Date();

  constructor(public auth: AuthService, private memberData: MemberDataService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const [memberships, payments] = await Promise.all([
        this.memberData.getMemberships(),
        this.memberData.getPayments()
      ]);
      this.memberships.set(memberships);
      this.recentPayments.set(payments);
      const paid = payments.filter((p: any) => p.status === 'approved').length;
      const pending = payments.filter((p: any) => p.status === 'pending' || p.status === 'under_review').length;
      const myTurn = memberships.length > 0 ? memberships[0].member.payout_order : '—';
      this.stats.set({ committees: memberships.length, paid, pending, myTurn });
    } finally {
      this.loading.set(false);
    }
  }

  getProgress(c: any): number {
    if (!c?.duration_months) return 0;
    return Math.round(((c.current_month || 0) / c.duration_months) * 100);
  }

  getStatusLabel(s: string): string {
    return { approved: 'Approved', rejected: 'Rejected', under_review: 'Under Review', pending: 'Pending' }[s] || s;
  }

  getInitials(): string {
    const n = this.auth.currentUser()?.name || 'U';
    return n.split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2);
  }
}
