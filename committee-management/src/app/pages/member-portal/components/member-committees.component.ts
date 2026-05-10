import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberDataService } from '../../../services/member-data.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-member-committees',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="m-committees">
      <div class="page-header">
        <div class="page-title">
          <h1>My Committees</h1>
          <p>All committees you are a member of</p>
        </div>
      </div>

      <div *ngIf="loading()" class="loading-center"><div class="spinner"></div></div>

      <div *ngIf="!loading() && memberships().length === 0" class="empty-card">
        <span class="material-icons">groups</span>
        <h3>No Committees Yet</h3>
        <p>You haven't been added to any committee. Contact your admin.</p>
      </div>

      <div *ngFor="let m of memberships()" class="committee-card">
        <!-- Header -->
        <div class="cc-header">
          <div class="cc-icon"><span class="material-icons">groups</span></div>
          <div class="cc-info">
            <div class="cc-title-row">
              <h3>{{ m.committee.name }}</h3>
              <span class="badge" [ngClass]="{
                'badge-success': m.committee.status === 'active',
                'badge-warning': m.committee.status === 'pending',
                'badge-gray': m.committee.status === 'completed'
              }">{{ m.committee.status | titlecase }}</span>
            </div>
            <p *ngIf="m.committee.description">{{ m.committee.description }}</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="cc-stats">
          <div class="cc-stat">
            <span class="material-icons">payments</span>
            <div><b>PKR {{ m.committee.monthly_amount | number }}</b><span>Monthly Amount</span></div>
          </div>
          <div class="cc-stat">
            <span class="material-icons">people</span>
            <div><b>{{ m.committee.total_members }}</b><span>Total Members</span></div>
          </div>
          <div class="cc-stat">
            <span class="material-icons">format_list_numbered</span>
            <div><b>#{{ m.member.payout_order }}</b><span>My Turn</span></div>
          </div>
          <div class="cc-stat">
            <span class="material-icons">account_balance_wallet</span>
            <div><b>PKR {{ (m.committee.monthly_amount * m.committee.total_members) | number }}</b><span>Total Pool</span></div>
          </div>
          <div class="cc-stat">
            <span class="material-icons">calendar_today</span>
            <div><b>{{ m.committee.start_date | date:'MMM d, yyyy' }}</b><span>Start Date</span></div>
          </div>
          <div class="cc-stat">
            <span class="material-icons">event</span>
            <div><b>{{ m.committee.duration_months }} months</b><span>Duration</span></div>
          </div>
        </div>

        <!-- Progress -->
        <div class="cc-progress" *ngIf="m.committee.status === 'active'">
          <div class="progress-row">
            <span class="text-sm text-muted">Progress</span>
            <span class="text-sm font-semibold progress-pct">{{ getProgress(m.committee) }}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" [style.width.%]="getProgress(m.committee)"></div></div>
          <span class="text-xs text-muted">Month {{ m.committee.current_month || 0 }} of {{ m.committee.duration_months }} — {{ getRemainingMonths(m.committee) }} months remaining</span>
        </div>

        <!-- My Payout -->
        <div class="my-payout" *ngIf="m.myPayout">
          <div class="payout-icon"><span class="material-icons">account_balance_wallet</span></div>
          <div>
            <p class="payout-label">My Payout — Turn #{{ m.member.payout_order }}</p>
            <p class="payout-amount">PKR {{ m.myPayout.total_amount | number }}</p>
            <span class="badge" [ngClass]="{
              'badge-success': m.myPayout.status === 'released',
              'badge-info': m.myPayout.status === 'scheduled',
              'badge-gray': m.myPayout.status === 'pending'
            }">{{ m.myPayout.status | titlecase }}</span>
          </div>
        </div>

        <!-- Members List -->
        <div class="cc-members" *ngIf="m.allMembers?.length > 0">
          <h4 class="cc-section-title">
            <span class="material-icons">people</span> Committee Members & Turn Order
          </h4>
          <div class="members-table">
            <div *ngFor="let cm of m.allMembers" class="member-row"
                 [class.my-row]="cm.members?.email === auth.currentUser()?.email">
              <div class="turn-num" [class.current]="cm.payout_order === (m.committee.current_month || 0) + 1">
                {{ cm.payout_order }}
              </div>
              <div class="member-info">
                <span class="member-name">{{ cm.members?.name }}</span>
                <span class="you-tag" *ngIf="cm.members?.email === auth.currentUser()?.email"> (You)</span>
              </div>
              <span class="badge badge-info" *ngIf="cm.payout_order === (m.committee.current_month || 0) + 1">Current Turn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .m-committees { animation: fadeIn 0.3s ease; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; color: #2A1F14; }
    .page-header p { font-size: 14px; color: #93785B; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .empty-card { text-align: center; padding: 60px; background: white; border-radius: 12px; border: 1px solid #E2D8CE; .material-icons { font-size: 56px; color: #C9BAA8; display: block; margin-bottom: 16px; } h3 { font-size: 18px; color: #4E3D2E; margin-bottom: 8px; } p { font-size: 14px; color: #A69080; } }

    .committee-card { background: white; border-radius: 12px; border: 1px solid #E2D8CE; margin-bottom: 24px; overflow: hidden; box-shadow: 0 1px 4px rgba(62,54,46,0.06); }

    .cc-header { display: flex; gap: 14px; padding: 20px 24px 16px; border-bottom: 1px solid #F0EBE4; }
    .cc-icon { width: 48px; height: 48px; background: #F0E8DF; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { color: #865D36; font-size: 24px; } }
    .cc-info { flex: 1; }
    .cc-info p { font-size: 13px; color: #93785B; margin: 4px 0 0; }
    .cc-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .cc-title-row h3 { font-size: 17px; font-weight: 700; margin: 0; color: #2A1F14; }

    .cc-stats { display: flex; flex-wrap: wrap; padding: 16px 24px; border-bottom: 1px solid #F0EBE4; }
    .cc-stat { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 150px; padding: 8px 12px; .material-icons { font-size: 20px; color: #865D36; } div { display: flex; flex-direction: column; } b { font-size: 14px; font-weight: 700; color: #2A1F14; } span { font-size: 11px; color: #A69080; } }

    .cc-progress { padding: 16px 24px; border-bottom: 1px solid #F0EBE4; }
    .progress-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .text-sm { font-size: 13px; }
    .text-muted { color: #93785B; }
    .text-xs { font-size: 11px; }
    .font-semibold { font-weight: 600; }
    .progress-pct { color: #865D36; }
    .progress-bar { height: 8px; background: #E2D8CE; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #865D36, #AC8968); border-radius: 4px; transition: width 0.5s ease; }

    .my-payout { display: flex; align-items: center; gap: 16px; margin: 16px 24px; padding: 16px; background: linear-gradient(135deg, #FAF7F4, #F0E8DF); border: 1.5px solid #C9BAA8; border-radius: 10px; }
    .payout-icon { width: 44px; height: 44px; background: #865D36; border-radius: 10px; display: flex; align-items: center; justify-content: center; .material-icons { color: white; font-size: 22px; } }
    .payout-label { font-size: 12px; color: #93785B; margin: 0 0 4px; }
    .payout-amount { font-size: 20px; font-weight: 800; color: #865D36; margin: 0 0 6px; }

    .cc-section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #2A1F14; padding: 16px 24px 10px; border-top: 1px solid #F0EBE4; .material-icons { font-size: 18px; color: #865D36; } }
    .members-table { padding: 0 24px 16px; display: flex; flex-direction: column; gap: 6px; }
    .member-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #FAF7F4; border-radius: 8px; border: 1px solid #E2D8CE; &.my-row { background: #F0E8DF; border-color: #C9BAA8; } }
    .turn-num { width: 28px; height: 28px; background: #F0E8DF; color: #865D36; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; &.current { background: #865D36; color: white; } }
    .member-info { flex: 1; }
    .member-name { font-size: 14px; font-weight: 600; color: #2A1F14; }
    .you-tag { font-size: 12px; color: #93785B; font-weight: 500; }

    .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-gray { background: #F0EBE4; color: #6B5544; }
    .badge-info { background: #EDE0D4; color: #4E3D2E; }

    @media (max-width: 768px) { .cc-stats { flex-direction: column; } }
  `]
})
export class MemberCommitteesComponent implements OnInit {
  loading = signal(true);
  memberships = signal<any[]>([]);

  constructor(public auth: AuthService, private memberData: MemberDataService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const data = await this.memberData.getMemberships();
      this.memberships.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  getProgress(c: any): number {
    if (!c?.duration_months) return 0;
    return Math.round(((c.current_month || 0) / c.duration_months) * 100);
  }

  getRemainingMonths(c: any): number {
    return Math.max(0, (c.duration_months || 0) - (c.current_month || 0));
  }
}
