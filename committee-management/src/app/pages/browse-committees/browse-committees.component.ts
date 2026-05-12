import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-browse-committees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="browse-page">
  <div class="page-header">
    <div>
      <h1>Browse & Join Committees</h1>
      <p>Discover public committees and request to join</p>
    </div>
  </div>

  <!-- Search & Filter -->
  <div class="search-bar">
    <div class="search-wrap">
      <span class="material-icons">search</span>
      <input type="text" placeholder="Search committees..." [(ngModel)]="searchQuery"
             (ngModelChange)="applyFilter()" class="search-input">
    </div>
    <div class="filter-tabs">
      <button *ngFor="let f of filters" class="filter-btn"
              [class.active]="activeFilter()===f" (click)="setFilter(f)">{{ f }}</button>
    </div>
  </div>

  <div *ngIf="loading()" class="loading-center"><div class="spinner"></div></div>

  <div class="committees-grid" *ngIf="!loading()">
    <div *ngFor="let c of filtered()" class="committee-card">
      <!-- Top row -->
      <div class="cc-top">
        <div class="cc-icon">
          <span class="material-icons">account_balance</span>
        </div>
        <span class="cc-badge" [class.open]="c.status==='active'" [class.pending]="c.status==='pending'" [class.completed]="c.status==='completed'">
          {{ c.status === 'active' ? 'Open' : c.status === 'pending' ? 'Pending' : 'Completed' }}
        </span>
      </div>

      <!-- Name -->
      <div class="cc-name">{{ c.name }}</div>
      <div class="cc-category">{{ c.description || 'Savings Committee' }}</div>

      <!-- Stats grid -->
      <div class="cc-stats-grid">
        <div class="cc-stat-cell">
          <span class="cc-stat-lbl">MONTHLY</span>
          <span class="cc-stat-val accent">PKR {{ c.monthly_amount | number }}</span>
        </div>
        <div class="cc-stat-cell">
          <span class="cc-stat-lbl">MEMBERS</span>
          <span class="cc-stat-val">{{ c.total_members }}</span>
        </div>
        <div class="cc-stat-cell">
          <span class="cc-stat-lbl">START</span>
          <span class="cc-stat-val">{{ c.start_date | date:'MMM yyyy' }}</span>
        </div>
        <div class="cc-stat-cell">
          <span class="cc-stat-lbl">DURATION</span>
          <span class="cc-stat-val">{{ c.duration_months }} months</span>
        </div>
      </div>

      <!-- Progress -->
      <div class="cc-progress-row">
        <span>{{ c.total_members }} slots total</span>
        <span>Month {{ c.current_month || 0 }}/{{ c.duration_months }}</span>
      </div>
      <div class="cc-progress-bar">
        <div class="cc-progress-fill" [style.width.%]="((c.current_month||0)/c.duration_months)*100"></div>
      </div>

      <!-- Focal person -->
      <div class="cc-footer">
        <button class="cc-focal cc-focal-btn" (click)="openAdminProfile(c)" type="button" [title]="'View ' + (c.admin_name || 'Admin') + '\\'s trust profile'">
          <div class="cc-focal-av" [style.background]="getColor(c.admin_name||'')">
            {{ getInitials(c.admin_name||'A') }}
          </div>
          <div class="cc-focal-info">
            <span class="cc-focal-role">Focal Person</span>
            <span class="cc-focal-name">
              {{ c.admin_name || 'Admin' }}
              <span class="material-icons admin-verified-ic" *ngIf="c.admin_verified" title="Verified Admin">verified</span>
            </span>
            <span class="cc-focal-rep" *ngIf="c.admin_review_count > 0">
              <span class="material-icons rep-star">star</span>
              <span class="rep-num">{{ c.admin_reputation.toFixed(1) }}</span>
              <span class="rep-count">· {{ c.admin_review_count }} review{{ c.admin_review_count === 1 ? '' : 's' }}</span>
            </span>
            <span class="cc-focal-rep no-rep" *ngIf="c.admin_review_count === 0">
              No reviews yet
            </span>
          </div>
        </button>
        <div class="cc-actions">
          <button class="btn-details" (click)="openDetail(c)">Details</button>
          <div *ngIf="isMember(c.id)" class="btn-joined">
            <span class="material-icons">check_circle</span> Joined
          </div>
          <div *ngIf="!isMember(c.id) && getRequest(c.id)?.status==='pending'" class="btn-pending">
            Pending
          </div>
          <button *ngIf="!isMember(c.id) && !getRequest(c.id)" class="btn-join" (click)="openRequestModal(c)">
            Join
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="filtered().length===0" class="empty-state">
      <span class="material-icons">search_off</span>
      <h3>No committees found</h3>
      <p>Try adjusting your search or filter</p>
    </div>
  </div>

  <!-- Detail Modal -->
  <div class="modal-overlay" *ngIf="showDetail()" (click)="closeDetail()">
    <div class="modal-box" (click)="$event.stopPropagation()" *ngIf="selectedC()">
      <div class="modal-head">
        <h3>{{ selectedC()!.name }}</h3>
        <button class="modal-close" (click)="closeDetail()">✕</button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-cell"><span>Monthly Amount</span><strong>PKR {{ selectedC()!.monthly_amount | number }}</strong></div>
          <div class="detail-cell"><span>Total Members</span><strong>{{ selectedC()!.total_members }}</strong></div>
          <div class="detail-cell"><span>Duration</span><strong>{{ selectedC()!.duration_months }} months</strong></div>
          <div class="detail-cell"><span>Total Pool</span><strong>PKR {{ (selectedC()!.monthly_amount * selectedC()!.total_members) | number }}</strong></div>
          <div class="detail-cell"><span>Start Date</span><strong>{{ selectedC()!.start_date | date:'MMM d, yyyy' }}</strong></div>
          <div class="detail-cell"><span>Status</span><strong>{{ selectedC()!.status | titlecase }}</strong></div>
        </div>
        <p *ngIf="selectedC()!.description" style="margin-top:14px;font-size:14px;color:#64748B;line-height:1.6">{{ selectedC()!.description }}</p>
        <button type="button" class="detail-admin detail-admin-btn" (click)="openAdminProfile(selectedC())">
          <div class="cc-focal-av lg" [style.background]="getColor(selectedC()!.admin_name||'')">{{ getInitials(selectedC()!.admin_name||'A') }}</div>
          <div class="detail-admin-info">
            <strong>
              {{ selectedC()!.admin_name || 'Admin' }}
              <span class="material-icons admin-verified-ic" *ngIf="selectedC()!.admin_verified" title="Verified Admin">verified</span>
            </strong>
            <span class="detail-admin-rep" *ngIf="selectedC()!.admin_review_count > 0">
              <span class="material-icons rep-star">star</span>
              {{ selectedC()!.admin_reputation.toFixed(1) }}
              <em>· {{ selectedC()!.admin_review_count }} review{{ selectedC()!.admin_review_count === 1 ? '' : 's' }}</em>
            </span>
            <span class="detail-admin-rep no-rep" *ngIf="selectedC()!.admin_review_count === 0">No reviews yet</span>
          </div>
          <span class="detail-admin-chev material-icons">chevron_right</span>
        </button>
      </div>
      <div class="modal-foot">
        <button class="btn-join" *ngIf="!isMember(selectedC()!.id) && !getRequest(selectedC()!.id)"
                (click)="closeDetail(); openRequestModal(selectedC())">Request to Join</button>
        <button class="btn-details" (click)="closeDetail()">Close</button>
      </div>
    </div>
  </div>

  <!-- Request Modal -->
  <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-head">
        <h3>Request to Join — {{ joiningC()?.name }}</h3>
        <button class="modal-close" (click)="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div *ngIf="joinSuccess()" class="join-success">
          <span class="material-icons">check_circle</span>
          <h4>Request Submitted!</h4>
          <p>The admin will review and respond within 24-48 hours.</p>
        </div>
        <div *ngIf="!joinSuccess()">
          <p style="font-size:13px;color:#64748B;margin-bottom:14px">The admin will review your request and respond within 24-48 hours.</p>
          <div class="form-group"><label>Message (Optional)</label>
            <textarea class="form-control" rows="3" [(ngModel)]="requestMessage" placeholder="Introduce yourself..."></textarea>
          </div>
        </div>
      </div>
      <div class="modal-foot" *ngIf="!joinSuccess()">
        <button class="btn-join" (click)="submitRequest()" [disabled]="submitting()">
          {{ submitting() ? 'Sending...' : 'Send Request' }}
        </button>
        <button class="btn-details" (click)="closeModal()">Cancel</button>
      </div>
    </div>
  </div>

  <!-- Admin Trust Profile Modal -->
  <div class="modal-overlay" *ngIf="showAdminProfile()" (click)="closeAdminProfile()">
    <div class="modal-box trust-modal" (click)="$event.stopPropagation()" *ngIf="adminProfile() as ap">
      <div class="modal-head">
        <h3>Admin Trust Profile</h3>
        <button class="modal-close" (click)="closeAdminProfile()">✕</button>
      </div>
      <div class="modal-body trust-body">
        <div class="trust-hero">
          <div class="trust-avatar" [style.background]="getColor(ap.name||'')">{{ getInitials(ap.name||'A') }}</div>
          <div class="trust-identity">
            <div class="trust-name">
              {{ ap.name || 'Admin' }}
              <span class="material-icons admin-verified-ic lg" *ngIf="ap.verified" title="Verified Admin">verified</span>
            </div>
            <div class="trust-role">Committee Focal Person · {{ ap.verified ? 'CNIC-Verified' : 'Not Verified' }}</div>
          </div>
        </div>

        <div class="trust-score-card">
          <div class="trust-score-main">
            <div class="trust-score-num">{{ ap.reputation > 0 ? ap.reputation.toFixed(1) : '—' }}</div>
            <div class="trust-stars">
              <span *ngFor="let s of getStars(ap.reputation)" class="material-icons star-icon" [class.filled]="s">star</span>
            </div>
          </div>
          <div class="trust-score-meta">
            <span class="trust-level" [style.color]="getReputationLevel(ap.reputation).color">
              {{ ap.review_count > 0 ? getReputationLevel(ap.reputation).label : 'New Admin' }}
            </span>
            <span class="trust-count">{{ ap.review_count }} {{ ap.review_count === 1 ? 'review' : 'reviews' }}</span>
          </div>
        </div>

        <div class="trust-reviews-title" *ngIf="ap.review_count > 0">Recent reviews</div>

        <div *ngIf="adminReviewsLoading()" class="trust-review-loading">
          <div class="spinner" style="width:24px;height:24px"></div>
        </div>

        <div *ngIf="!adminReviewsLoading() && ap.reviews?.length" class="trust-reviews-list">
          <div *ngFor="let r of ap.reviews" class="trust-review">
            <div class="trust-review-head">
              <span class="trust-review-name">{{ r.reviewer?.name || 'Anonymous' }}</span>
              <div class="trust-review-stars">
                <span *ngFor="let s of getStars(r.rating)" class="material-icons mini-star" [class.filled]="s">star</span>
              </div>
              <span class="trust-review-date">{{ r.created_at | date:'MMM d, y' }}</span>
            </div>
            <p class="trust-review-msg" *ngIf="r.review_message">"{{ r.review_message }}"</p>
            <div class="trust-review-tags" *ngIf="r.tags?.length">
              <span *ngFor="let tag of r.tags" class="trust-tag" [class.positive]="['trusted','cooperative','responsive','recommended'].includes(tag)" [class.negative]="['late_payer','fraud_risk'].includes(tag)">{{ tag | titlecase }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="!adminReviewsLoading() && !ap.reviews?.length && ap.review_count === 0" class="trust-empty">
          <span class="material-icons">rate_review</span>
          <p>This admin hasn't received any reviews yet.</p>
        </div>
      </div>
      <div class="modal-foot trust-foot" *ngIf="ap.committee">
        <button class="btn-join"
                *ngIf="!isMember(ap.committee.id) && !getRequest(ap.committee.id)"
                (click)="joinFromAdminProfile()">
          Request to Join "{{ ap.committee.name }}"
        </button>
        <button class="btn-details" (click)="closeAdminProfile()">Close</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .browse-page { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .page-header { margin-bottom: 24px; h1 { font-size: 24px; font-weight: 700; color: var(--gray-900); } p { font-size: 14px; color: var(--gray-500); margin-top: 4px; } }
    .search-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
    .search-wrap { display: flex; align-items: center; gap: 8px; background: white; border: 1.5px solid var(--gray-200); border-radius: 10px; padding: 10px 14px; flex: 1; min-width: 220px; &:focus-within { border-color: #1E3A5F; } .material-icons { color: var(--gray-400); font-size: 18px; } }
    .search-input { border: none; outline: none; font-size: 14px; color: var(--gray-900); background: none; width: 100%; &::placeholder { color: var(--gray-400); } }
    .filter-tabs { display: flex; gap: 6px; }
    .filter-btn { padding: 8px 18px; border-radius: 20px; border: 1.5px solid var(--gray-200); background: white; font-size: 13px; font-weight: 500; color: var(--gray-600); cursor: pointer; transition: all 0.15s; &:hover { border-color: #1E3A5F; color: #1E3A5F; } &.active { background: #1E3A5F; border-color: #1E3A5F; color: white; } }
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--gray-200); border-top-color: #1E3A5F; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* CARDS */
    .committees-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .committee-card { background: #0F1C2E; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 14px; transition: all 0.2s; &:hover { border-color: rgba(45,140,255,0.3); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); } }
    .cc-top { display: flex; justify-content: space-between; align-items: center; }
    .cc-icon { width: 48px; height: 48px; background: rgba(45,140,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; .material-icons { color: #2d8cff; font-size: 24px; } }
    .cc-badge { padding: 5px 14px; border-radius: 50px; font-size: 13px; font-weight: 700; &.open { background: rgba(34,197,94,0.15); color: #4ade80; } &.pending { background: rgba(250,176,5,0.15); color: #fbbf24; } &.completed { background: rgba(100,116,139,0.15); color: #94a3b8; } }
    .cc-name { font-size: 18px; font-weight: 800; color: white; }
    .cc-category { font-size: 13px; color: #2d8cff; font-weight: 500; }
    .cc-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .cc-stat-cell { background: rgba(255,255,255,0.04); border-radius: 10px; padding: 12px 14px; }
    .cc-stat-lbl { display: block; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px; }
    .cc-stat-val { display: block; font-size: 16px; font-weight: 700; color: white; &.accent { color: #2d8cff; } }
    .cc-progress-row { display: flex; justify-content: space-between; font-size: 13px; color: rgba(255,255,255,0.5); }
    .cc-progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .cc-progress-fill { height: 100%; background: linear-gradient(90deg, #2d8cff, #5aabff); border-radius: 3px; transition: width 0.5s ease; }
    .cc-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }
    .cc-focal { display: flex; align-items: center; gap: 10px; }
    .cc-focal-av { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; flex-shrink: 0; &.lg { width: 44px; height: 44px; font-size: 16px; } }
    .cc-focal-info { display: flex; flex-direction: column; }
    .cc-focal-role { font-size: 11px; color: rgba(255,255,255,0.4); }
    .cc-focal-name { font-size: 13px; font-weight: 700; color: white; }
    .cc-actions { display: flex; gap: 8px; align-items: center; }
    .btn-details { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; &:hover { background: rgba(255,255,255,0.08); color: white; } }
    .btn-join { padding: 8px 20px; border-radius: 8px; background: #2d8cff; color: white; border: none; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; &:hover:not(:disabled) { background: #5aabff; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-joined { display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 8px; background: rgba(34,197,94,0.12); color: #4ade80; font-size: 13px; font-weight: 600; .material-icons { font-size: 16px; } }
    .btn-pending { padding: 8px 14px; border-radius: 8px; background: rgba(250,176,5,0.12); color: #fbbf24; font-size: 13px; font-weight: 600; }
    .empty-state { grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: 12px; border: 1px solid var(--gray-200); .material-icons { font-size: 48px; color: var(--gray-300); display: block; margin-bottom: 12px; } h3 { font-size: 18px; color: var(--gray-700); margin-bottom: 6px; } p { font-size: 14px; color: var(--gray-500); } }

    /* MODALS */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
    .modal-box { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--gray-200); h3 { font-size: 16px; font-weight: 700; color: var(--gray-900); } }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--gray-500); font-size: 18px; padding: 4px 8px; border-radius: 6px; &:hover { background: var(--gray-100); } }
    .modal-body { padding: 20px 22px; }
    .modal-foot { display: flex; gap: 10px; padding: 16px 22px; border-top: 1px solid var(--gray-200); }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .detail-cell { background: var(--gray-50); border-radius: 8px; padding: 10px 12px; span { display: block; font-size: 11px; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; } strong { font-size: 14px; font-weight: 700; color: var(--gray-900); } }
    .detail-admin { display: flex; align-items: center; gap: 12px; background: var(--gray-50); border-radius: 8px; padding: 12px; margin-top: 14px; strong { display: block; font-size: 14px; font-weight: 700; color: var(--gray-900); } span { display: block; font-size: 12px; color: var(--gray-500); } }
    .form-group { margin-bottom: 14px; label { display: block; font-size: 13px; font-weight: 600; color: var(--gray-700); margin-bottom: 6px; } }
    .form-control { width: 100%; padding: 10px 14px; border: 1.5px solid var(--gray-200); border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; resize: vertical; &:focus { border-color: #1E3A5F; } }
    .join-success { text-align: center; padding: 20px 0; .material-icons { font-size: 48px; color: #10b981; display: block; margin-bottom: 12px; } h4 { font-size: 18px; font-weight: 700; color: var(--gray-900); margin-bottom: 6px; } p { font-size: 14px; color: var(--gray-500); } }

    /* Admin reputation inline on the card */
    .cc-focal-btn { all: unset; cursor: pointer; display: flex; align-items: center; gap: 10px; padding: 6px 8px 6px 4px; border-radius: 10px; transition: background 0.15s; &:hover { background: rgba(45,140,255,0.08); } &:focus-visible { outline: 2px solid #2d8cff; outline-offset: 2px; } }
    .admin-verified-ic { font-size: 14px !important; color: #2d8cff; vertical-align: middle; margin-left: 3px; &.lg { font-size: 20px !important; margin-left: 6px; } }
    .cc-focal-rep { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 2px; .rep-star { font-size: 13px !important; color: #fbbf24; } .rep-num { font-weight: 700; color: white; } .rep-count { color: rgba(255,255,255,0.45); } &.no-rep { color: rgba(255,255,255,0.35); font-style: italic; } }

    /* Detail-modal admin card */
    .detail-admin-btn { all: unset; cursor: pointer; width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 12px; background: var(--gray-50); border-radius: 8px; padding: 12px; margin-top: 14px; transition: background 0.15s; &:hover { background: #EEF3FA; } }
    .detail-admin-info { flex: 1; display: flex; flex-direction: column; gap: 2px; strong { display: flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--gray-900); } }
    .detail-admin-rep { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gray-600); .rep-star { font-size: 14px !important; color: #fbbf24; margin-right: 2px; } em { color: var(--gray-400); font-style: normal; } &.no-rep { color: var(--gray-400); font-style: italic; } }
    .detail-admin-chev { color: var(--gray-400); font-size: 22px; }

    /* Admin Trust Profile modal */
    .trust-modal { max-width: 560px; }
    .trust-body { padding: 0 !important; }
    .trust-hero { display: flex; align-items: center; gap: 16px; padding: 22px 22px 18px; border-bottom: 1px solid var(--gray-100); }
    .trust-avatar { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: white; flex-shrink: 0; }
    .trust-identity { flex: 1; }
    .trust-name { display: flex; align-items: center; font-size: 20px; font-weight: 800; color: var(--gray-900); }
    .trust-role { margin-top: 2px; font-size: 13px; color: var(--gray-500); }
    .trust-score-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 18px 22px; padding: 18px 20px; background: linear-gradient(135deg, #1E3A5F 0%, #2E5490 100%); border-radius: 14px; color: white; }
    .trust-score-main { display: flex; align-items: center; gap: 12px; }
    .trust-score-num { font-size: 36px; font-weight: 800; line-height: 1; }
    .trust-stars { display: flex; gap: 1px; .star-icon { font-size: 18px !important; color: rgba(255,255,255,0.25); &.filled { color: #fbbf24; } } }
    .trust-score-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .trust-level { font-weight: 700; font-size: 14px; }
    .trust-count { font-size: 12px; color: rgba(255,255,255,0.65); }
    .trust-reviews-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gray-500); padding: 0 22px 8px; }
    .trust-review-loading { display: flex; justify-content: center; padding: 20px; }
    .trust-reviews-list { display: flex; flex-direction: column; gap: 10px; padding: 0 22px 8px; }
    .trust-review { background: var(--gray-50); border-radius: 10px; padding: 12px 14px; }
    .trust-review-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .trust-review-name { font-size: 13px; font-weight: 700; color: var(--gray-900); flex: 1; }
    .trust-review-stars { display: flex; gap: 1px; .mini-star { font-size: 14px !important; color: var(--gray-300); &.filled { color: #fbbf24; } } }
    .trust-review-date { font-size: 11px; color: var(--gray-400); }
    .trust-review-msg { font-size: 13px; color: var(--gray-700); font-style: italic; line-height: 1.5; margin: 4px 0 6px; }
    .trust-review-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .trust-tag { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: var(--gray-200); color: var(--gray-600); &.positive { background: #d1fae5; color: #065f46; } &.negative { background: #fee2e2; color: #991b1b; } }
    .trust-empty { text-align: center; padding: 28px 22px; color: var(--gray-400); .material-icons { font-size: 42px; color: var(--gray-300); display: block; margin-bottom: 8px; } p { font-size: 13px; } }
    .trust-foot { padding: 12px 22px 18px !important; gap: 8px; }
  `]
})
export class BrowseCommitteesComponent implements OnInit {
  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);
  showDetail = signal(false);
  selectedC = signal<any>(null);
  joiningC = signal<any>(null);
  joinSuccess = signal(false);
  allCommittees: any[] = [];
  filtered = signal<any[]>([]);
  myRequests = signal<any[]>([]);
  myMembershipIds = signal<Set<string>>(new Set());
  searchQuery = '';
  activeFilter = signal('All');
  requestMessage = '';
  filters = ['All', 'Active', 'Pending'];
  // Admin Trust profile modal — populated by openAdminProfile() with the
  // admin's name / verified / reputation_score / review_count plus their
  // 3 most recent reviews fetched on demand (we don't pre-fetch reviews
  // for every card because it would be wasteful).
  showAdminProfile = signal(false);
  adminProfile = signal<any>(null);
  adminReviewsLoading = signal(false);
  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];

  constructor(
    private auth: AuthService,
    private supabase: SupabaseService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await Promise.all([this.loadCommittees(), this.loadMyData()]);
    this.loading.set(false);
  }

  private async loadCommittees() {
    // Use authenticated client — fetch ALL active/pending committees
    const { data, error } = await this.supabase.client
      .from('committees')
      .select('id, name, description, monthly_amount, total_members, duration_months, status, current_month, start_date, created_by')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (error) console.error('Browse load error:', error.message);

    // Fetch admin names separately
    const cs = data || [];
    const creatorIds = [...new Set(cs.map((c: any) => c.created_by).filter(Boolean))];
    let profileMap: Record<string, any> = {};

    if (creatorIds.length > 0) {
      const { data: profiles } = await this.supabase.client
        .from('profiles')
        .select('id, name, verified, reputation_score, review_count')
        .in('id', creatorIds);
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
    }

    const enriched = cs.map((c: any) => ({
      ...c,
      admin_name:         profileMap[c.created_by]?.name             || 'Admin',
      admin_verified:     profileMap[c.created_by]?.verified         || false,
      admin_reputation:   Number(profileMap[c.created_by]?.reputation_score || 0),
      admin_review_count: Number(profileMap[c.created_by]?.review_count     || 0)
    }));

    this.allCommittees = enriched;
    this.applyFilter();
  }

  private async loadMyData() {
    const email = this.auth.currentUser()?.email;
    if (!email) return;

    const { data: memberRecs } = await this.supabase.client
      .from('members').select('id').eq('email', email);

    if (memberRecs?.length) {
      const ids = memberRecs.map((m: any) => m.id);
      const [cmsRes, reqsRes] = await Promise.all([
        this.supabase.client.from('committee_members').select('committee_id').in('member_id', ids),
        this.supabase.client.from('join_requests').select('*').in('member_id', ids)
      ]);
      this.myMembershipIds.set(new Set((cmsRes.data || []).map((c: any) => c.committee_id)));
      this.myRequests.set(reqsRes.data || []);
    }
  }

  applyFilter() {
    let result = this.allCommittees;
    const f = this.activeFilter();
    if (f === 'Active') result = result.filter((c: any) => c.status === 'active');
    else if (f === 'Pending') result = result.filter((c: any) => c.status === 'pending');
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter((c: any) =>
        c.name?.toLowerCase().includes(q) ||
        c.admin_name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    this.filtered.set(result);
  }

  setFilter(f: string) { this.activeFilter.set(f); this.applyFilter(); }
  isMember(id: string) { return this.myMembershipIds().has(id); }
  getRequest(id: string) { return this.myRequests().find((r: any) => r.committee_id === id) || null; }

  openDetail(c: any) { this.selectedC.set(c); this.showDetail.set(true); }
  closeDetail() { this.showDetail.set(false); this.selectedC.set(null); }

  openRequestModal(c: any) {
    this.joiningC.set(c);
    this.requestMessage = '';
    this.joinSuccess.set(false);
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); this.joiningC.set(null); }

  async submitRequest() {
    const c = this.joiningC();
    if (!c) return;
    const user = this.auth.currentUser();
    if (!user?.id) {
      this.toast.error('Please sign in to send a join request.');
      return;
    }
    if (c.created_by === user.id) {
      this.toast.warning("You're the admin of this committee — you can't request to join it.");
      return;
    }

    this.submitting.set(true);
    try {
      // Server-side RPC handles: find-or-create members row for the
      // caller, upsert the join request, and notify the committee admin.
      // See scripts/migration-self-join-request.sql.
      const { error } = await this.supabase.client.rpc('submit_join_request_as_self', {
        p_committee_id: c.id,
        p_message: this.requestMessage || null
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('function') && msg.includes('does not exist')) {
          throw new Error(
            'Server function missing. Run scripts/migration-self-join-request.sql in Supabase.'
          );
        }
        throw new Error(error.message);
      }

      this.myRequests.update(l => [
        ...l.filter((r: any) => r.committee_id !== c.id),
        { committee_id: c.id, member_id: null, status: 'pending' }
      ]);
      this.joinSuccess.set(true);
      this.toast.success('Request sent!');
      setTimeout(() => this.closeModal(), 2000);
    } catch (e: any) {
      this.toast.error('Failed: ' + e?.message);
    } finally {
      this.submitting.set(false);
    }
  }

  // --- Admin Trust profile ----------------------------------------------

  async openAdminProfile(c: any) {
    if (!c?.created_by) return;
    this.adminProfile.set({
      id: c.created_by,
      name: c.admin_name,
      verified: c.admin_verified,
      reputation: c.admin_reputation || 0,
      review_count: c.admin_review_count || 0,
      committee: c, // remember which committee triggered the open, so the
                    // "Request to Join" CTA inside the modal works.
      reviews: []
    });
    this.showAdminProfile.set(true);
    this.adminReviewsLoading.set(true);
    try {
      // Most-recent 3 reviews of this admin.  Profile lookup for the
      // reviewers happens separately because reviews.reviewer_id has an
      // FK to auth.users (outside the public schema) and PostgREST
      // embeds against that schema would return null.
      const { data: revs } = await this.supabase.client
        .from('reviews')
        .select('id, rating, review_message, tags, created_at, reviewer_id, committee_id')
        .eq('reviewed_user_id', c.created_by)
        .order('created_at', { ascending: false })
        .limit(3);

      const reviewerIds = [...new Set((revs || []).map((r: any) => r.reviewer_id).filter(Boolean))];
      let reviewerMap = new Map<string, any>();
      if (reviewerIds.length) {
        const { data: profiles } = await this.supabase.client
          .from('profiles').select('id, name').in('id', reviewerIds);
        reviewerMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      }
      const stitched = (revs || []).map((r: any) => ({
        ...r,
        reviewer: reviewerMap.get(r.reviewer_id) || null
      }));
      this.adminProfile.update(curr => ({ ...curr, reviews: stitched }));
    } catch {
      // Non-fatal — just leave reviews empty so the rest of the card
      // can still render the reputation score.
    } finally {
      this.adminReviewsLoading.set(false);
    }
  }

  closeAdminProfile() {
    this.showAdminProfile.set(false);
    this.adminProfile.set(null);
  }

  joinFromAdminProfile() {
    const ap = this.adminProfile();
    if (!ap?.committee) return;
    this.closeAdminProfile();
    this.openRequestModal(ap.committee);
  }

  getStars(n: number) { return Array(5).fill(0).map((_, i) => i < Math.round(n)); }
  getReputationLevel(score: number) {
    if (score >= 4.5) return { label: 'Excellent', color: '#22c55e' };
    if (score >= 3.5) return { label: 'Trusted',   color: '#60A5FA' };
    if (score >= 2.5) return { label: 'Average',   color: '#fbbf24' };
    if (score > 0)    return { label: 'Risky',     color: '#f87171' };
    return { label: 'New Admin', color: '#94a3b8' };
  }

  getInitials(n: string) {
    return n.split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2);
  }
  getColor(n: string) {
    return this.colors[(n?.charCodeAt(0) || 0) % this.colors.length];
  }
}
