import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Committee } from '../../models';

@Component({
  selector: 'app-committees',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="committees-page">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>My Committees</h1>
          <p>Manage all your ROSCA committees</p>
        </div>
        <a routerLink="/committees/create" class="btn btn-primary">
          <span class="material-icons">add</span> Create Committee
        </a>
      </div>

      <!-- Filters -->
      <div class="filters-bar card">
        <div class="card-body" style="padding:16px 20px">
          <div class="filters-row">
            <div class="search-filter">
              <span class="material-icons">search</span>
              <input type="text" placeholder="Search committees..."
                     (input)="onSearch($event)" class="filter-input">
            </div>
            <div class="status-filters">
              <button class="filter-btn" [class.active]="activeFilter() === 'all'"
                      (click)="setFilter('all')">All ({{ committees().length }})</button>
              <button class="filter-btn" [class.active]="activeFilter() === 'active'"
                      (click)="setFilter('active')">Active</button>
              <button class="filter-btn" [class.active]="activeFilter() === 'pending'"
                      (click)="setFilter('pending')">Pending</button>
              <button class="filter-btn" [class.active]="activeFilter() === 'completed'"
                      (click)="setFilter('completed')">Completed</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
      </div>

      <!-- Committees Grid -->
      <div class="grid grid-3 committees-grid" *ngIf="!loading()">
        <div *ngFor="let committee of filteredCommittees()" class="committee-card card">
          <div class="committee-card-header">
            <div class="committee-icon">
              <span class="material-icons">groups</span>
            </div>
            <span class="badge" [ngClass]="{
              'badge-success': committee.status === 'active',
              'badge-warning': committee.status === 'pending',
              'badge-gray': committee.status === 'completed'
            }">
              <span class="material-icons" style="font-size:11px">
                {{ committee.status === 'active' ? 'play_circle' : committee.status === 'pending' ? 'schedule' : 'check_circle' }}
              </span>
              {{ committee.status | titlecase }}
            </span>
          </div>

          <div class="committee-card-body">
            <h3 class="committee-name">{{ committee.name }}</h3>
            <p class="committee-desc" *ngIf="committee.description">{{ committee.description }}</p>

            <div class="committee-stats">
              <div class="c-stat">
                <span class="material-icons c-stat-icon">payments</span>
                <div>
                  <span class="c-stat-value">PKR {{ committee.monthly_amount | number }}</span>
                  <span class="c-stat-label">Monthly</span>
                </div>
              </div>
              <div class="c-stat">
                <span class="material-icons c-stat-icon">people</span>
                <div>
                  <span class="c-stat-value">{{ committee.total_members }}</span>
                  <span class="c-stat-label">Members</span>
                </div>
              </div>
              <div class="c-stat">
                <span class="material-icons c-stat-icon">calendar_month</span>
                <div>
                  <span class="c-stat-value">{{ committee.duration_months }}mo</span>
                  <span class="c-stat-label">Duration</span>
                </div>
              </div>
            </div>

            <!-- Progress -->
            <div class="committee-progress" *ngIf="committee.status !== 'pending'">
              <div class="progress-header-row">
                <span class="text-sm text-muted">Progress</span>
                <span class="text-sm font-semibold text-primary">
                  {{ getProgress(committee) }}%
                </span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getProgress(committee)"></div>
              </div>
              <div class="progress-months">
                Month {{ committee.current_month || 0 }} of {{ committee.duration_months }}
              </div>
            </div>

            <!-- Pool Amount -->
            <div class="pool-amount">
              <span class="material-icons" style="font-size:16px;color:var(--success)">account_balance_wallet</span>
              <span>Total Pool: <strong>PKR {{ (committee.monthly_amount * committee.total_members) | number }}</strong></span>
            </div>
          </div>

          <div class="committee-card-footer">
            <button class="btn btn-outline btn-sm" (click)="viewDetails(committee)">
              <span class="material-icons">visibility</span> View
            </button>
            <!-- Activate button — only for pending committees -->
            <button *ngIf="committee.status === 'pending'"
                    class="btn btn-success btn-sm"
                    (click)="activateCommittee(committee)"
                    [disabled]="activatingId() === committee.id">
              <span class="material-icons">play_circle</span>
              {{ activatingId() === committee.id ? 'Activating...' : 'Activate' }}
            </button>
            <!-- Complete button — only for active committees -->
            <button *ngIf="committee.status === 'active'"
                    class="btn btn-ghost btn-sm complete-btn"
                    (click)="completeCommittee(committee)"
                    [disabled]="activatingId() === committee.id">
              <span class="material-icons">check_circle</span>
              Complete
            </button>
            <button class="btn btn-ghost btn-sm" (click)="editCommittee(committee)">
              <span class="material-icons">edit</span>
            </button>
            <button class="btn btn-ghost btn-sm danger-btn" (click)="deleteCommittee(committee)">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredCommittees().length === 0" class="empty-state-card">
          <div class="empty-state">
            <span class="material-icons empty-icon">groups</span>
            <h3>No committees found</h3>
            <p>Create your first committee to get started</p>
            <a routerLink="/committees/create" class="btn btn-primary mt-4">
              <span class="material-icons">add</span> Create Committee
            </a>
          </div>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <div class="modal-overlay" *ngIf="showDeleteModal()" (click)="showDeleteModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Delete Committee</h3>
            <button class="btn btn-ghost btn-icon" (click)="showDeleteModal.set(false)">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="delete-warning">
              <span class="material-icons warning-icon">warning</span>
              <p>Are you sure you want to delete <strong>{{ selectedCommittee()?.name }}</strong>?
              This action cannot be undone.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDeleteModal.set(false)">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting()">
              <span class="material-icons">delete</span>
              {{ deleting() ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .committees-page { animation: fadeIn 0.3s ease; }

    .filters-bar { margin-bottom: 24px; }

    .filters-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-filter {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--gray-100);
      border-radius: 8px;
      padding: 8px 14px;
      flex: 1;
      min-width: 200px;
      .material-icons { color: var(--gray-400); font-size: 18px; }
    }

    .filter-input {
      border: none;
      background: none;
      outline: none;
      font-size: 14px;
      color: var(--gray-700);
      width: 100%;
    }

    .status-filters {
      display: flex;
      gap: 6px;
    }

    .filter-btn {
      padding: 7px 14px;
      border-radius: 20px;
      border: 1.5px solid var(--gray-300);
      background: white;
      font-size: 13px;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      transition: all 0.15s;

      &:hover { border-color: var(--primary); color: var(--primary); }
      &.active { background: var(--primary); border-color: var(--primary); color: white; }
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 80px;
    }

    .committees-grid { }

    .committee-card {
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;

      &:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    }

    .committee-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 20px 0;
    }

    .committee-icon {
      width: 44px;
      height: 44px;
      background: var(--primary-100);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      .material-icons { color: var(--primary); font-size: 22px; }
    }

    .committee-card-body {
      padding: 16px 20px;
      flex: 1;
    }

    .committee-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 6px;
    }

    .committee-desc {
      font-size: 13px;
      color: var(--gray-500);
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .committee-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .c-stat {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .c-stat-icon {
      font-size: 18px;
      color: var(--primary);
    }

    .c-stat-value {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-800);
    }

    .c-stat-label {
      display: block;
      font-size: 11px;
      color: var(--gray-500);
    }

    .committee-progress {
      margin-bottom: 12px;
    }

    .progress-header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .progress-months {
      font-size: 11px;
      color: var(--gray-400);
      margin-top: 4px;
    }

    .pool-amount {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--gray-600);
      background: var(--gray-50);
      padding: 8px 12px;
      border-radius: 8px;
    }

    .committee-card-footer {
      display: flex;
      gap: 8px;
      padding: 12px 20px 16px;
      border-top: 1px solid var(--gray-100);
    }

    .danger-btn {
      color: var(--danger) !important;
      margin-left: auto;
      &:hover { background: #fee2e2 !important; }
    }

    .complete-btn {
      color: var(--success) !important;
      &:hover { background: var(--success-light) !important; }
    }

    .empty-state-card {
      grid-column: 1 / -1;
    }

    .delete-warning {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 16px;
      background: #fff7ed;
      border-radius: 8px;
      border: 1px solid #fed7aa;
    }

    .warning-icon {
      color: var(--warning);
      font-size: 28px;
      flex-shrink: 0;
    }
  `]
})
export class CommitteesComponent implements OnInit {
  loading = signal(true);
  committees = signal<Committee[]>([]);
  filteredCommittees = signal<Committee[]>([]);
  activeFilter = signal('all');
  searchQuery = signal('');
  showDeleteModal = signal(false);
  selectedCommittee = signal<Committee | null>(null);
  deleting = signal(false);
  activatingId = signal<string | null>(null);

  constructor(private dataService: DataService, private toast: ToastService, private router: Router, private auth: AuthService) {}

  async ngOnInit() {
    // Wait for session to be restored before fetching data
    await this.auth.waitForAuth();
    try {
      const data = await this.dataService.getCommittees();
      this.committees.set(data);
      this.applyFilters();
    } catch (e: any) {
      this.toast.error('Failed to load committees: ' + (e?.message || ''));
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.toLowerCase());
    this.applyFilters();
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
    this.applyFilters();
  }

  applyFilters() {
    let result = this.committees();
    if (this.activeFilter() !== 'all') {
      result = result.filter(c => c.status === this.activeFilter());
    }
    if (this.searchQuery()) {
      result = result.filter(c => c.name.toLowerCase().includes(this.searchQuery()));
    }
    this.filteredCommittees.set(result);
  }

  getProgress(committee: Committee): number {
    if (!committee.duration_months) return 0;
    return Math.round(((committee.current_month || 0) / committee.duration_months) * 100);
  }

  viewDetails(committee: Committee) {
    this.router.navigate(['/committees', committee.id]);
  }

  editCommittee(committee: Committee) {
    this.toast.info(`Edit ${committee.name} - Coming soon`);
  }

  deleteCommittee(committee: Committee) {
    this.selectedCommittee.set(committee);
    this.showDeleteModal.set(true);
  }

  async confirmDelete() {
    if (!this.selectedCommittee()) return;
    this.deleting.set(true);
    try {
      await this.dataService.deleteCommittee(this.selectedCommittee()!.id);
      // Only remove from local state after confirmed DB deletion
      this.committees.update(list => list.filter(c => c.id !== this.selectedCommittee()!.id));
      this.applyFilters();
      this.toast.success('Committee deleted successfully');
      this.showDeleteModal.set(false);
    } catch (e: any) {
      this.toast.error('Failed to delete: ' + (e?.message || 'Unknown error'));
    } finally {
      this.deleting.set(false);
    }
  }

  async activateCommittee(committee: Committee) {
    this.activatingId.set(committee.id);
    try {
      const updated = await this.dataService.updateCommittee(committee.id, { status: 'active' });
      this.committees.update(list => list.map(c => c.id === committee.id ? { ...c, status: 'active' } : c));
      this.applyFilters();
      this.toast.success(`"${committee.name}" is now Active!`);
    } catch (e: any) {
      this.toast.error('Failed to activate: ' + (e?.message || ''));
    } finally {
      this.activatingId.set(null);
    }
  }

  async completeCommittee(committee: Committee) {
    if (!confirm(`Mark "${committee.name}" as Completed? This cannot be undone.`)) return;
    this.activatingId.set(committee.id);
    try {
      await this.dataService.updateCommittee(committee.id, { status: 'completed' });
      this.committees.update(list => list.map(c => c.id === committee.id ? { ...c, status: 'completed' } : c));
      this.applyFilters();
      this.toast.success(`"${committee.name}" marked as Completed`);
    } catch (e: any) {
      this.toast.error('Failed to complete: ' + (e?.message || ''));
    } finally {
      this.activatingId.set(null);
    }
  }
}
