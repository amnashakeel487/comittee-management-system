import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Payout } from '../../models';

@Component({
  selector: 'app-payouts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payouts-page">
      <div class="page-header">
        <div class="page-title">
          <h1>Payouts</h1>
          <p>Manage and track committee payout schedule</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-3 payout-stats">
        <div class="stat-card">
          <div class="stat-icon" style="background:#d1fae5">
            <span class="material-icons" style="color:#10b981">check_circle</span>
          </div>
          <div class="stat-value">{{ releasedCount() }}</div>
          <div class="stat-label">Released Payouts</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe">
            <span class="material-icons" style="color:#2563eb">schedule</span>
          </div>
          <div class="stat-value">{{ scheduledCount() }}</div>
          <div class="stat-label">Scheduled</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7">
            <span class="material-icons" style="color:#f59e0b">account_balance_wallet</span>
          </div>
          <div class="stat-value">PKR {{ totalReleased() | number }}</div>
          <div class="stat-label">Total Released</div>
        </div>
      </div>

      <!-- Upcoming Payouts -->
      <div class="card" *ngIf="scheduledPayouts().length > 0">
        <div class="card-header">
          <h3>
            <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">upcoming</span>
            Upcoming Payouts
          </h3>
        </div>
        <div class="card-body">
          <div class="upcoming-grid">
            <div *ngFor="let payout of scheduledPayouts()" class="upcoming-card">
              <div class="upcoming-header">
                <div class="receiver-avatar">{{ getInitials(payout.receiver_name || '') }}</div>
                <div class="upcoming-info">
                  <h4>{{ payout.receiver_name }}</h4>
                  <p class="text-sm text-muted">{{ payout.committee_name }}</p>
                </div>
                <span class="badge badge-info">Month {{ payout.month }}</span>
              </div>
              <div class="upcoming-amount">
                PKR {{ payout.total_amount | number }}
              </div>
              <div class="upcoming-date">
                <span class="material-icons" style="font-size:14px">calendar_today</span>
                {{ payout.payout_date | date:'MMMM d, yyyy' }}
              </div>
              <button class="btn btn-primary btn-sm release-btn"
                      (click)="releasePayout(payout)"
                      [disabled]="processingId() === payout.id">
                <span class="material-icons" style="font-size:16px">send</span>
                {{ processingId() === payout.id ? 'Releasing...' : 'Release Payout' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payout Timeline -->
      <div class="card">
        <div class="card-header">
          <h3>
            <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">timeline</span>
            Payout Schedule
          </h3>
        </div>

        <div *ngIf="loading()" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div class="payout-timeline" *ngIf="!loading()">
          <div *ngFor="let payout of payouts(); let i = index" class="timeline-item"
               [class.released]="payout.status === 'released'"
               [class.scheduled]="payout.status === 'scheduled'"
               [class.pending]="payout.status === 'pending'">
            <div class="timeline-connector" *ngIf="i > 0"></div>
            <div class="timeline-dot">
              <span class="material-icons">
                {{ payout.status === 'released' ? 'check_circle' : payout.status === 'scheduled' ? 'schedule' : 'radio_button_unchecked' }}
              </span>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <div class="timeline-member">
                  <div class="avatar avatar-sm" [style.background]="getAvatarColor(payout.receiver_name || '')">
                    {{ getInitials(payout.receiver_name || '') }}
                  </div>
                  <div>
                    <span class="timeline-name">{{ payout.receiver_name }}</span>
                    <span class="timeline-committee text-xs text-muted">{{ payout.committee_name }}</span>
                  </div>
                </div>
                <div class="timeline-right">
                  <span class="timeline-amount">PKR {{ payout.total_amount | number }}</span>
                  <span class="badge" [ngClass]="{
                    'badge-success': payout.status === 'released',
                    'badge-info': payout.status === 'scheduled',
                    'badge-gray': payout.status === 'pending'
                  }">{{ payout.status | titlecase }}</span>
                </div>
              </div>
              <div class="timeline-meta">
                <span>
                  <span class="material-icons" style="font-size:13px;vertical-align:middle">calendar_today</span>
                  {{ payout.payout_date ? (payout.payout_date | date:'MMM d, yyyy') : 'TBD' }}
                </span>
                <span>Month {{ payout.month }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="payouts().length === 0" class="empty-state">
            <span class="material-icons empty-icon">account_balance_wallet</span>
            <h3>No payouts yet</h3>
            <p>Payouts will appear here once committees are active</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payouts-page { animation: fadeIn 0.3s ease; }
    .payout-stats { margin-bottom: 24px; }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .upcoming-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .upcoming-card {
      background: linear-gradient(135deg, var(--primary-50), white);
      border: 1.5px solid var(--primary-100);
      border-radius: 12px;
      padding: 20px;
    }

    .upcoming-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .receiver-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .upcoming-info { flex: 1; h4 { font-size: 15px; font-weight: 700; } }

    .upcoming-amount {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .upcoming-date {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--gray-500);
      margin-bottom: 16px;
    }

    .release-btn { width: 100%; justify-content: center; }

    .payout-timeline {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .timeline-item {
      display: flex;
      gap: 16px;
      position: relative;
      padding-bottom: 24px;

      &:last-child { padding-bottom: 0; }

      &.released .timeline-dot .material-icons { color: var(--success); }
      &.scheduled .timeline-dot .material-icons { color: var(--primary); }
      &.pending .timeline-dot .material-icons { color: var(--gray-400); }
    }

    .timeline-dot {
      flex-shrink: 0;
      width: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;

      .material-icons { font-size: 24px; background: white; z-index: 1; }

      &::after {
        content: '';
        position: absolute;
        top: 28px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: calc(100% - 4px);
        background: var(--gray-200);
      }
    }

    .timeline-item:last-child .timeline-dot::after { display: none; }

    .timeline-content {
      flex: 1;
      background: var(--gray-50);
      border-radius: 10px;
      padding: 14px 16px;
      border: 1px solid var(--gray-200);
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .timeline-member {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .timeline-name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-800);
    }

    .timeline-committee { display: block; }

    .timeline-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }

    .timeline-amount {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
    }

    .timeline-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--gray-500);
    }
  `]
})
export class PayoutsComponent implements OnInit {
  loading = signal(true);
  payouts = signal<Payout[]>([]);
  processingId = signal<string | null>(null);

  private avatarColors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];

  constructor(private dataService: DataService, private toast: ToastService, private auth: AuthService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const data = await this.dataService.getPayouts();
      this.payouts.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  scheduledPayouts() { return this.payouts().filter(p => p.status === 'scheduled'); }
  releasedCount() { return this.payouts().filter(p => p.status === 'released').length; }
  scheduledCount() { return this.payouts().filter(p => p.status === 'scheduled').length; }
  totalReleased() { return this.payouts().filter(p => p.status === 'released').reduce((s, p) => s + p.total_amount, 0); }

  async releasePayout(payout: Payout) {
    this.processingId.set(payout.id);
    try {
      const updated = await this.dataService.releasePayout(payout.id);
      this.payouts.update(list => list.map(p => p.id === updated.id ? updated : p));
      this.toast.success(`Payout of PKR ${payout.total_amount.toLocaleString()} released to ${payout.receiver_name}`);
    } catch {
      this.toast.error('Failed to release payout');
    } finally {
      this.processingId.set(null);
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }
}
