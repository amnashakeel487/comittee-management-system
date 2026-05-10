import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-create-committee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-committee-page">
      <div class="page-header">
        <div class="page-title">
          <h1>Create New Committee</h1>
          <p>Set up a new ROSCA savings committee</p>
        </div>
      </div>

      <div class="create-layout">
        <!-- Form -->
        <div class="card form-card">
          <div class="card-header">
            <h3>
              <span class="material-icons" style="color:var(--primary);vertical-align:middle;margin-right:8px">add_circle</span>
              Committee Details
            </h3>
          </div>
          <div class="card-body">
            <form (ngSubmit)="onSubmit()" #form="ngForm">
              <div class="form-grid">
                <!-- Committee Name -->
                <div class="form-group full-width">
                  <label>Committee Name *</label>
                  <input type="text" class="form-control" placeholder="e.g. Family Savings Circle"
                         [(ngModel)]="formData.name" name="name" required
                         [class.error]="submitted() && !formData.name">
                  <span class="form-error" *ngIf="submitted() && !formData.name">
                    <span class="material-icons" style="font-size:14px">error</span>
                    Committee name is required
                  </span>
                </div>

                <!-- Monthly Amount -->
                <div class="form-group">
                  <label>Monthly Contribution (PKR) *</label>
                  <div class="input-with-prefix">
                    <span class="input-prefix">PKR</span>
                    <input type="number" class="form-control" placeholder="5000"
                           [(ngModel)]="formData.monthly_amount" name="monthly_amount"
                           required min="100" (ngModelChange)="updateCalculation()"
                           [class.error]="submitted() && !formData.monthly_amount">
                  </div>
                  <span class="form-error" *ngIf="submitted() && !formData.monthly_amount">
                    <span class="material-icons" style="font-size:14px">error</span>
                    Monthly amount is required
                  </span>
                </div>

                <!-- Number of Members -->
                <div class="form-group">
                  <label>Number of Members *</label>
                  <input type="number" class="form-control" placeholder="10"
                         [(ngModel)]="formData.total_members" name="total_members"
                         required min="2" max="50" (ngModelChange)="updateCalculation()"
                         [class.error]="submitted() && !formData.total_members">
                  <span class="form-hint">Minimum 2, Maximum 50 members</span>
                  <span class="form-error" *ngIf="submitted() && !formData.total_members">
                    <span class="material-icons" style="font-size:14px">error</span>
                    Number of members is required
                  </span>
                </div>

                <!-- Start Date -->
                <div class="form-group">
                  <label>Start Date *</label>
                  <input type="date" class="form-control"
                         [(ngModel)]="formData.start_date" name="start_date" required
                         [class.error]="submitted() && !formData.start_date">
                  <span class="form-error" *ngIf="submitted() && !formData.start_date">
                    <span class="material-icons" style="font-size:14px">error</span>
                    Start date is required
                  </span>
                </div>

                <!-- Duration -->
                <div class="form-group">
                  <label>Duration (Months) *</label>
                  <select class="form-control" [(ngModel)]="formData.duration_months"
                          name="duration_months" required (ngModelChange)="updateCalculation()">
                    <option value="">Select duration</option>
                    <option *ngFor="let d of durations" [value]="d">{{ d }} months</option>
                  </select>
                  <span class="form-error" *ngIf="submitted() && !formData.duration_months">
                    <span class="material-icons" style="font-size:14px">error</span>
                    Duration is required
                  </span>
                </div>

                <!-- Description -->
                <div class="form-group full-width">
                  <label>Description (Optional)</label>
                  <textarea class="form-control" placeholder="Brief description of this committee..."
                            [(ngModel)]="formData.description" name="description" rows="3">
                  </textarea>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="resetForm()">
                  <span class="material-icons">refresh</span> Reset
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  <span class="material-icons">{{ saving() ? 'hourglass_empty' : 'add_circle' }}</span>
                  {{ saving() ? 'Creating...' : 'Create Committee' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Live Calculation Panel -->
        <div class="side-panel">
          <!-- Calculation Card -->
          <div class="card calculation-card">
            <div class="card-header">
              <h3>
                <span class="material-icons" style="color:var(--success);vertical-align:middle;margin-right:8px">calculate</span>
                Live Calculation
              </h3>
            </div>
            <div class="card-body">
              <div class="calc-item">
                <span class="calc-label">Monthly Contribution</span>
                <span class="calc-value">PKR {{ (formData.monthly_amount || 0) | number }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">× Number of Members</span>
                <span class="calc-value">{{ formData.total_members || 0 }}</span>
              </div>
              <div class="calc-divider"></div>
              <div class="calc-item highlight">
                <span class="calc-label">Monthly Pool</span>
                <span class="calc-value primary">PKR {{ monthlyPool() | number }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Duration</span>
                <span class="calc-value">{{ formData.duration_months || 0 }} months</span>
              </div>
              <div class="calc-divider"></div>
              <div class="calc-item highlight">
                <span class="calc-label">Total Committee Value</span>
                <span class="calc-value success">PKR {{ totalValue() | number }}</span>
              </div>
            </div>
          </div>

          <!-- Info Card -->
          <div class="card info-card">
            <div class="card-body">
              <h4 class="info-title">
                <span class="material-icons" style="color:var(--primary)">info</span>
                How it works
              </h4>
              <ul class="info-list">
                <li>Each member contributes the monthly amount</li>
                <li>Total pool is distributed to one member per month</li>
                <li>Payout order is assigned to members</li>
                <li>Committee completes when all members receive payout</li>
              </ul>
            </div>
          </div>

          <!-- Preview Card -->
          <div class="card preview-card" *ngIf="formData.name">
            <div class="card-header">
              <h3>Preview</h3>
            </div>
            <div class="card-body">
              <div class="preview-header">
                <div class="preview-icon">
                  <span class="material-icons">groups</span>
                </div>
                <div>
                  <h4>{{ formData.name }}</h4>
                  <span class="badge badge-warning">Pending</span>
                </div>
              </div>
              <div class="preview-stats">
                <div class="p-stat">
                  <span class="p-stat-label">Monthly</span>
                  <span class="p-stat-value">PKR {{ (formData.monthly_amount || 0) | number }}</span>
                </div>
                <div class="p-stat">
                  <span class="p-stat-label">Members</span>
                  <span class="p-stat-value">{{ formData.total_members || 0 }}</span>
                </div>
                <div class="p-stat">
                  <span class="p-stat-label">Duration</span>
                  <span class="p-stat-value">{{ formData.duration_months || 0 }}mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-committee-page { animation: fadeIn 0.3s ease; }

    .create-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .full-width { grid-column: 1 / -1; }

    .input-with-prefix {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--gray-300);
      border-radius: var(--border-radius-sm);
      overflow: hidden;
      transition: all 0.2s;

      &:focus-within {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
      }
    }

    .input-prefix {
      padding: 10px 12px;
      background: var(--gray-100);
      color: var(--gray-600);
      font-size: 13px;
      font-weight: 600;
      border-right: 1px solid var(--gray-300);
      white-space: nowrap;
    }

    .input-with-prefix .form-control {
      border: none;
      border-radius: 0;
      &:focus { box-shadow: none; }
    }

    .form-control.error { border-color: var(--danger); }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
      padding-top: 20px;
      border-top: 1px solid var(--gray-200);
    }

    .side-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .calculation-card .card-body {
      padding: 20px;
    }

    .calc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;

      &.highlight {
        background: var(--gray-50);
        padding: 12px;
        border-radius: 8px;
        margin: 4px 0;
      }
    }

    .calc-label { font-size: 13px; color: var(--gray-600); }
    .calc-value { font-size: 14px; font-weight: 600; color: var(--gray-800); }
    .calc-value.primary { color: var(--primary); font-size: 16px; }
    .calc-value.success { color: var(--success); font-size: 16px; }
    .calc-divider { height: 1px; background: var(--gray-200); margin: 4px 0; }

    .info-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .info-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;

      li {
        font-size: 13px;
        color: var(--gray-600);
        padding-left: 16px;
        position: relative;

        &::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--primary);
          font-weight: 700;
        }
      }
    }

    .preview-header {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
    }

    .preview-icon {
      width: 40px;
      height: 40px;
      background: var(--primary-100);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      .material-icons { color: var(--primary); }
    }

    .preview-stats {
      display: flex;
      gap: 12px;
    }

    .p-stat {
      flex: 1;
      text-align: center;
      background: var(--gray-50);
      padding: 10px 8px;
      border-radius: 8px;
    }

    .p-stat-label { display: block; font-size: 11px; color: var(--gray-500); margin-bottom: 4px; }
    .p-stat-value { display: block; font-size: 13px; font-weight: 700; color: var(--gray-800); }

    @media (max-width: 1024px) {
      .create-layout { grid-template-columns: 1fr; }
      .side-panel { display: grid; grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .side-panel { grid-template-columns: 1fr; }
    }
  `]
})
export class CreateCommitteeComponent {
  saving = signal(false);
  submitted = signal(false);

  formData = {
    name: '',
    monthly_amount: null as number | null,
    total_members: null as number | null,
    start_date: '',
    duration_months: '' as any,
    description: ''
  };

  durations = [3, 6, 8, 10, 12, 15, 18, 24];

  constructor(
    private dataService: DataService,
    private toast: ToastService,
    private router: Router
  ) {}

  monthlyPool(): number {
    return (this.formData.monthly_amount || 0) * (this.formData.total_members || 0);
  }

  totalValue(): number {
    return this.monthlyPool() * (this.formData.duration_months || 0);
  }

  updateCalculation() {}

  async onSubmit() {
    this.submitted.set(true);
    if (!this.formData.name || !this.formData.monthly_amount ||
        !this.formData.total_members || !this.formData.start_date ||
        !this.formData.duration_months) {
      this.toast.error('Please fill all required fields');
      return;
    }

    this.saving.set(true);
    try {
      await this.dataService.createCommittee({
        name: this.formData.name,
        monthly_amount: this.formData.monthly_amount!,
        total_members: this.formData.total_members!,
        start_date: this.formData.start_date,
        duration_months: Number(this.formData.duration_months),
        description: this.formData.description
      });
      this.toast.success('Committee created successfully!');
      this.router.navigate(['/committees']);
    } catch (e: any) {
      console.error('Create committee error:', e);
      this.toast.error('Error: ' + (e?.message || 'Failed to create committee'));
    } finally {
      this.saving.set(false);
    }
  }

  resetForm() {
    this.formData = {
      name: '', monthly_amount: null, total_members: null,
      start_date: '', duration_months: '', description: ''
    };
    this.submitted.set(false);
  }
}
