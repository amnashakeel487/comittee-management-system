import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <div class="page-title">
          <h1>Reports & Analytics</h1>
          <p>Comprehensive financial overview of your committees</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="exportPDF()">
            <span class="material-icons">download</span> Export PDF
          </button>
          <button class="btn btn-primary" (click)="printReport()">
            <span class="material-icons">print</span> Print Report
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-4 report-stats">
        <div class="stat-card">
          <div class="stat-icon" style="background:#d1fae5">
            <span class="material-icons" style="color:#10b981">account_balance_wallet</span>
          </div>
          <div class="stat-value">PKR {{ totalCollected() | number }}</div>
          <div class="stat-label">Total Collected</div>
          <div class="stat-change positive">
            <span class="material-icons" style="font-size:14px">trending_up</span> +18% this month
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fee2e2">
            <span class="material-icons" style="color:#ef4444">pending_actions</span>
          </div>
          <div class="stat-value">PKR {{ pendingAmount() | number }}</div>
          <div class="stat-label">Remaining This Month</div>
          <div class="stat-change negative">
            <span class="material-icons" style="font-size:14px">warning</span> Yet to collect
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe">
            <span class="material-icons" style="color:#2563eb">send</span>
          </div>
          <div class="stat-value">PKR {{ totalPayouts() | number }}</div>
          <div class="stat-label">Total Payouts</div>
          <div class="stat-change positive">
            <span class="material-icons" style="font-size:14px">check</span> Released
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f3e8ff">
            <span class="material-icons" style="color:#7c3aed">groups</span>
          </div>
          <div class="stat-value">{{ activeCommittees() }}</div>
          <div class="stat-label">Active Committees</div>
          <div class="stat-change positive">
            <span class="material-icons" style="font-size:14px">play_circle</span> Running
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-2 charts-row">
        <!-- Bar Chart - Monthly Collection -->
        <div class="card">
          <div class="card-header">
            <h3>
              <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">bar_chart</span>
              Monthly Collection Trend
            </h3>
            <span class="badge badge-primary">2026</span>
          </div>
          <div class="card-body">
            <div class="bar-chart-container">
              <div class="bar-chart-area">
                <div *ngFor="let item of monthlyData()" class="bar-group">
                  <div class="bar-col">
                    <div class="bar-value-label">{{ (item.amount / 1000) | number:'1.0-0' }}K</div>
                    <div class="bar-fill-wrap">
                      <div class="bar-fill-col" [style.height.%]="getBarPct(item.amount)"></div>
                    </div>
                  </div>
                  <span class="bar-month-label">{{ item.month }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pie Chart - Committee Status -->
        <div class="card">
          <div class="card-header">
            <h3>
              <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">pie_chart</span>
              Committee Status Distribution
            </h3>
          </div>
          <div class="card-body">
            <div class="pie-chart-container">
              <div class="donut-chart">
                <svg viewBox="0 0 200 200" class="donut-svg">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#e5e7eb" stroke-width="30"/>
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#2563eb" stroke-width="30"
                          [attr.stroke-dasharray]="activeArc() + ' ' + (440 - activeArc())"
                          stroke-dashoffset="110" transform="rotate(-90 100 100)"/>
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#10b981" stroke-width="30"
                          [attr.stroke-dasharray]="completedArc() + ' ' + (440 - completedArc())"
                          [attr.stroke-dashoffset]="110 - activeArc()" transform="rotate(-90 100 100)"/>
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" stroke-width="30"
                          [attr.stroke-dasharray]="pendingArc() + ' ' + (440 - pendingArc())"
                          [attr.stroke-dashoffset]="110 - activeArc() - completedArc()" transform="rotate(-90 100 100)"/>
                  <text x="100" y="95" text-anchor="middle" font-size="22" font-weight="700" fill="#1f2937">{{ totalCommittees() }}</text>
                  <text x="100" y="115" text-anchor="middle" font-size="12" fill="#6b7280">Total</text>
                </svg>
              </div>
              <div class="pie-legend">
                <div class="legend-item">
                  <span class="legend-dot" style="background:#2563eb"></span>
                  <span class="legend-label">Active</span>
                  <span class="legend-value">{{ activeCommittees() }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background:#10b981"></span>
                  <span class="legend-label">Completed</span>
                  <span class="legend-value">{{ completedCommittees() }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background:#f59e0b"></span>
                  <span class="legend-label">Pending</span>
                  <span class="legend-value">{{ pendingCommittees() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Status Chart -->
      <div class="card">
        <div class="card-header">
          <h3>
            <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">show_chart</span>
            Payment Collection Rate
          </h3>
        </div>
        <div class="card-body">
          <div class="collection-rate">
            <div class="rate-item">
              <div class="rate-header">
                <span class="rate-label">Approved Payments</span>
                <span class="rate-value text-success">{{ paidPct() }}%</span>
              </div>
              <div class="progress-bar" style="height:12px">
                <div class="progress-fill" [style.width.%]="paidPct()" style="background:var(--success)"></div>
              </div>
              <span class="rate-count">{{ paidCount() }} payments</span>
            </div>
            <div class="rate-item">
              <div class="rate-header">
                <span class="rate-label">Pending / Under Review</span>
                <span class="rate-value text-warning">{{ pendingPct() }}%</span>
              </div>
              <div class="progress-bar" style="height:12px">
                <div class="progress-fill" [style.width.%]="pendingPct()" style="background:var(--warning)"></div>
              </div>
              <span class="rate-count">{{ pendingCount() }} payments</span>
            </div>
            <div class="rate-item">
              <div class="rate-header">
                <span class="rate-label">Rejected Payments</span>
                <span class="rate-value text-danger">{{ overduePct() }}%</span>
              </div>
              <div class="progress-bar" style="height:12px">
                <div class="progress-fill" [style.width.%]="overduePct()" style="background:var(--danger)"></div>
              </div>
              <span class="rate-count">{{ overdueCount() }} payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page { animation: fadeIn 0.3s ease; }
    .report-stats { margin-bottom: 24px; }
    .charts-row { margin-bottom: 24px; }

    .bar-chart-container { padding: 8px 0; }

    .bar-chart-area {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 200px;
      padding: 0 8px;
    }

    .bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      height: 100%;
    }

    .bar-col {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    .bar-value-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--gray-600);
    }

    .bar-fill-wrap {
      width: 100%;
      height: 160px;
      display: flex;
      align-items: flex-end;
    }

    .bar-fill-col {
      width: 100%;
      background: linear-gradient(180deg, var(--primary-light), var(--primary));
      border-radius: 6px 6px 0 0;
      min-height: 8px;
      transition: height 0.5s ease;
    }

    .bar-month-label {
      font-size: 12px;
      color: var(--gray-500);
      font-weight: 500;
    }

    .pie-chart-container {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .donut-chart {
      width: 180px;
      height: 180px;
      flex-shrink: 0;
    }

    .donut-svg { width: 100%; height: 100%; }

    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .legend-label { font-size: 14px; color: var(--gray-600); flex: 1; }
    .legend-value { font-size: 14px; font-weight: 700; color: var(--gray-800); }

    .collection-rate {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .rate-item { }

    .rate-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .rate-label { font-size: 14px; font-weight: 600; color: var(--gray-700); }
    .rate-value { font-size: 14px; font-weight: 700; }
    .rate-count { font-size: 12px; color: var(--gray-500); margin-top: 4px; display: block; }
  `]
})
export class ReportsComponent implements OnInit {
  monthlyData = signal<{ month: string; amount: number }[]>([]);
  private _committees: any[] = [];
  private _payments: any[] = [];
  private _payouts: any[] = [];

  constructor(private dataService: DataService, private auth: AuthService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    const [chart, committees, payments, payouts] = await Promise.all([
      this.dataService.getMonthlyCollectionData(),
      this.dataService.getCommittees(),
      this.dataService.getPayments(),
      this.dataService.getPayouts()
    ]);
    this.monthlyData.set(chart);
    this._committees = committees;
    this._payments = payments;
    this._payouts = payouts;
  }

  totalCollected() {
    return this._payments
      .filter((p: any) => p.status === 'approved')
      .reduce((s: number, p: any) => s + p.amount, 0);
  }

  /**
   * Pending Amount = Total expected for current month across all active committees
   *                  minus what has already been approved/collected this month.
   *
   * Example: committee has 10 members × PKR 5,000 = PKR 50,000 expected.
   * 1 member paid PKR 5,000 (approved) → pending = PKR 45,000.
   */
  pendingAmount() {
    let totalExpected = 0;
    let totalCollectedThisMonth = 0;

    for (const committee of this._committees) {
      if (committee.status !== 'active') continue;
      // current_month = completed months; active month = current_month + 1
      const activeMonth = (committee.current_month || 0) + 1;
      // Expected = all members should pay monthly_amount this month
      totalExpected += (committee.monthly_amount || 0) * (committee.total_members || 0);
      // Collected = approved payments for this committee in the active month
      const collected = this._payments
        .filter((p: any) =>
          p.committee_id === committee.id &&
          p.month === activeMonth &&
          p.status === 'approved'
        )
        .reduce((s: number, p: any) => s + p.amount, 0);
      totalCollectedThisMonth += collected;
    }

    return Math.max(0, totalExpected - totalCollectedThisMonth);
  }

  totalPayouts() { return this._payouts.filter((p: any) => p.status === 'released').reduce((s: number, p: any) => s + p.total_amount, 0); }
  totalCommittees() { return this._committees.length; }
  activeCommittees() { return this._committees.filter((c: any) => c.status === 'active').length; }
  completedCommittees() { return this._committees.filter((c: any) => c.status === 'completed').length; }
  pendingCommittees() { return this._committees.filter((c: any) => c.status === 'pending').length; }

  paidCount() { return this._payments.filter((p: any) => p.status === 'approved').length; }
  pendingCount() { return this._payments.filter((p: any) => p.status === 'pending' || p.status === 'under_review').length; }
  overdueCount() { return this._payments.filter((p: any) => p.status === 'rejected').length; }

  paidPct() { const t = this._payments.length; return t ? Math.round((this.paidCount() / t) * 100) : 0; }
  pendingPct() { const t = this._payments.length; return t ? Math.round((this.pendingCount() / t) * 100) : 0; }
  overduePct() { const t = this._payments.length; return t ? Math.round((this.overdueCount() / t) * 100) : 0; }

  getBarPct(amount: number): number {
    const max = Math.max(...this.monthlyData().map(d => d.amount));
    return max > 0 ? (amount / max) * 100 : 0;
  }

  activeArc() { return this.totalCommittees() > 0 ? (this.activeCommittees() / this.totalCommittees()) * 440 : 0; }
  completedArc() { return this.totalCommittees() > 0 ? (this.completedCommittees() / this.totalCommittees()) * 440 : 0; }
  pendingArc() { return this.totalCommittees() > 0 ? (this.pendingCommittees() / this.totalCommittees()) * 440 : 0; }

  // ── Print / Export ────────────────────────────────────────────

  private buildPrintHTML(forPDF = false): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

    const fmt = (n: number) => n.toLocaleString('en-PK');

    // Monthly collection rows
    const monthRows = this.monthlyData().length
      ? this.monthlyData().map(d => `
          <tr>
            <td>${d.month}</td>
            <td style="text-align:right;font-weight:600;color:#1E3A5F">PKR ${fmt(d.amount)}</td>
          </tr>`).join('')
      : '<tr><td colspan="2" style="text-align:center;color:#999">No data</td></tr>';

    // Payment rows (last 20)
    const paymentRows = this._payments.slice(0, 20).map(p => {
      const statusColor = p.status === 'approved' ? '#10b981' : p.status === 'rejected' ? '#ef4444' : '#f59e0b';
      const statusLabel = p.status === 'under_review' ? 'Under Review' : (p.status.charAt(0).toUpperCase() + p.status.slice(1));
      return `
        <tr>
          <td>${p.member_name || '—'}</td>
          <td>${p.committee_name || '—'}</td>
          <td style="text-align:center">Month ${p.month}</td>
          <td style="text-align:right;font-weight:600">PKR ${fmt(p.amount)}</td>
          <td style="text-align:center">${p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-PK') : '—'}</td>
          <td style="text-align:center">
            <span style="background:${statusColor}22;color:${statusColor};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">${statusLabel}</span>
          </td>
        </tr>`;
    }).join('');

    // Committee rows
    const committeeRows = this._committees.map(c => {
      const statusColor = c.status === 'active' ? '#10b981' : c.status === 'completed' ? '#6b7280' : '#f59e0b';
      const progress = c.duration_months > 0 ? Math.round(((c.current_month || 0) / c.duration_months) * 100) : 0;
      return `
        <tr>
          <td style="font-weight:600">${c.name}</td>
          <td style="text-align:center"><span style="background:${statusColor}22;color:${statusColor};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">${c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span></td>
          <td style="text-align:right">PKR ${fmt(c.monthly_amount)}</td>
          <td style="text-align:center">${c.total_members}</td>
          <td style="text-align:right">PKR ${fmt(c.monthly_amount * c.total_members)}</td>
          <td style="text-align:center">${c.current_month || 0} / ${c.duration_months}</td>
          <td style="text-align:center">${progress}%</td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:#999">No committees</td></tr>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CommitteeHub — Reports & Analytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #0F172A; background: white; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #1E3A5F; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #1E3A5F, #3B82F6); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: 700; }
    .brand-name { font-size: 22px; font-weight: 800; color: #1E3A5F; }
    .brand-sub { font-size: 12px; color: #2E5490; }
    .report-meta { text-align: right; }
    .report-title { font-size: 18px; font-weight: 700; color: #1E3A5F; }
    .report-date { font-size: 12px; color: #2E5490; margin-top: 4px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-box { background: #EEF3FA; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; }
    .stat-box .label { font-size: 11px; color: #2E5490; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .stat-box .value { font-size: 20px; font-weight: 800; color: #0F172A; }
    .stat-box .sub { font-size: 11px; color: #94A3B8; margin-top: 4px; }

    .section { margin-bottom: 28px; }
    .section-title { font-size: 15px; font-weight: 700; color: #1E3A5F; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; display: inline-block; width: 4px; height: 16px; background: #1E3A5F; border-radius: 2px; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #1E3A5F; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    tbody tr { border-bottom: 1px solid #F1F5F9; }
    tbody tr:nth-child(even) { background: #EEF3FA; }
    tbody tr:hover { background: #EEF3FA; }
    tbody td { padding: 9px 12px; }

    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 11px; color: #94A3B8; }

    .rate-bar-wrap { background: #E2E8F0; border-radius: 4px; height: 8px; margin: 4px 0; overflow: hidden; }
    .rate-bar { height: 100%; border-radius: 4px; }
    .rate-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px; }

    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">CH</div>
      <div>
        <div class="brand-name">CommitteeHub</div>
        <div class="brand-sub">ROSCA Manager</div>
      </div>
    </div>
    <div class="report-meta">
      <div class="report-title">Reports & Analytics</div>
      <div class="report-date">Generated: ${dateStr} at ${timeStr}</div>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="stats-grid">
    <div class="stat-box">
      <div class="label">Total Collected</div>
      <div class="value">PKR ${fmt(this.totalCollected())}</div>
      <div class="sub">Approved payments</div>
    </div>
    <div class="stat-box">
      <div class="label">Remaining This Month</div>
      <div class="value">PKR ${fmt(this.pendingAmount())}</div>
      <div class="sub">Yet to collect</div>
    </div>
    <div class="stat-box">
      <div class="label">Total Payouts</div>
      <div class="value">PKR ${fmt(this.totalPayouts())}</div>
      <div class="sub">Released</div>
    </div>
    <div class="stat-box">
      <div class="label">Active Committees</div>
      <div class="value">${this.activeCommittees()}</div>
      <div class="sub">of ${this.totalCommittees()} total</div>
    </div>
  </div>

  <!-- Payment Collection Rate -->
  <div class="section">
    <div class="section-title">Payment Collection Rate</div>
    <div style="padding:8px 0">
      <div class="rate-row"><span>Approved Payments</span><span style="font-weight:700;color:#10b981">${this.paidPct()}% (${this.paidCount()})</span></div>
      <div class="rate-bar-wrap"><div class="rate-bar" style="width:${this.paidPct()}%;background:#10b981"></div></div>
      <div class="rate-row" style="margin-top:12px"><span>Pending / Under Review</span><span style="font-weight:700;color:#f59e0b">${this.pendingPct()}% (${this.pendingCount()})</span></div>
      <div class="rate-bar-wrap"><div class="rate-bar" style="width:${this.pendingPct()}%;background:#f59e0b"></div></div>
      <div class="rate-row" style="margin-top:12px"><span>Rejected</span><span style="font-weight:700;color:#ef4444">${this.overduePct()}% (${this.overdueCount()})</span></div>
      <div class="rate-bar-wrap"><div class="rate-bar" style="width:${this.overduePct()}%;background:#ef4444"></div></div>
    </div>
  </div>

  <!-- Monthly Collection -->
  <div class="section">
    <div class="section-title">Monthly Collection Trend</div>
    <table>
      <thead><tr><th>Month</th><th style="text-align:right">Amount Collected</th></tr></thead>
      <tbody>${monthRows}</tbody>
    </table>
  </div>

  <!-- Committees -->
  <div class="section">
    <div class="section-title">Committees Overview</div>
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Status</th><th style="text-align:right">Monthly</th>
          <th style="text-align:center">Members</th><th style="text-align:right">Total Pool</th>
          <th style="text-align:center">Progress</th><th style="text-align:center">%</th>
        </tr>
      </thead>
      <tbody>${committeeRows}</tbody>
    </table>
  </div>

  <!-- Recent Payments -->
  <div class="section">
    <div class="section-title">Recent Payments (Last 20)</div>
    <table>
      <thead>
        <tr>
          <th>Member</th><th>Committee</th><th style="text-align:center">Month</th>
          <th style="text-align:right">Amount</th><th style="text-align:center">Date</th>
          <th style="text-align:center">Status</th>
        </tr>
      </thead>
      <tbody>${paymentRows || '<tr><td colspan="6" style="text-align:center;color:#999">No payments</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>CommitteeHub — ROSCA Manager</span>
    <span>Generated on ${dateStr}</span>
    <span>Confidential</span>
  </div>
</body>
</html>`;
  }

  printReport() {
    const html = this.buildPrintHTML(false);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow popups to print the report.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  }

  exportPDF() {
    const html = this.buildPrintHTML(true);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow popups to export the report.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Trigger print dialog with PDF destination
    setTimeout(() => {
      win.print();
      // After printing/saving, close the window
      win.onafterprint = () => win.close();
    }, 600);
  }
}
