import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { DashboardStats, Payment, Payout } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
      </div>

      <ng-container *ngIf="!loading()">
        <!-- Stats Grid -->
        <div class="grid grid-4 stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe">
              <span class="material-icons" style="color:#2563eb">groups</span>
            </div>
            <div class="stat-value">{{ stats()?.totalCommittees || 0 }}</div>
            <div class="stat-label">Total Committees</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background:#d1fae5">
              <span class="material-icons" style="color:#10b981">people</span>
            </div>
            <div class="stat-value">{{ stats()?.totalMembers || 0 }}</div>
            <div class="stat-label">Total Members</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7">
              <span class="material-icons" style="color:#f59e0b">pending_actions</span>
            </div>
            <div class="stat-value">{{ stats()?.pendingPayments || 0 }}</div>
            <div class="stat-label">Awaiting Approval</div>
            <div class="stat-change negative" *ngIf="(stats()?.pendingPayments || 0) > 0">
              <span class="material-icons" style="font-size:14px">warning</span> Needs review
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background:#d1fae5">
              <span class="material-icons" style="color:#10b981">check_circle</span>
            </div>
            <div class="stat-value">{{ stats()?.paidPayments || 0 }}</div>
            <div class="stat-label">Approved Payments</div>
            <div class="stat-change positive">
              <span class="material-icons" style="font-size:14px">trending_up</span> Collected
            </div>
          </div>
        </div>

        <!-- Row 2: Upcoming Payout + Collection Chart -->
        <div class="grid grid-2 mt-row">
          <!-- Upcoming Payout -->
          <div class="card upcoming-payout-card">
            <div class="card-header">
              <h3>
                <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">account_balance_wallet</span>
                Upcoming Payout
              </h3>
              <a routerLink="/payouts" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="card-body" *ngIf="stats()?.upcomingPayout as payout">
              <div class="payout-highlight">
                <div class="payout-avatar">
                  {{ getInitials(payout.receiver_name || '') }}
                </div>
                <div class="payout-info">
                  <h2 class="payout-amount">PKR {{ (payout.total_amount || 0) | number }}</h2>
                  <p class="payout-receiver">{{ payout.receiver_name }}</p>
                  <p class="payout-meta">
                    <span class="material-icons" style="font-size:14px;vertical-align:middle">calendar_today</span>
                    {{ payout.payout_date | date:'MMMM d, yyyy' }}
                  </p>
                  <p class="payout-committee">
                    <span class="material-icons" style="font-size:14px;vertical-align:middle">groups</span>
                    {{ payout.committee_name }}
                  </p>
                </div>
              </div>
              <div class="payout-actions">
                <button class="btn btn-primary">
                  <span class="material-icons">send</span> Release Payout
                </button>
                <button class="btn btn-outline">
                  <span class="material-icons">visibility</span> View Details
                </button>
              </div>
            </div>
            <div class="card-body empty-payout" *ngIf="!stats()?.upcomingPayout">
              <div class="empty-state">
                <span class="material-icons empty-icon">account_balance_wallet</span>
                <p>No upcoming payouts</p>
              </div>
            </div>
          </div>

          <!-- Monthly Collection Chart -->
          <div class="card">
            <div class="card-header">
              <h3>
                <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">bar_chart</span>
                Monthly Collection
              </h3>
              <span class="badge badge-success">2026</span>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <div class="bar-chart">
                  <div *ngFor="let item of chartData()" class="bar-item">
                    <div class="bar-wrapper">
                      <div class="bar-fill" [style.height.%]="getBarHeight(item.amount)">
                        <span class="bar-tooltip">PKR {{ item.amount | number }}</span>
                      </div>
                    </div>
                    <span class="bar-label">{{ item.month }}</span>
                  </div>
                </div>
                <div class="chart-total">
                  <span class="total-label">Total Collected</span>
                  <span class="total-value">PKR {{ getTotalCollected() | number }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Recent Payments + Committee Progress -->
        <div class="grid grid-2 mt-row">
          <!-- Recent Payments -->
          <div class="card">
            <div class="card-header">
              <h3>
                <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">receipt_long</span>
                Recent Payments
              </h3>
              <a routerLink="/payments" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Committee</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let payment of recentPayments()">
                    <td>
                      <div class="member-cell">
                        <div class="avatar avatar-sm" [style.background]="getAvatarColor(payment.member_name || '')">
                          {{ getInitials(payment.member_name || '') }}
                        </div>
                        <span>{{ payment.member_name }}</span>
                      </div>
                    </td>
                    <td class="text-sm text-muted">{{ payment.committee_name }}</td>
                    <td class="text-sm">Month {{ payment.month }}</td>
                    <td class="font-semibold">PKR {{ payment.amount | number }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-success': payment.status === 'approved',
                        'badge-warning': payment.status === 'pending',
                        'badge-info': payment.status === 'under_review',
                        'badge-danger': payment.status === 'rejected'
                      }">
                        <span class="material-icons" style="font-size:12px">
                          {{ payment.status === 'approved' ? 'check_circle' : payment.status === 'under_review' ? 'hourglass_empty' : payment.status === 'rejected' ? 'cancel' : 'schedule' }}
                        </span>
                        {{ payment.status === 'under_review' ? 'Under Review' : (payment.status | titlecase) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Committee Progress -->
          <div class="card">
            <div class="card-header">
              <h3>
                <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">donut_large</span>
                Committee Progress
              </h3>
              <a routerLink="/committees" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="card-body">
              <div class="committee-progress-list">
                <div *ngFor="let c of committeeProgress()" class="progress-item">
                  <div class="progress-header">
                    <div class="progress-info">
                      <span class="progress-name">{{ c.name }}</span>
                      <span class="badge" [ngClass]="{
                        'badge-success': c.status === 'active',
                        'badge-gray': c.status === 'completed',
                        'badge-warning': c.status === 'pending'
                      }">{{ c.status }}</span>
                    </div>
                    <span class="progress-pct">{{ c.progress }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="c.progress"
                         [style.background]="c.status === 'completed' ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--primary-light))'">
                    </div>
                  </div>
                  <div class="progress-meta">
                    <span>Month {{ c.current_month }}/{{ c.duration_months }}</span>
                    <span>PKR {{ c.monthly_amount | number }}/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard { animation: fadeIn 0.3s ease; }

    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
    }

    .stats-grid { margin-bottom: 0; }
    .mt-row { margin-top: 24px; }

    .upcoming-payout-card .card-body { padding: 28px; }

    .payout-highlight {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .payout-avatar {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .payout-amount {
      font-size: 28px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .payout-receiver {
      font-size: 16px;
      font-weight: 600;
      color: var(--gray-800);
      margin-bottom: 6px;
    }

    .payout-meta, .payout-committee {
      font-size: 13px;
      color: var(--gray-500);
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }

    .payout-actions {
      display: flex;
      gap: 12px;
    }

    .chart-container { padding: 8px 0; }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      height: 160px;
      padding: 0 8px;
    }

    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      height: 100%;
    }

    .bar-wrapper {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      position: relative;
    }

    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, var(--primary-light), var(--primary));
      border-radius: 6px 6px 0 0;
      min-height: 8px;
      transition: height 0.5s ease;
      position: relative;
      cursor: pointer;

      &:hover .bar-tooltip { display: block; }
    }

    .bar-tooltip {
      display: none;
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--gray-800);
      color: white;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      z-index: 10;
    }

    .bar-label {
      font-size: 12px;
      color: var(--gray-500);
      font-weight: 500;
    }

    .chart-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--gray-200);
    }

    .total-label { font-size: 13px; color: var(--gray-500); }
    .total-value { font-size: 18px; font-weight: 700; color: var(--primary); }

    .member-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .committee-progress-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .progress-item { }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-800);
    }

    .progress-pct {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
    }

    .progress-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 12px;
      color: var(--gray-500);
    }

    .empty-payout {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }

    .badge-info { background: #EDE0D4; color: #4E3D2E; }
  `]
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  recentPayments = signal<Payment[]>([]);
  chartData = signal<{ month: string; amount: number }[]>([]);
  committeeProgress = signal<any[]>([]);

  private avatarColors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];

  constructor(private dataService: DataService, private auth: AuthService) {}

  async ngOnInit() {
    // Wait for session to be restored before fetching data
    await this.auth.waitForAuth();
    try {
      const [statsData, payments, committees, chart] = await Promise.all([
        this.dataService.getDashboardStats(),
        this.dataService.getPayments(),
        this.dataService.getCommittees(),
        this.dataService.getMonthlyCollectionData()
      ]);

      this.stats.set(statsData);
      this.recentPayments.set(payments.slice(0, 5));
      this.chartData.set(chart);
      this.committeeProgress.set(
        committees.slice(0, 4).map(c => ({
          ...c,
          progress: c.duration_months > 0
            ? Math.round(((c.current_month || 0) / c.duration_months) * 100)
            : 0
        }))
      );
    } finally {
      this.loading.set(false);
    }
  }

  getBarHeight(amount: number): number {
    const max = Math.max(...this.chartData().map(d => d.amount));
    return max > 0 ? (amount / max) * 100 : 0;
  }

  getTotalCollected(): number {
    return this.chartData().reduce((sum, d) => sum + d.amount, 0);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(name: string): string {
    const idx = name.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[idx];
  }
}
