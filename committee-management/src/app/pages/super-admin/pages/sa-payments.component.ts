import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-sa-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <div class="sa-page-header">
    <h2>Payment Monitoring</h2>
    <p>Monitor all payments across the platform</p>
  </div>
  <div class="sa-toolbar">
    <input type="text" class="sa-search" placeholder="Search by member or committee..." [(ngModel)]="search">
    <div class="sa-filter-btns">
      <button *ngFor="let f of filters" class="sa-fbtn" [class.active]="activeFilter()===f" (click)="activeFilter.set(f)">{{ f }}</button>
    </div>
  </div>
  <div *ngIf="loading()" class="sa-loading"><div class="sa-spinner"></div></div>
  <div class="sa-table-card" *ngIf="!loading()">
    <table class="sa-table">
      <thead><tr><th>#</th><th>Member</th><th>Committee</th><th>Month</th><th>Amount</th><th>Date</th><th>Screenshot</th><th>Status</th></tr></thead>
      <tbody>
        <tr *ngFor="let p of filtered(); let i=index">
          <td class="dim">{{ i+1 }}</td>
          <td class="fw">{{ p.member_name }}</td>
          <td class="dim">{{ p.committee_name }}</td>
          <td>Month {{ p.month }}</td>
          <td>PKR {{ p.amount | number }}</td>
          <td class="dim">{{ p.payment_date | date:'MMM d, y' }}</td>
          <td><a *ngIf="p.screenshot_url" [href]="p.screenshot_url" target="_blank" class="sa-link">View</a><span *ngIf="!p.screenshot_url" class="dim">—</span></td>
          <td><span class="sa-status" [class.approved]="p.status==='approved'" [class.pending]="p.status==='pending'||p.status==='under_review'" [class.rejected]="p.status==='rejected'">{{ p.status === 'under_review' ? 'Under Review' : (p.status | titlecase) }}</span></td>
        </tr>
        <tr *ngIf="filtered().length===0"><td colspan="8" class="sa-empty">No payments found</td></tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styles: [`
    .sa-page { color: white; }
    .sa-page-header { margin-bottom: 24px; h2 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 4px; } p { font-size: 14px; color: rgba(255,255,255,0.45); } }
    .sa-toolbar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .sa-search { flex: 1; min-width: 200px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 14px; color: white; font-family: inherit; font-size: 14px; outline: none; &:focus { border-color: rgba(37,99,235,0.5); } &::placeholder { color: rgba(255,255,255,0.25); } }
    .sa-filter-btns { display: flex; gap: 6px; }
    .sa-fbtn { padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); font-size: 13px; cursor: pointer; font-family: inherit; &.active { background: rgba(37,99,235,0.2); border-color: rgba(37,99,235,0.4); color: #60A5FA; } }
    .sa-loading { display: flex; justify-content: center; padding: 60px; }
    .sa-spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sa-table-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; overflow-x: auto; }
    .sa-table { width: 100%; border-collapse: collapse; font-size: 13px; thead tr { background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; } } tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); &:hover { background: rgba(255,255,255,0.02); } &:last-child { border-bottom: none; } td { padding: 12px 14px; color: rgba(255,255,255,0.8); vertical-align: middle; } } }
    .dim { color: rgba(255,255,255,0.4) !important; }
    .fw { font-weight: 600; color: white; }
    .sa-link { color: #60A5FA; text-decoration: none; font-size: 12px; &:hover { text-decoration: underline; } }
    .sa-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; &.approved { background: rgba(16,185,129,0.12); color: #4ade80; } &.pending { background: rgba(245,158,11,0.12); color: #fbbf24; } &.rejected { background: rgba(239,68,68,0.12); color: #f87171; } }
    .sa-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); font-size: 14px; }
  `]
})
export class SaPaymentsComponent implements OnInit {
  loading = signal(true);
  payments = signal<any[]>([]);
  search = '';
  activeFilter = signal('All');
  filters = ['All', 'Approved', 'Pending', 'Rejected'];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    const { data } = await this.supabase.client.from('payments')
      .select('*, members(name), committees(name)')
      .order('created_at', { ascending: false }).limit(200);
    this.payments.set((data || []).map((p: any) => ({ ...p, member_name: p.members?.name || '—', committee_name: p.committees?.name || '—' })));
    this.loading.set(false);
  }

  filtered() {
    let r = this.payments();
    const f = this.activeFilter();
    if (f === 'Approved') r = r.filter(p => p.status === 'approved');
    else if (f === 'Pending') r = r.filter(p => p.status === 'pending' || p.status === 'under_review');
    else if (f === 'Rejected') r = r.filter(p => p.status === 'rejected');
    if (this.search.trim()) { const q = this.search.toLowerCase(); r = r.filter(p => p.member_name?.toLowerCase().includes(q) || p.committee_name?.toLowerCase().includes(q)); }
    return r;
  }
}
