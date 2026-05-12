import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-sa-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <div class="sa-page-header">
    <h2>Announcements</h2>
    <p>Send global announcements to all users on the platform</p>
  </div>

  <!-- Compose -->
  <div class="sa-compose-card">
    <h3>Send New Announcement</h3>
    <div class="sa-form-group">
      <label>Title *</label>
      <input type="text" [(ngModel)]="form.title" placeholder="Announcement title..." class="sa-input">
    </div>
    <div class="sa-form-group">
      <label>Message *</label>
      <textarea [(ngModel)]="form.message" rows="4" placeholder="Write your announcement..." class="sa-input"></textarea>
    </div>
    <div class="sa-form-row">
      <div class="sa-form-group">
        <label>Type</label>
        <select [(ngModel)]="form.type" class="sa-input">
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="success">Success</option>
          <option value="error">Alert</option>
        </select>
      </div>
      <button class="sa-send-btn" (click)="send()" [disabled]="sending()">
        <span class="material-icons">campaign</span>
        {{ sending() ? 'Sending...' : 'Send to All Users' }}
      </button>
    </div>
  </div>

  <!-- History -->
  <div class="sa-history">
    <h3>Recent Announcements</h3>
    <div *ngIf="loading()" class="sa-loading"><div class="sa-spinner"></div></div>
    <div *ngIf="!loading() && announcements().length===0" class="sa-empty">No announcements sent yet</div>
    <div *ngFor="let a of announcements()" class="sa-ann-item" [class]="'type-' + a.type">
      <div class="sa-ann-icon">
        <span class="material-icons">{{ a.type === 'warning' ? 'warning' : a.type === 'error' ? 'error' : a.type === 'success' ? 'check_circle' : 'info' }}</span>
      </div>
      <div class="sa-ann-body">
        <div class="sa-ann-title">{{ a.title }}</div>
        <div class="sa-ann-msg">{{ a.message }}</div>
        <div class="sa-ann-meta">{{ a.created_at | date:'MMM d, y h:mm a' }}</div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .sa-page { color: white; }
    .sa-page-header { margin-bottom: 24px; h2 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 4px; } p { font-size: 14px; color: rgba(255,255,255,0.45); } }
    .sa-compose-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 24px; margin-bottom: 28px; h3 { font-size: 16px; font-weight: 700; color: white; margin-bottom: 18px; } }
    .sa-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); } }
    .sa-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; color: white; font-family: inherit; font-size: 14px; outline: none; resize: vertical; &:focus { border-color: rgba(37,99,235,0.5); } &::placeholder { color: rgba(255,255,255,0.2); } }
    .sa-form-row { display: flex; gap: 14px; align-items: flex-end; }
    .sa-form-row .sa-form-group { flex: 1; margin-bottom: 0; }
    .sa-send-btn { display: flex; align-items: center; gap: 8px; padding: 11px 22px; background: linear-gradient(135deg, #1E3A5F, #2563EB); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; white-space: nowrap; .material-icons { font-size: 18px; } &:disabled { opacity: 0.6; cursor: not-allowed; } &:hover:not(:disabled) { opacity: 0.9; } }
    .sa-history { h3 { font-size: 16px; font-weight: 700; color: white; margin-bottom: 14px; } }
    .sa-loading { display: flex; justify-content: center; padding: 40px; }
    .sa-spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sa-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); font-size: 14px; }
    .sa-ann-item { display: flex; gap: 14px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; margin-bottom: 10px; &.type-warning { border-left: 3px solid #f59e0b; } &.type-error { border-left: 3px solid #ef4444; } &.type-success { border-left: 3px solid #10b981; } &.type-info { border-left: 3px solid #2563EB; } }
    .sa-ann-icon { .material-icons { font-size: 22px; color: rgba(255,255,255,0.4); } }
    .sa-ann-body { flex: 1; }
    .sa-ann-title { font-size: 14px; font-weight: 700; color: white; margin-bottom: 4px; }
    .sa-ann-msg { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; margin-bottom: 6px; }
    .sa-ann-meta { font-size: 11px; color: rgba(255,255,255,0.3); }
  `]
})
export class SaAnnouncementsComponent implements OnInit {
  loading = signal(true);
  sending = signal(false);
  announcements = signal<any[]>([]);
  form = { title: '', message: '', type: 'info' };

  constructor(private supabase: SupabaseService, private auth: AuthService, private toast: ToastService) {}

  async ngOnInit() {
    // Load recent announcements (notifications sent by super admin to all)
    const { data } = await this.supabase.client.from('notifications')
      .select('*').eq('user_id', this.auth.currentUser()?.id || '')
      .order('created_at', { ascending: false }).limit(20);
    // For now show all notifications as announcements history
    const { data: allAnn } = await this.supabase.client.from('notifications')
      .select('*').order('created_at', { ascending: false }).limit(50);
    this.announcements.set(allAnn || []);
    this.loading.set(false);
  }

  async send() {
    if (!this.form.title.trim() || !this.form.message.trim()) {
      this.toast.error('Please fill title and message'); return;
    }
    this.sending.set(true);
    try {
      // Get all user IDs
      const { data: users } = await this.supabase.client.from('profiles').select('id');
      if (!users?.length) { this.toast.error('No users found'); return; }

      // Insert notification for each user
      const notifications = users.map((u: any) => ({
        user_id: u.id,
        title: this.form.title,
        message: this.form.message,
        type: this.form.type,
        read: false
      }));

      const { error } = await this.supabase.client.from('notifications').insert(notifications);
      if (error) throw new Error(error.message);

      this.announcements.update(l => [{ title: this.form.title, message: this.form.message, type: this.form.type, created_at: new Date().toISOString() }, ...l]);
      this.form = { title: '', message: '', type: 'info' };
      this.toast.success(`Announcement sent to ${users.length} users!`);
    } catch (e: any) {
      this.toast.error('Failed: ' + e?.message);
    } finally {
      this.sending.set(false);
    }
  }
}
