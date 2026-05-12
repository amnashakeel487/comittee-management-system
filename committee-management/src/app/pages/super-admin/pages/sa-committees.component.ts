import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-sa-committees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <div class="sa-page-header">
    <h2>Committee Management</h2>
    <p>View, verify, suspend, or delete any committee on the platform</p>
  </div>
  <div class="sa-toolbar">
    <input type="text" class="sa-search" placeholder="Search committees..." [(ngModel)]="search">
    <div class="sa-filter-btns">
      <button *ngFor="let f of filters" class="sa-fbtn" [class.active]="activeFilter()===f" (click)="activeFilter.set(f)">{{ f }}</button>
    </div>
  </div>
  <div *ngIf="loading()" class="sa-loading"><div class="sa-spinner"></div></div>
  <div class="sa-table-card" *ngIf="!loading()">
    <table class="sa-table">
      <thead><tr><th>#</th><th>Committee</th><th>Admin</th><th>Members</th><th>Monthly</th><th>Pool</th><th>Verified</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let c of filtered(); let i=index">
          <td class="dim">{{ i+1 }}</td>
          <td><span class="fw">{{ c.name }}</span><span class="dim" style="display:block;font-size:11px">{{ c.description }}</span></td>
          <td class="dim">{{ getAdminName(c.created_by) }}</td>
          <td>{{ c.total_members }}</td>
          <td>PKR {{ c.monthly_amount | number }}</td>
          <td>PKR {{ (c.monthly_amount * c.total_members) | number }}</td>
          <td>
            <button class="sa-verify-btn" [class.on]="c.verification_status==='verified'" (click)="toggleVerify(c)">
              {{ c.verification_status === 'verified' ? '✓ Verified' : 'Verify' }}
            </button>
          </td>
          <td><span class="sa-status" [class.active]="c.status==='active'" [class.pending]="c.status==='pending'" [class.suspended]="c.status==='suspended'" [class.completed]="c.status==='completed'">{{ c.status | titlecase }}</span></td>
          <td>
            <div class="action-row">
              <button class="sa-act warn" *ngIf="c.status!=='suspended'" (click)="suspend(c)" title="Suspend">⏸</button>
              <button class="sa-act ok" *ngIf="c.status==='suspended'" (click)="activate(c)" title="Activate">▶</button>
              <button class="sa-act danger" (click)="deleteC(c)" title="Delete">🗑</button>
            </div>
          </td>
        </tr>
        <tr *ngIf="filtered().length===0"><td colspan="9" class="sa-empty">No committees found</td></tr>
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
    .sa-table { width: 100%; border-collapse: collapse; font-size: 13px; thead tr { background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; } } tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); &:hover { background: rgba(255,255,255,0.02); } &:last-child { border-bottom: none; } td { padding: 12px 14px; color: rgba(255,255,255,0.8); vertical-align: middle; } } }
    .dim { color: rgba(255,255,255,0.4) !important; }
    .fw { font-weight: 600; color: white; }
    .sa-verify-btn { padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; &.on { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #4ade80; } }
    .sa-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; &.active { background: rgba(16,185,129,0.12); color: #4ade80; } &.pending { background: rgba(245,158,11,0.12); color: #fbbf24; } &.suspended { background: rgba(239,68,68,0.12); color: #f87171; } &.completed { background: rgba(99,102,241,0.12); color: #a5b4fc; } }
    .action-row { display: flex; gap: 4px; }
    .sa-act { width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; &.warn { background: rgba(245,158,11,0.12); } &.ok { background: rgba(16,185,129,0.12); } &.danger { background: rgba(239,68,68,0.12); } }
    .sa-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); font-size: 14px; }
  `]
})
export class SaCommitteesComponent implements OnInit {
  loading = signal(true);
  committees = signal<any[]>([]);
  admins = signal<any[]>([]);
  search = '';
  activeFilter = signal('All');
  filters = ['All', 'Active', 'Pending', 'Suspended', 'Completed'];

  constructor(private supabase: SupabaseService, private toast: ToastService) {}

  async ngOnInit() {
    const [cRes, aRes] = await Promise.all([
      this.supabase.client.from('committees').select('*').order('created_at', { ascending: false }),
      this.supabase.client.from('profiles').select('id, name').in('role', ['sub_admin', 'admin', 'super_admin'])
    ]);
    this.committees.set(cRes.data || []);
    this.admins.set(aRes.data || []);
    this.loading.set(false);
  }

  filtered() {
    let r = this.committees();
    const f = this.activeFilter();
    if (f !== 'All') r = r.filter(c => c.status === f.toLowerCase());
    if (this.search.trim()) { const q = this.search.toLowerCase(); r = r.filter(c => c.name?.toLowerCase().includes(q)); }
    return r;
  }

  getAdminName(id: string) { return this.admins().find(a => a.id === id)?.name || 'Unknown'; }

  async suspend(c: any) {
    if (!confirm(`Suspend "${c.name}"?`)) return;
    await this.supabase.client.from('committees').update({ status: 'suspended' }).eq('id', c.id);
    this.committees.update(l => l.map(x => x.id === c.id ? { ...x, status: 'suspended' } : x));
    this.toast.success(`"${c.name}" suspended`);
  }
  async activate(c: any) {
    await this.supabase.client.from('committees').update({ status: 'active' }).eq('id', c.id);
    this.committees.update(l => l.map(x => x.id === c.id ? { ...x, status: 'active' } : x));
    this.toast.success(`"${c.name}" activated`);
  }
  async deleteC(c: any) {
    if (!confirm(`Permanently delete "${c.name}"? This cannot be undone.`)) return;
    await this.supabase.client.from('committee_members').delete().eq('committee_id', c.id);
    await this.supabase.client.from('committees').delete().eq('id', c.id);
    this.committees.update(l => l.filter(x => x.id !== c.id));
    this.toast.success(`"${c.name}" deleted`);
  }
  async toggleVerify(c: any) {
    const v = c.verification_status === 'verified' ? 'unverified' : 'verified';
    await this.supabase.client.from('committees').update({ verification_status: v }).eq('id', c.id);
    this.committees.update(l => l.map(x => x.id === c.id ? { ...x, verification_status: v } : x));
    this.toast.success(v === 'verified' ? `"${c.name}" verified` : 'Verification removed');
  }
}
