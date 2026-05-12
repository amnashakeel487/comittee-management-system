import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-sa-fraud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <div class="sa-page-header">
    <h2>Fraud Reports</h2>
    <p>Review and action fraud complaints from users</p>
  </div>
  <div class="sa-filter-btns" style="margin-bottom:20px">
    <button *ngFor="let f of filters" class="sa-fbtn" [class.active]="activeFilter()===f" (click)="activeFilter.set(f)">
      {{ f }} <span *ngIf="f==='Pending' && pendingCount()>0" class="sa-badge-red">{{ pendingCount() }}</span>
    </button>
  </div>
  <div *ngIf="loading()" class="sa-loading"><div class="sa-spinner"></div></div>
  <div class="sa-table-card" *ngIf="!loading()">
    <table class="sa-table">
      <thead><tr><th>#</th><th>Reporter</th><th>Against</th><th>Reason</th><th>Description</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let r of filtered(); let i=index">
          <td class="dim">{{ i+1 }}</td>
          <td class="fw">{{ r.reporter_name || '—' }}</td>
          <td class="dim">{{ r.reported_user_name || r.committee_name || '—' }}</td>
          <td><span class="reason-tag">{{ r.reason | titlecase }}</span></td>
          <td class="dim desc">{{ r.description || '—' }}</td>
          <td class="dim">{{ r.created_at | date:'MMM d, y' }}</td>
          <td><span class="sa-status" [class.pending]="r.status==='pending'" [class.actioned]="r.status==='actioned'" [class.dismissed]="r.status==='dismissed'">{{ r.status | titlecase }}</span></td>
          <td>
            <div class="action-row" *ngIf="r.status==='pending'">
              <button class="sa-act ok" (click)="action(r)" title="Take Action">✓</button>
              <button class="sa-act warn" (click)="dismiss(r)" title="Dismiss">✕</button>
            </div>
            <span *ngIf="r.status!=='pending'" class="dim">—</span>
          </td>
        </tr>
        <tr *ngIf="filtered().length===0"><td colspan="8" class="sa-empty">No reports found</td></tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styles: [`
    .sa-page { color: white; }
    .sa-page-header { margin-bottom: 24px; h2 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 4px; } p { font-size: 14px; color: rgba(255,255,255,0.45); } }
    .sa-filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
    .sa-fbtn { padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); font-size: 13px; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px; &.active { background: rgba(37,99,235,0.2); border-color: rgba(37,99,235,0.4); color: #60A5FA; } }
    .sa-badge-red { background: #ef4444; color: white; border-radius: 10px; padding: 1px 6px; font-size: 11px; font-weight: 700; }
    .sa-loading { display: flex; justify-content: center; padding: 60px; }
    .sa-spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sa-table-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; overflow-x: auto; }
    .sa-table { width: 100%; border-collapse: collapse; font-size: 13px; thead tr { background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; } } tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); &:hover { background: rgba(255,255,255,0.02); } &:last-child { border-bottom: none; } td { padding: 12px 14px; color: rgba(255,255,255,0.8); vertical-align: middle; } } }
    .dim { color: rgba(255,255,255,0.4) !important; }
    .fw { font-weight: 600; color: white; }
    .desc { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .reason-tag { background: rgba(245,158,11,0.12); color: #fbbf24; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .sa-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; &.pending { background: rgba(245,158,11,0.12); color: #fbbf24; } &.actioned { background: rgba(16,185,129,0.12); color: #4ade80; } &.dismissed { background: rgba(100,116,139,0.12); color: #94a3b8; } }
    .action-row { display: flex; gap: 4px; }
    .sa-act { width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; &.ok { background: rgba(16,185,129,0.12); color: #4ade80; } &.warn { background: rgba(245,158,11,0.12); color: #fbbf24; } }
    .sa-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); font-size: 14px; }
  `]
})
export class SaFraudComponent implements OnInit {
  loading = signal(true);
  reports = signal<any[]>([]);
  activeFilter = signal('All');
  filters = ['All', 'Pending', 'Actioned', 'Dismissed'];

  constructor(private supabase: SupabaseService, private toast: ToastService) {}

  async ngOnInit() {
    const { data } = await this.supabase.client.from('fraud_reports')
      .select('*, reporter:reporter_id(name), reported:reported_user_id(name), committee:committee_id(name)')
      .order('created_at', { ascending: false });
    this.reports.set((data || []).map((r: any) => ({ ...r, reporter_name: r.reporter?.name, reported_user_name: r.reported?.name, committee_name: r.committee?.name })));
    this.loading.set(false);
  }

  filtered() {
    const f = this.activeFilter();
    if (f === 'All') return this.reports();
    return this.reports().filter(r => r.status === f.toLowerCase());
  }
  pendingCount() { return this.reports().filter(r => r.status === 'pending').length; }

  async action(r: any) {
    await this.supabase.client.from('fraud_reports').update({ status: 'actioned' }).eq('id', r.id);
    this.reports.update(l => l.map(x => x.id === r.id ? { ...x, status: 'actioned' } : x));
    this.toast.success('Report actioned');
  }
  async dismiss(r: any) {
    await this.supabase.client.from('fraud_reports').update({ status: 'dismissed' }).eq('id', r.id);
    this.reports.update(l => l.map(x => x.id === r.id ? { ...x, status: 'dismissed' } : x));
    this.toast.success('Report dismissed');
  }
}
