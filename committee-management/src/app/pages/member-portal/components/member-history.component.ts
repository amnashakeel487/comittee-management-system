import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberDataService } from '../../../services/member-data.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-member-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="m-history">
      <div class="page-header">
        <div class="page-title"><h1>Payment History</h1><p>All your payment records</p></div>
      </div>

      <div class="history-stats">
        <div class="hs-card green"><span class="material-icons">check_circle</span><div><b>{{ approved() }}</b><span>Approved</span></div></div>
        <div class="hs-card blue"><span class="material-icons">hourglass_empty</span><div><b>{{ underReview() }}</b><span>Under Review</span></div></div>
        <div class="hs-card orange"><span class="material-icons">schedule</span><div><b>{{ pending() }}</b><span>Pending</span></div></div>
        <div class="hs-card red"><span class="material-icons">cancel</span><div><b>{{ rejected() }}</b><span>Rejected</span></div></div>
      </div>

      <div *ngIf="loading()" class="loading-center"><div class="spinner"></div></div>

      <div class="history-card" *ngIf="!loading()">
        <div class="card-header">
          <h3><span class="material-icons">receipt_long</span> All Payments</h3>
          <span class="badge badge-brown">{{ payments().length }} records</span>
        </div>

        <div *ngIf="payments().length === 0" class="empty-state">
          <span class="material-icons empty-icon">receipt_long</span>
          <h3>No Payment Records</h3>
          <p>Submit your first payment from the Payments section</p>
        </div>

        <div class="table-container" *ngIf="payments().length > 0">
          <table class="data-table">
            <thead>
              <tr><th>Month</th><th>Committee</th><th>Amount</th><th>Date</th><th>Screenshot</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of payments()">
                <td><span class="month-chip">Month {{ p.month }}</span></td>
                <td class="text-sm text-muted">{{ p.committees?.name || '—' }}</td>
                <td class="amount-cell">PKR {{ p.amount | number }}</td>
                <td class="text-sm text-muted">{{ p.payment_date ? (p.payment_date | date:'MMM d, yyyy') : '—' }}</td>
                <td>
                  <a *ngIf="p.screenshot_url" [href]="p.screenshot_url" target="_blank" class="screenshot-link">
                    <span class="material-icons">image</span> View
                  </a>
                  <span *ngIf="!p.screenshot_url" class="text-muted">—</span>
                </td>
                <td>
                  <div class="status-cell">
                    <span class="badge" [ngClass]="{
                      'badge-success': p.status === 'approved',
                      'badge-danger': p.status === 'rejected',
                      'badge-info': p.status === 'under_review',
                      'badge-warning': p.status === 'pending'
                    }">{{ getLabel(p.status) }}</span>
                    <span *ngIf="p.status === 'rejected' && p.notes" class="rejection-note">
                      <span class="material-icons">info</span> {{ p.notes }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .m-history { animation: fadeIn 0.3s ease; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; color: #2A1F14; }
    .page-header p { font-size: 14px; color: #93785B; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .history-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .hs-card { background: white; border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; gap: 12px; border: 1px solid #E2D8CE; box-shadow: 0 1px 4px rgba(62,54,46,0.06); .material-icons { font-size: 28px; } div { display: flex; flex-direction: column; } b { font-size: 22px; font-weight: 800; color: #2A1F14; } span { font-size: 12px; color: #93785B; } }
    .hs-card.green .material-icons { color: #10b981; }
    .hs-card.blue .material-icons { color: #93785B; }
    .hs-card.orange .material-icons { color: #f59e0b; }
    .hs-card.red .material-icons { color: #ef4444; }

    .history-card { background: white; border-radius: 12px; border: 1px solid #E2D8CE; overflow: hidden; box-shadow: 0 1px 4px rgba(62,54,46,0.06); }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #F0EBE4; }
    .card-header h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; margin: 0; color: #2A1F14; .material-icons { font-size: 18px; color: #865D36; } }

    .empty-state { text-align: center; padding: 60px 20px; .empty-icon { font-size: 56px; color: #C9BAA8; display: block; margin-bottom: 16px; } h3 { font-size: 18px; color: #4E3D2E; margin-bottom: 8px; } p { font-size: 14px; color: #A69080; } }

    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table thead tr { background: #FAF7F4; border-bottom: 2px solid #E2D8CE; }
    .data-table thead th { padding: 12px 16px; text-align: left; font-weight: 600; color: #6B5544; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    .data-table tbody tr { border-bottom: 1px solid #F0EBE4; transition: background 0.15s; &:hover { background: #FAF7F4; } &:last-child { border-bottom: none; } }
    .data-table tbody td { padding: 14px 16px; color: #2A1F14; vertical-align: middle; }

    .month-chip { background: #F0EBE4; color: #4E3D2E; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .text-sm { font-size: 13px; }
    .text-muted { color: #93785B; }
    .amount-cell { font-weight: 700; color: #865D36; }
    .screenshot-link { display: inline-flex; align-items: center; gap: 4px; color: #865D36; font-size: 13px; font-weight: 500; text-decoration: none; padding: 3px 8px; border-radius: 6px; border: 1px solid #C9BAA8; background: #FAF7F4; &:hover { background: #F0E8DF; } .material-icons { font-size: 14px; } }
    .status-cell { display: flex; flex-direction: column; gap: 4px; }
    .rejection-note { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #ef4444; .material-icons { font-size: 12px; } }

    .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #EDE0D4; color: #4E3D2E; }
    .badge-brown { background: #F0E8DF; color: #865D36; }

    @media (max-width: 768px) { .history-stats { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class MemberHistoryComponent implements OnInit {
  loading = signal(true);
  payments = signal<any[]>([]);

  constructor(private memberData: MemberDataService, private auth: AuthService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const data = await this.memberData.getPayments();
      this.payments.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  approved() { return this.payments().filter(p => p.status === 'approved').length; }
  underReview() { return this.payments().filter(p => p.status === 'under_review').length; }
  pending() { return this.payments().filter(p => p.status === 'pending').length; }
  rejected() { return this.payments().filter(p => p.status === 'rejected').length; }
  getLabel(s: string) { return { approved: 'Approved', rejected: 'Rejected', under_review: 'Under Review', pending: 'Pending' }[s] || s; }
}
