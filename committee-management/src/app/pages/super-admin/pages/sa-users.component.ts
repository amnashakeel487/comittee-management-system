import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-sa-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <div class="sa-page-header">
    <h2>User Management</h2>
    <p>Manage all sub-admin accounts on the platform</p>
  </div>
  <div class="sa-toolbar">
    <input type="text" class="sa-search" placeholder="Search by name or email..." [(ngModel)]="search">
    <div class="sa-filter-btns">
      <button *ngFor="let f of filters" class="sa-fbtn" [class.active]="activeFilter()===f" (click)="activeFilter.set(f)">{{ f }}</button>
    </div>
  </div>
  <div *ngIf="loading()" class="sa-loading"><div class="sa-spinner"></div></div>
  <div class="sa-table-card" *ngIf="!loading()">
    <table class="sa-table">
      <thead><tr><th>#</th><th>User</th><th>Email</th><th>Committees</th><th>Trust Score</th><th>Verified</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let u of filtered(); let i=index">
          <td class="dim">{{ i+1 }}</td>
          <td><div class="cell-user"><div class="cell-av" [style.background]="getColor(u.name||'')">{{ getInitials(u.name||'U') }}</div><span class="fw">{{ u.name }}</span></div></td>
          <td class="dim">{{ u.email }}</td>
          <td>{{ getCommitteeCount(u.id) }}</td>
          <td><span class="trust-score" [class.high]="(u.trust_score||100)>=80" [class.mid]="(u.trust_score||100)>=50&&(u.trust_score||100)<80" [class.low]="(u.trust_score||100)<50">{{ u.trust_score || 100 }}</span></td>
          <td>
            <button class="sa-verify-btn" [class.on]="u.verified" (click)="toggleVerify(u)">
              {{ u.verified ? '✓ Verified' : 'Verify' }}
            </button>
          </td>
          <td><span class="sa-status" [class.active]="!u.status||u.status==='active'" [class.suspended]="u.status==='suspended'" [class.banned]="u.status==='banned'">{{ u.status || 'active' | titlecase }}</span></td>
          <td class="dim">{{ u.created_at | date:'MMM d, y' }}</td>
          <td>
            <div class="action-row">
              <button class="sa-act warn" *ngIf="u.status!=='suspended'" (click)="suspend(u)" title="Suspend">⏸</button>
              <button class="sa-act ok" *ngIf="u.status==='suspended'" (click)="activate(u)" title="Activate">▶</button>
              <button class="sa-act danger" *ngIf="u.status!=='banned'" (click)="ban(u)" title="Ban">🚫</button>
            </div>
          </td>
        </tr>
        <tr *ngIf="filtered().length===0"><td colspan="9" class="sa-empty">No users found</td></tr>
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
    .sa-table-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
    .sa-table { width: 100%; border-collapse: collapse; font-size: 13px; thead tr { background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; } } tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); &:hover { background: rgba(255,255,255,0.02); } &:last-child { border-bottom: none; } td { padding: 12px 14px; color: rgba(255,255,255,0.8); vertical-align: middle; } } }
    .dim { color: rgba(255,255,255,0.4) !important; }
    .fw { font-weight: 600; color: white; }
    .cell-user { display: flex; align-items: center; gap: 10px; }
    .cell-av { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
    .trust-score { font-weight: 700; padding: 2px 8px; border-radius: 20px; font-size: 12px; &.high { background: rgba(16,185,129,0.12); color: #4ade80; } &.mid { background: rgba(245,158,11,0.12); color: #fbbf24; } &.low { background: rgba(239,68,68,0.12); color: #f87171; } }
    .sa-verify-btn { padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; &.on { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #4ade80; } }
    .sa-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; &.active { background: rgba(16,185,129,0.12); color: #4ade80; } &.suspended { background: rgba(245,158,11,0.12); color: #fbbf24; } &.banned { background: rgba(239,68,68,0.12); color: #f87171; } }
    .action-row { display: flex; gap: 4px; }
    .sa-act { width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; &.warn { background: rgba(245,158,11,0.12); } &.ok { background: rgba(16,185,129,0.12); } &.danger { background: rgba(239,68,68,0.12); } }
    .sa-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); font-size: 14px; }
  `]
})
export class SaUsersComponent implements OnInit {
  loading = signal(true);
  users = signal<any[]>([]);
  committees = signal<any[]>([]);
  search = '';
  activeFilter = signal('All');
  filters = ['All', 'Active', 'Suspended', 'Banned', 'Verified'];
  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];

  constructor(private supabase: SupabaseService, private toast: ToastService) {}

  async ngOnInit() {
    const [uRes, cRes] = await Promise.all([
      this.supabase.client.from('profiles').select('*').in('role', ['sub_admin', 'admin']).order('created_at', { ascending: false }),
      this.supabase.client.from('committees').select('id, created_by')
    ]);
    this.users.set(uRes.data || []);
    this.committees.set(cRes.data || []);
    this.loading.set(false);
  }

  filtered() {
    let r = this.users();
    const f = this.activeFilter();
    if (f === 'Active') r = r.filter(u => !u.status || u.status === 'active');
    else if (f === 'Suspended') r = r.filter(u => u.status === 'suspended');
    else if (f === 'Banned') r = r.filter(u => u.status === 'banned');
    else if (f === 'Verified') r = r.filter(u => u.verified);
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      r = r.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    return r;
  }

  getCommitteeCount(id: string) { return this.committees().filter(c => c.created_by === id).length; }

  async suspend(u: any) {
    if (!confirm(`Suspend ${u.name}?`)) return;
    await this.supabase.client.from('profiles').update({ status: 'suspended' }).eq('id', u.id);
    this.users.update(l => l.map(x => x.id === u.id ? { ...x, status: 'suspended' } : x));
    this.toast.success(`${u.name} suspended`);
  }
  async activate(u: any) {
    await this.supabase.client.from('profiles').update({ status: 'active' }).eq('id', u.id);
    this.users.update(l => l.map(x => x.id === u.id ? { ...x, status: 'active' } : x));
    this.toast.success(`${u.name} activated`);
  }
  async ban(u: any) {
    if (!confirm(`Permanently ban ${u.name}?`)) return;
    await this.supabase.client.from('profiles').update({ status: 'banned' }).eq('id', u.id);
    this.users.update(l => l.map(x => x.id === u.id ? { ...x, status: 'banned' } : x));
    this.toast.success(`${u.name} banned`);
  }
  async toggleVerify(u: any) {
    const v = !u.verified;
    await this.supabase.client.from('profiles').update({ verified: v }).eq('id', u.id);
    this.users.update(l => l.map(x => x.id === u.id ? { ...x, verified: v } : x));
    this.toast.success(v ? `${u.name} verified` : 'Verification removed');
  }

  getInitials(n: string) { return n.split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2); }
  getColor(n: string) { return this.colors[(n?.charCodeAt(0) || 0) % this.colors.length]; }
}
