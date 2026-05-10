import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts()"
           class="toast toast-{{ toast.type }}"
           (click)="toastService.remove(toast.id)">
        <span class="material-icons toast-icon">{{ getIcon(toast.type) }}</span>
        <span class="toast-msg">{{ toast.message }}</span>
        <button class="toast-close" (click)="toastService.remove(toast.id)">
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      min-width: 300px;
      max-width: 420px;
      animation: slideInRight 0.3s ease;
      font-size: 14px;
      font-weight: 500;
      pointer-events: all;
      cursor: pointer;

      &.toast-success { background: #065f46; color: white; }
      &.toast-error { background: #991b1b; color: white; }
      &.toast-warning { background: #92400e; color: white; }
      &.toast-info { background: #1e40af; color: white; }
    }

    .toast-icon { font-size: 20px; flex-shrink: 0; }
    .toast-msg { flex: 1; }
    .toast-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      padding: 0;
      display: flex;
      .material-icons { font-size: 18px; }
      &:hover { color: white; }
    }

    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return icons[type] || 'info';
  }
}
