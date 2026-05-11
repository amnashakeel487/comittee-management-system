import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SupabaseService } from "../../services/supabase.service";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: "app-super-admin",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <!-- Header -->
  <div class="sa-header">
    <div class="sa-brand">
      <div class="sa-icon"><span class="material-icons">admin_panel_settings</span></div>
      <div>
        <h1>Super Admin Panel</h1>
        <p>Full system oversight and control</p>
      </div>
    </div>
    <button class="btn-logout" (click)="logout()">
      <span class="material-icons">logout</span> Logout
    </button>
  </div>

  <!-- Stats -->
  <div class="sa-stats">
    <div class="sa-stat">
      <div class="sa-stat-icon blue"><span class="material-icons">admin_panel_settings</span></div>
      <div class="sa-stat-val">{{ admins().length }}</div>
      <div class="sa-stat-lbl">Total Admins</div>
    </div>
    <div class="sa-stat">
      <div class="sa-stat-icon green"><span class="material-icons">people</span></div>
      <div class="sa-stat-val">{{ members().length }}</div>
      <div class="sa-stat-lbl">Total Members</div>
    </div>
    <div class="sa-stat">
      <div class="sa-stat-icon purple"><span class="material-icons">groups</span></div>
      <div class="sa-stat-val">{{ committees().length }}</div>
      <div class="sa-stat-lbl">Total Committees</div>
    </div>
    <div class="sa-stat">
      <div class="sa-stat-icon orange"><span class="material-icons">check_circle</span></div>
      <div class="sa-stat-val">{{ activeCommittees() }}</div>
      <div class="sa-stat-lbl">Active Committees</div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="sa-tabs">
    <button class="sa-tab" [class.active]="tab()==='admins'" (click)="tab.set('admins')">
      <span class="material-icons">admin_panel_settings</span> Admins
    </button>
    <button class="sa-tab" [class.active]="tab()==='committees'" (click)="tab.set('committees')">
      <span class="material-icons">groups</span> Committees
    </button>
    <button class="sa-tab" [class.active]="tab()==='members'" (click)="tab.set('members')">
      <span class="material-icons">people</span> Members
    </button>
  </div>

  <div *ngIf="loading()" class="sa-loading"><div class="spinner"></div></div>

  <!-- Admins Tab -->
  <div class="sa-card" *ngIf="!loading() && tab()==='admins'">
    <div class="sa-card-header">
      <h3>All Admins</h3>
      <input type="text" class="sa-search" placeholder="Search admins..." [(ngModel)]="adminSearch">
    </div>
    <div class="sa-table-wrap">
      <table class="sa-table">
        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Committees</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let a of filteredAdmins(); let i=index">
            <td class="muted">{{ i+1 }}</td>
            <td>
              <div class="cell-user">
                <div class="cell-avatar" [style.background]="getColor(a.name||'')">{{ getInitials(a.name||'A') }}</div>
                <span>{{ a.name }}</span>
              </div>
            </td>
            <td class="muted">{{ a.email }}</td>
            <td>{{ getAdminCommitteeCount(a.id) }}</td>
            <td>
              <span class="status-badge" [class.active]="a.status!=='suspended'" [class.suspended]="a.status==='suspended'">
                {{ a.status === 'suspended' ? 'Suspended' : 'Active' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-action warn" *ngIf="a.status!=='suspended'" (click)="suspendAdmin(a)" title="Suspend">
                  <span class="material-icons">block</span>
                </button>
                <button class="btn-action success" *ngIf="a.status==='suspended'" (click)="activateAdmin(a)" title="Activate">
                  <span class="material-icons">check_circle</span>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filteredAdmins().length===0"><td colspan="6" class="empty-row">No admins found</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Committees Tab -->
  <div class="sa-card" *ngIf="!loading() && tab()==='committees'">
    <div class="sa-card-header">
      <h3>All Committees</h3>
      <input type="text" class="sa-search" placeholder="Search committees..." [(ngModel)]="committeeSearch">
    </div>
    <div class="sa-table-wrap">
      <table class="sa-table">
        <thead><tr><th>#</th><th>Committee</th><th>Admin</th><th>Members</th><th>Monthly</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of filteredCommittees(); let i=index">
            <td class="muted">{{ i+1 }}</td>
            <td><span class="font-bold">{{ c.name }}</span></td>
            <td class="muted">{{ getAdminName(c.created_by) }}</td>
            <td>{{ c.total_members }}</td>
            <td>PKR {{ c.monthly_amount | number }}</td>
            <td>
              <span class="status-badge" [class.active]="c.status==='active'" [class.pending]="c.status==='pending'" [class.suspended]="c.status==='suspended'" [class.completed]="c.status==='completed'">
                {{ c.status | titlecase }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-action warn" *ngIf="c.status!=='suspended'" (click)="suspendCommittee(c)" title="Suspend">
                  <span class="material-icons">pause_circle</span>
                </button>
                <button class="btn-action success" *ngIf="c.status==='suspended'" (click)="activateCommittee(c)" title="Activate">
                  <span class="material-icons">play_circle</span>
                </button>
                <button class="btn-action danger" (click)="deleteCommittee(c)" title="Delete">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filteredCommittees().length===0"><td colspan="7" class="empty-row">No committees found</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Members Tab -->
  <div class="sa-card" *ngIf="!loading() && tab()==='members'">
    <div class="sa-card-header">
      <h3>All Members</h3>
      <input type="text" class="sa-search" placeholder="Search members..." [(ngModel)]="memberSearch">
    </div>
    <div class="sa-table-wrap">
      <table class="sa-table">
        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>
          <tr *ngFor="let m of filteredMembers(); let i=index">
            <td class="muted">{{ i+1 }}</td>
            <td>
              <div class="cell-user">
                <div class="cell-avatar" [style.background]="getColor(m.name||'')">{{ getInitials(m.name||'M') }}</div>
                <div><div class="font-bold">{{ m.name }}</div></div>
              </div>
            </td>
            <td class="muted">{{ m.email }}</td>
            <td class="muted">{{ m.phone }}</td>
            <td><span class="role-badge">{{ m.role | titlecase }}</span></td>
            <td><span class="status-badge" [class.active]="m.status==='active'" [class.suspended]="m.status==='inactive'">{{ m.status | titlecase }}</span></td>
          </tr>
          <tr *ngIf="filteredMembers().length===0"><td colspan="6" class="empty-row">No members found</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
  `,
  styles: [`
    .sa-page { min-height: 100vh; background: #F8FAFC; font-family: "Inter", sans-serif; }
    .sa-header { background: linear-gradient(135deg, #0F172A, #1E3A5F); padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; }
    .sa-brand { display: flex; align-items: center; gap: 14px; }
    .sa-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; .material-icons { color: white; font-size: 26px; } }
    .sa-brand h1 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 2px; }
    .sa-brand p { font-size: 13px; color: rgba(255,255,255,0.6); }
    .btn-logout { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; .material-icons { font-size: 16px; } &:hover { background: rgba(255,255,255,0.2); } }
    .sa-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 24px 32px; }
    .sa-stat { background: white; border-radius: 12px; padding: 20px; border: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 4px rgba(15,23,42,0.06); }
    .sa-stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; .material-icons { font-size: 22px; } &.blue { background: #dbeafe; .material-icons { color: #2563eb; } } &.green { background: #d1fae5; .material-icons { color: #10b981; } } &.purple { background: #ede9fe; .material-icons { color: #7c3aed; } } &.orange { background: #fef3c7; .material-icons { color: #f59e0b; } } }
    .sa-stat-val { font-size: 28px; font-weight: 800; color: #0F172A; }
    .sa-stat-lbl { font-size: 13px; color: #64748B; font-weight: 500; }
    .sa-tabs { display: flex; gap: 4px; padding: 0 32px 16px; }
    .sa-tab { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; border: 1.5px solid #E2E8F0; background: white; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.15s; .material-icons { font-size: 16px; } &:hover { border-color: #1E3A5F; color: #1E3A5F; } &.active { background: #1E3A5F; border-color: #1E3A5F; color: white; } }
    .sa-loading { display: flex; justify-content: center; padding: 80px; }
    .spinner { width: 40px; height: 40px; border: 3px solid #E2E8F0; border-top-color: #1E3A5F; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .sa-card { margin: 0 32px 32px; background: white; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 1px 4px rgba(15,23,42,0.06); overflow: hidden; }
    .sa-card-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid #E2E8F0; h3 { font-size: 16px; font-weight: 700; color: #0F172A; } }
    .sa-search { padding: 8px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 13px; outline: none; width: 240px; &:focus { border-color: #1E3A5F; } }
    .sa-table-wrap { overflow-x: auto; }
    .sa-table { width: 100%; border-collapse: collapse; font-size: 14px; thead tr { background: #F8FAFC; border-bottom: 2px solid #E2E8F0; th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; } } tbody tr { border-bottom: 1px solid #F1F5F9; transition: background 0.15s; &:hover { background: #F8FAFC; } &:last-child { border-bottom: none; } td { padding: 14px 16px; color: #334155; vertical-align: middle; } } }
    .muted { color: #64748B !important; font-size: 13px; }
    .font-bold { font-weight: 600; color: #0F172A; }
    .cell-user { display: flex; align-items: center; gap: 10px; }
    .cell-avatar { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0; }
    .status-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; &.active { background: #d1fae5; color: #065f46; } &.pending { background: #fef3c7; color: #92400e; } &.suspended { background: #fee2e2; color: #991b1b; } &.completed { background: #e0e7ff; color: #3730a3; } }
    .role-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #EEF3FA; color: #1E3A5F; }
    .action-btns { display: flex; gap: 6px; }
    .btn-action { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; .material-icons { font-size: 16px; } &.warn { background: #fef3c7; color: #92400e; &:hover { background: #fde68a; } } &.success { background: #d1fae5; color: #065f46; &:hover { background: #a7f3d0; } } &.danger { background: #fee2e2; color: #991b1b; &:hover { background: #fecaca; } } }
    .empty-row { text-align: center; color: #94A3B8; padding: 40px !important; font-size: 14px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) { .sa-stats { grid-template-columns: repeat(2, 1fr); } .sa-card, .sa-stats, .sa-tabs { padding-left: 16px; padding-right: 16px; } }
  `]
})
export class SuperAdminComponent implements OnInit {
  loading = signal(true);
  tab = signal<"admins"|"committees"|"members">("admins");
  admins = signal<any[]>([]);
  committees = signal<any[]>([]);
  members = signal<any[]>([]);

  adminSearch = "";
  committeeSearch = "";
  memberSearch = "";

  private colors = ["#2563eb","#7c3aed","#db2777","#059669","#d97706","#dc2626"];

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.loadAll();
  }

  private async loadAll() {
    this.loading.set(true);
    try {
      const [adminsRes, committeesRes, membersRes] = await Promise.all([
        this.supabase.client.from("profiles").select("*").in("role", ["admin", "super_admin"]).order("created_at", { ascending: false }),
        this.supabase.client.from("committees").select("*").order("created_at", { ascending: false }),
        this.supabase.client.from("members").select("*").order("created_at", { ascending: false })
      ]);
      this.admins.set(adminsRes.data || []);
      this.committees.set(committeesRes.data || []);
      this.members.set(membersRes.data || []);
    } finally {
      this.loading.set(false);
    }
  }

  activeCommittees() { return this.committees().filter(c => c.status === "active").length; }

  filteredAdmins() {
    const q = this.adminSearch.toLowerCase();
    return q ? this.admins().filter(a => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)) : this.admins();
  }

  filteredCommittees() {
    const q = this.committeeSearch.toLowerCase();
    return q ? this.committees().filter(c => c.name?.toLowerCase().includes(q)) : this.committees();
  }

  filteredMembers() {
    const q = this.memberSearch.toLowerCase();
    return q ? this.members().filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)) : this.members();
  }

  getAdminName(id: string): string {
    return this.admins().find(a => a.id === id)?.name || "Unknown";
  }

  getAdminCommitteeCount(adminId: string): number {
    return this.committees().filter(c => c.created_by === adminId).length;
  }

  async suspendAdmin(admin: any) {
    if (!confirm(`Suspend ${admin.name}? They will not be able to login.`)) return;
    const { error } = await this.supabase.client.from("profiles").update({ status: "suspended" }).eq("id", admin.id);
    if (error) { this.toast.error("Failed: " + error.message); return; }
    this.admins.update(list => list.map(a => a.id === admin.id ? { ...a, status: "suspended" } : a));
    this.toast.success(`${admin.name} suspended`);
  }

  async activateAdmin(admin: any) {
    const { error } = await this.supabase.client.from("profiles").update({ status: "active" }).eq("id", admin.id);
    if (error) { this.toast.error("Failed: " + error.message); return; }
    this.admins.update(list => list.map(a => a.id === admin.id ? { ...a, status: "active" } : a));
    this.toast.success(`${admin.name} activated`);
  }

  async suspendCommittee(c: any) {
    if (!confirm(`Suspend committee "${c.name}"?`)) return;
    const { error } = await this.supabase.client.from("committees").update({ status: "suspended" }).eq("id", c.id);
    if (error) { this.toast.error("Failed: " + error.message); return; }
    this.committees.update(list => list.map(x => x.id === c.id ? { ...x, status: "suspended" } : x));
    this.toast.success(`"${c.name}" suspended`);
  }

  async activateCommittee(c: any) {
    const { error } = await this.supabase.client.from("committees").update({ status: "active" }).eq("id", c.id);
    if (error) { this.toast.error("Failed: " + error.message); return; }
    this.committees.update(list => list.map(x => x.id === c.id ? { ...x, status: "active" } : x));
    this.toast.success(`"${c.name}" activated`);
  }

  async deleteCommittee(c: any) {
    if (!confirm(`Permanently delete "${c.name}"? This cannot be undone.`)) return;
    await this.supabase.client.from("committee_members").delete().eq("committee_id", c.id);
    const { error } = await this.supabase.client.from("committees").delete().eq("id", c.id);
    if (error) { this.toast.error("Failed: " + error.message); return; }
    this.committees.update(list => list.filter(x => x.id !== c.id));
    this.toast.success(`"${c.name}" deleted`);
  }

  logout() { this.auth.logout(); }

  getInitials(name: string): string { return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
  getColor(name: string): string { return this.colors[(name.charCodeAt(0) || 0) % this.colors.length]; }
}
