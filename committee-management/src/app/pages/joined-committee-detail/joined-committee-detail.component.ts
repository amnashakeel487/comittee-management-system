import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-joined-committee-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/joined-committees" class="back-link">
        <span class="material-icons">arrow_back</span> Back to Joined Committees
      </a>

      <div class="loading-state" *ngIf="loading()">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!loading() && !committee()" class="empty-state">
        <span class="material-icons empty-icon">search_off</span>
        <h3>Committee not found</h3>
        <p>You may not be a member of this committee, or it has been removed.</p>
        <a routerLink="/joined-committees" class="btn btn-primary" style="margin-top:16px">
          <span class="material-icons">arrow_back</span> Back
        </a>
      </div>

      <ng-container *ngIf="!loading() && committee() as c">
        <!-- ========================= HEADER ========================= -->
        <div class="hdr">
          <div class="hdr-left">
            <div class="hdr-icon">
              <span class="material-icons">groups</span>
            </div>
            <div>
              <div class="hdr-title-row">
                <h1>{{ c.name }}</h1>
                <span class="status-pill" [ngClass]="statusClass(c.status)">
                  {{ statusLabel(c.status) }}
                </span>
              </div>
              <p class="hdr-sub">
                Managed by <strong>{{ adminName() }}</strong>
                <span class="material-icons verified-ic" *ngIf="adminVerified()" title="Verified Admin">verified</span>
              </p>
            </div>
          </div>
          <a routerLink="/my-payments" class="btn btn-primary">
            <span class="material-icons">upload</span> Upload Payment
          </a>
        </div>

        <!-- ========================= STATS ========================= -->
        <div class="stats">
          <div class="stat">
            <span class="stat-label">Monthly</span>
            <span class="stat-val primary">PKR {{ c.monthly_amount | number }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total Members</span>
            <span class="stat-val">{{ c.total_members }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Duration</span>
            <span class="stat-val">{{ c.duration_months }} months</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total Pool</span>
            <span class="stat-val primary">PKR {{ (c.monthly_amount * c.total_members) | number }}</span>
          </div>
        </div>

        <!-- ========================= PROGRESS ========================= -->
        <div class="card">
          <div class="card-head">
            <div class="card-title">
              <span class="material-icons">trending_up</span>
              <span>Progress</span>
            </div>
            <span class="card-meta">
              Month {{ c.current_month || 0 }} / {{ c.duration_months }}
            </span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progressPct()"></div>
          </div>
        </div>

        <!-- ========================= MY STATUS ========================= -->
        <div class="card my-card" *ngIf="myRow() as mine">
          <div class="card-head">
            <div class="card-title">
              <span class="material-icons">person_pin</span>
              <span>My Participation</span>
            </div>
          </div>
          <div class="mine-grid">
            <div class="mine-cell">
              <span class="cell-label">My Turn</span>
              <span class="cell-val">
                {{ mine.payout_order ? '#' + mine.payout_order : 'Not yet assigned' }}
              </span>
            </div>
            <div class="mine-cell">
              <span class="cell-label">My Payout</span>
              <span class="cell-val">PKR {{ (c.monthly_amount * c.total_members) | number }}</span>
            </div>
            <div class="mine-cell">
              <span class="cell-label">Paid Months</span>
              <span class="cell-val">{{ myPaidCount() }} / {{ c.duration_months }}</span>
            </div>
            <div class="mine-cell">
              <span class="cell-label">Pending Review</span>
              <span class="cell-val">{{ myPendingCount() }}</span>
            </div>
          </div>
        </div>

        <!-- ========================= PAYOUT SCHEDULE ========================= -->
        <div class="card">
          <div class="card-head">
            <div class="card-title">
              <span class="material-icons">event_available</span>
              <span>Payout Schedule</span>
            </div>
            <span class="card-meta">Who receives the pool each month</span>
          </div>
          <div class="slots-grid">
            <div
              *ngFor="let s of payoutSlots()"
              class="slot"
              [class.slot-me]="s.isMe"
              [class.slot-current]="s.isCurrent"
              [class.slot-empty]="!s.member"
            >
              <div class="slot-month">
                <span class="slot-num">M{{ s.month }}</span>
                <span class="slot-badge" *ngIf="s.isCurrent">Current</span>
                <span class="slot-badge mine" *ngIf="s.isMe">You</span>
              </div>
              <div class="slot-body" *ngIf="s.member">
                <div class="slot-avatar" [style.background]="avatarColor(s.member.name)">
                  {{ initials(s.member.name) }}
                </div>
                <div class="slot-info">
                  <span class="slot-name">{{ s.member.name || 'Unnamed' }}</span>
                  <span class="slot-amount">PKR {{ (c.monthly_amount * c.total_members) | number }}</span>
                </div>
              </div>
              <div class="slot-body slot-empty-body" *ngIf="!s.member">
                <span class="material-icons">help_outline</span>
                <span>Not yet assigned</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================= MEMBERS ========================= -->
        <div class="card">
          <div class="card-head">
            <div class="card-title">
              <span class="material-icons">group</span>
              <span>Committee Members</span>
            </div>
            <span class="card-meta">{{ members().length }} of {{ c.total_members }}</span>
          </div>
          <div class="members-list">
            <div
              *ngFor="let cm of members()"
              class="member-row"
              [class.member-me]="cm.member_id === myMemberId()"
            >
              <div class="m-avatar" [style.background]="avatarColor(cm.member?.name)">
                {{ initials(cm.member?.name) }}
              </div>
              <div class="m-info">
                <span class="m-name">
                  {{ cm.member?.name || 'Unnamed Member' }}
                  <span class="me-tag" *ngIf="cm.member_id === myMemberId()">You</span>
                </span>
                <span class="m-sub">Joined {{ cm.joined_at | date: 'MMM d, y' }}</span>
              </div>
              <div class="m-turn">
                <span class="turn-pill" [class.turn-tba]="!cm.payout_order">
                  {{ cm.payout_order ? 'Turn #' + cm.payout_order : 'No turn yet' }}
                </span>
              </div>
            </div>
            <div *ngIf="members().length === 0" class="members-empty">
              <span class="material-icons">person_off</span>
              <span>No members enrolled yet.</span>
            </div>
          </div>
        </div>

        <!-- ========================= DESCRIPTION ========================= -->
        <div class="card" *ngIf="c.description">
          <div class="card-head">
            <div class="card-title">
              <span class="material-icons">description</span>
              <span>About this committee</span>
            </div>
          </div>
          <p class="desc">{{ c.description }}</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { animation: fadeIn 0.3s ease; max-width: 1100px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; color: var(--gray-600); font-size: 13px; font-weight: 600; text-decoration: none; margin-bottom: 18px; &:hover { color: #1E3A5F; } .material-icons { font-size: 18px; } }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .empty-state { text-align: center; padding: 60px; background: white; border-radius: 12px; border: 1px solid var(--gray-200); }
    .empty-icon { font-size: 56px; color: var(--gray-300); display: block; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; color: var(--gray-700); margin-bottom: 8px; }
    .empty-state p { font-size: 14px; color: var(--gray-500); }

    /* Header */
    .hdr { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
    .hdr-left { display: flex; align-items: center; gap: 14px; }
    .hdr-icon { width: 54px; height: 54px; border-radius: 12px; background: #EEF3FA; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { font-size: 28px; color: #1E3A5F; } }
    .hdr-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .hdr-title-row h1 { font-size: 22px; font-weight: 700; color: var(--gray-900); }
    .hdr-sub { font-size: 13px; color: var(--gray-500); margin-top: 3px; display: flex; align-items: center; gap: 4px; }
    .hdr-sub strong { color: var(--gray-700); font-weight: 700; }
    .verified-ic { font-size: 16px; color: #2563eb; }

    .status-pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-completed { background: #dbeafe; color: #1e40af; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-paused { background: #fee2e2; color: #991b1b; }
    .status-gray { background: var(--gray-100); color: var(--gray-600); }

    /* Stats */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat { background: white; border: 1px solid var(--gray-200); border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); }
    .stat-label { display: block; font-size: 11px; color: var(--gray-400); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .stat-val { display: block; font-size: 17px; font-weight: 700; color: var(--gray-900); &.primary { color: #1E3A5F; } }

    /* Card shell */
    .card { background: white; border: 1px solid var(--gray-200); border-radius: 14px; padding: 18px 20px; margin-bottom: 18px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); }
    .card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--gray-800); .material-icons { font-size: 18px; color: #1E3A5F; } }
    .card-meta { font-size: 12px; color: var(--gray-500); }

    /* Progress */
    .progress-bar { height: 8px; background: var(--gray-100); border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #1E3A5F, #2563EB); border-radius: 4px; transition: width 0.5s ease; }

    /* My participation */
    .my-card { background: linear-gradient(135deg, #EEF3FA, #ffffff); border-color: #CBD5E1; }
    .mine-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .mine-cell { background: white; border: 1px solid var(--gray-200); border-radius: 10px; padding: 12px 14px; }
    .cell-label { display: block; font-size: 11px; color: var(--gray-400); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .cell-val { display: block; font-size: 15px; font-weight: 700; color: var(--gray-900); }

    /* Payout slots */
    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
    .slot { border: 1px solid var(--gray-200); border-radius: 10px; padding: 12px; background: var(--gray-50); display: flex; flex-direction: column; gap: 10px; transition: all 0.15s; }
    .slot.slot-me { background: linear-gradient(135deg, #EEF3FA, #ffffff); border-color: #1E3A5F; box-shadow: 0 2px 8px rgba(30,58,95,0.1); }
    .slot.slot-current { border-color: #f59e0b; background: linear-gradient(135deg, #fff7ed, #ffffff); }
    .slot.slot-empty { background: var(--gray-50); border-style: dashed; }
    .slot-month { display: flex; align-items: center; gap: 6px; }
    .slot-num { font-size: 12px; font-weight: 700; color: var(--gray-700); background: white; border: 1px solid var(--gray-200); padding: 3px 8px; border-radius: 6px; }
    .slot-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #f59e0b; color: white; padding: 2px 6px; border-radius: 10px; }
    .slot-badge.mine { background: #1E3A5F; }
    .slot-body { display: flex; align-items: center; gap: 10px; }
    .slot-empty-body { color: var(--gray-400); font-size: 12px; font-style: italic; .material-icons { font-size: 16px; } }
    .slot-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .slot-info { display: flex; flex-direction: column; min-width: 0; }
    .slot-name { font-size: 13px; font-weight: 700; color: var(--gray-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .slot-amount { font-size: 11px; color: var(--gray-500); font-weight: 600; }

    /* Members list */
    .members-list { display: flex; flex-direction: column; gap: 8px; }
    .member-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 10px; transition: all 0.15s; }
    .member-row.member-me { background: linear-gradient(135deg, #EEF3FA, #ffffff); border-color: #1E3A5F; }
    .m-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .m-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .m-name { font-size: 14px; font-weight: 700; color: var(--gray-900); display: inline-flex; align-items: center; gap: 6px; }
    .me-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #1E3A5F; color: white; padding: 1px 6px; border-radius: 10px; }
    .m-sub { font-size: 11px; color: var(--gray-500); margin-top: 2px; }
    .m-turn { flex-shrink: 0; }
    .turn-pill { display: inline-flex; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #1E3A5F; color: white; &.turn-tba { background: var(--gray-200); color: var(--gray-600); } }
    .members-empty { display: flex; align-items: center; gap: 8px; color: var(--gray-400); font-size: 13px; padding: 16px; justify-content: center; }

    .desc { font-size: 14px; color: var(--gray-600); line-height: 1.6; white-space: pre-wrap; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.15s; .material-icons { font-size: 16px; } }
    .btn-primary { background: #1E3A5F; color: white; &:hover { background: #152C4A; } }

    @media (max-width: 768px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .mine-grid { grid-template-columns: repeat(2, 1fr); }
      .hdr { align-items: flex-start; }
    }
  `]
})
export class JoinedCommitteeDetailComponent implements OnInit {
  loading = signal(true);
  committee = signal<any | null>(null);
  admin = signal<any | null>(null);
  members = signal<any[]>([]);
  myMemberId = signal<string | null>(null);
  myPaidCount = signal(0);
  myPendingCount = signal(0);

  private avatarPalette = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2','#65a30d'];

  payoutSlots = computed(() => {
    const c = this.committee();
    if (!c) return [];
    const mine = this.myMemberId();
    const cur = c.current_month || 0;
    const slots = [];
    for (let m = 1; m <= c.duration_months; m++) {
      const row = this.members().find((cm: any) => cm.payout_order === m);
      slots.push({
        month: m,
        member: row?.member || null,
        memberId: row?.member_id || null,
        isMe: !!(mine && row?.member_id === mine),
        isCurrent: m === cur
      });
    }
    return slots;
  });

  myRow = computed(() => {
    const mine = this.myMemberId();
    if (!mine) return null;
    return this.members().find((cm: any) => cm.member_id === mine) || null;
  });

  adminName = computed(() => this.admin()?.name || 'Admin');
  adminVerified = computed(() => !!this.admin()?.verified);

  progressPct = computed(() => {
    const c = this.committee();
    if (!c?.duration_months) return 0;
    return Math.round(((c.current_month || 0) / c.duration_months) * 100);
  });

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private supabase: SupabaseService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    await this.loadDetail(id);
  }

  private async loadDetail(committeeId: string) {
    try {
      const user = this.auth.currentUser();
      const email = (user?.email || '').trim();

      const { data: committee } = await this.supabase.client
        .from('committees')
        .select('id, name, description, monthly_amount, total_members, duration_months, status, current_month, created_by, start_date')
        .eq('id', committeeId)
        .maybeSingle();

      if (!committee) { this.committee.set(null); return; }
      this.committee.set(committee);

      if (committee.created_by) {
        const { data: adminProfile } = await this.supabase.client
          .from('profiles')
          .select('id, name, email, verified')
          .eq('id', committee.created_by)
          .maybeSingle();
        this.admin.set(adminProfile || null);
      }

      const { data: cms } = await this.supabase.client
        .from('committee_members')
        .select('id, member_id, committee_id, payout_order, status, joined_at')
        .eq('committee_id', committeeId)
        .order('payout_order', { ascending: true, nullsFirst: false });

      const memberIds = [...new Set((cms || []).map((c: any) => c.member_id).filter(Boolean))];
      let memberMap = new Map<string, any>();
      if (memberIds.length) {
        const { data: ms } = await this.supabase.client
          .from('members')
          .select('id, name, email, phone')
          .in('id', memberIds);
        memberMap = new Map((ms || []).map((m: any) => [m.id, m]));
      }

      const enriched = (cms || []).map((cm: any) => ({
        ...cm,
        member: memberMap.get(cm.member_id) || null
      }));
      this.members.set(enriched);

      if (email) {
        const mine = enriched.find((cm: any) =>
          cm.member?.email && cm.member.email.toLowerCase() === email.toLowerCase()
        );
        if (mine) {
          this.myMemberId.set(mine.member_id);
          const { data: pays } = await this.supabase.client
            .from('payments')
            .select('status')
            .eq('member_id', mine.member_id)
            .eq('committee_id', committeeId);
          this.myPaidCount.set((pays || []).filter((p: any) => p.status === 'approved').length);
          this.myPendingCount.set((pays || []).filter((p: any) => p.status === 'pending' || p.status === 'under_review').length);
        }
      }
    } catch (e: any) {
      this.toast.error('Failed to load committee: ' + (e?.message || ''));
    } finally {
      this.loading.set(false);
    }
  }

  initials(name: string | null | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  }

  avatarColor(name: string | null | undefined): string {
    if (!name) return this.avatarPalette[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
    return this.avatarPalette[Math.abs(hash) % this.avatarPalette.length];
  }

  statusLabel(s: string | null | undefined): string {
    if (!s) return 'Unknown';
    return s.replace(/_/g, ' ');
  }

  statusClass(s: string | null | undefined): string {
    switch ((s || '').toLowerCase()) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'paused': return 'status-paused';
      default: return 'status-gray';
    }
  }
}
