import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Committee, Member, CommitteeMember } from '../../models';

interface PayoutSlot {
  month: number;
  assigned: CommitteeMember | null;
  saving: boolean;
}

@Component({
  selector: 'app-committee-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './committee-detail.component.html',
  styleUrls: ['./committee-detail.component.scss']
})
export class CommitteeDetailComponent implements OnInit {
  @ViewChild('wheelCanvas') wheelCanvas!: ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  activating = signal(false);
  committee = signal<Committee | null>(null);
  committeeMembers = signal<CommitteeMember[]>([]);
  allMembers = signal<Member[]>([]);

  // Payout schedule slots (one per month)
  payoutSlots = signal<PayoutSlot[]>([]);

  // Add member to committee modal
  showAddMemberModal = signal(false);
  addingMember = signal(false);
  selectedMemberIdToAdd = '';

  // Remove member from committee
  removingMemberId = signal<string | null>(null);

  // Spin wheel
  showSpinModal = signal(false);
  spinningForMonth = signal(0);
  isSpinning = signal(false);
  spinResult = signal<Member | null>(null);
  spinAngle = 0;
  private animFrame = 0;
  private targetIdx = 0;

  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2','#65a30d','#9333ea','#0284c7'];
  private avatarColors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private toast: ToastService,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    try {
      const [committee, members, allMembers] = await Promise.all([
        this.dataService.getCommitteeById(id),
        this.dataService.getCommitteeMembers(id).catch(() => []),
        this.dataService.getMembers().catch(() => [])
      ]);
      this.committee.set(committee);
      this.committeeMembers.set(members);
      this.allMembers.set(allMembers);
      this.buildPayoutSlots(committee, members);
    } catch (e: any) {
      this.toast.error('Failed to load: ' + (e?.message || ''));
    } finally {
      this.loading.set(false);
    }
  }

  // Build month slots from 1 to duration_months
  buildPayoutSlots(committee: Committee | null, members: CommitteeMember[]) {
    if (!committee) return;
    const slots: PayoutSlot[] = [];
    for (let m = 1; m <= committee.duration_months; m++) {
      // Only rows with payout_order > 0 count as assigned to a month slot
      const assigned = members.find(cm => cm.payout_order === m) || null;
      slots.push({ month: m, assigned, saving: false });
    }
    this.payoutSlots.set(slots);
  }

  /** All members enrolled in this committee */
  enrolledMembers(): Member[] {
    return this.committeeMembers()
      .map(cm => cm.member)
      .filter((m): m is Member => !!m);
  }

  /** Enrolled members not yet assigned to any payout slot */
  unassignedMembers(): Member[] {
    const assignedIds = new Set(
      this.committeeMembers()
        .filter(cm => cm.payout_order > 0)
        .map(cm => cm.member_id)
    );
    return this.enrolledMembers().filter(m => !assignedIds.has(m.id));
  }

  /** All system members not yet enrolled in this committee */
  availableMembersToAdd(): Member[] {
    const enrolledIds = new Set(this.committeeMembers().map(cm => cm.member_id));
    return this.allMembers().filter(m => !enrolledIds.has(m.id));
  }

  getProgress(): number {
    const c = this.committee();
    if (!c?.duration_months) return 0;
    return Math.round(((c.current_month || 0) / c.duration_months) * 100);
  }

  // ── Add member to committee ───────────────────────────────────
  openAddMemberModal() {
    this.selectedMemberIdToAdd = '';
    this.showAddMemberModal.set(true);
  }

  closeAddMemberModal() {
    this.showAddMemberModal.set(false);
    this.selectedMemberIdToAdd = '';
  }

  async addMemberToCommittee() {
    if (!this.selectedMemberIdToAdd || !this.committee()?.id) return;
    this.addingMember.set(true);
    try {
      const cm = await this.dataService.enrollMemberInCommittee(
        this.selectedMemberIdToAdd, this.committee()!.id
      );
      this.committeeMembers.update(l => [...l, cm]);
      const member = this.allMembers().find(m => m.id === this.selectedMemberIdToAdd);
      this.toast.success(`${member?.name} added to committee`);
      this.closeAddMemberModal();
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.addingMember.set(false);
    }
  }

  async removeEnrolledMember(cm: CommitteeMember) {
    if (!this.committee()?.id) return;
    const name = cm.member?.name || 'Member';
    if (!confirm(`Remove ${name} from this committee? This will also remove any payout slot assignment.`)) return;
    this.removingMemberId.set(cm.member_id);
    try {
      await this.dataService.removeMemberFromCommittee(cm.member_id, this.committee()!.id);
      this.committeeMembers.update(l => l.filter(m => m.member_id !== cm.member_id));
      // Also clear payout slot if assigned
      this.payoutSlots.update(slots =>
        slots.map(s => s.assigned?.member_id === cm.member_id ? { ...s, assigned: null } : s)
      );
      this.toast.success(`${name} removed from committee`);
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.removingMemberId.set(null);
    }
  }

  // ── Manual assignment from dropdown ──────────────────────────
  async assignManually(slot: PayoutSlot, memberId: string) {
    if (!memberId || !this.committee()?.id) return;
    const cid = this.committee()!.id;

    // If slot already has someone, reset their payout_order to 0 (keep enrolled)
    if (slot.assigned) {
      await this.dataService.assignMemberToCommittee(slot.assigned.member_id, cid, 0, 'manual');
      this.committeeMembers.update(l => l.map(cm =>
        cm.member_id === slot.assigned!.member_id ? { ...cm, payout_order: 0 } : cm
      ));
    }

    slot.saving = true;
    try {
      const cm = await this.dataService.assignMemberToCommittee(memberId, cid, slot.month, 'manual');
      this.committeeMembers.update(l => l.map(existing =>
        existing.member_id === memberId ? cm : existing
      ));
      this.payoutSlots.update(slots =>
        slots.map(s => s.month === slot.month ? { ...s, assigned: cm, saving: false } : s)
      );
      const member = this.enrolledMembers().find(m => m.id === memberId);
      this.toast.success(`Month ${slot.month}: ${member?.name} assigned`);
    } catch (e: any) {
      slot.saving = false;
      this.toast.error('Failed: ' + (e?.message || ''));
    }
  }

  // ── Remove assignment from a slot (keep member enrolled) ─────
  async removeSlotAssignment(slot: PayoutSlot) {
    if (!slot.assigned || !this.committee()?.id) return;
    if (!confirm(`Remove ${slot.assigned.member?.name} from Month ${slot.month}?`)) return;
    try {
      // Reset payout_order to 0 — member stays enrolled but unassigned
      await this.dataService.assignMemberToCommittee(slot.assigned.member_id, this.committee()!.id, 0, 'manual');
      this.committeeMembers.update(l => l.map(cm =>
        cm.member_id === slot.assigned!.member_id ? { ...cm, payout_order: 0 } : cm
      ));
      this.payoutSlots.update(slots =>
        slots.map(s => s.month === slot.month ? { ...s, assigned: null } : s)
      );
      this.toast.success('Assignment removed');
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    }
  }

  // ── Spin Wheel for a specific month ──────────────────────────
  openSpinForMonth(month: number) {
    if (this.unassignedMembers().length === 0) {
      this.toast.warning('No unassigned enrolled members. Add members to the committee first.');
      return;
    }
    this.spinningForMonth.set(month);
    this.spinResult.set(null);
    this.spinAngle = 0;
    this.showSpinModal.set(true);
    setTimeout(() => this.drawWheel(), 80);
  }

  closeSpinModal() {
    cancelAnimationFrame(this.animFrame);
    this.showSpinModal.set(false);
    this.spinResult.set(null);
  }

  drawWheel() {
    const canvas = this.wheelCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const members = this.unassignedMembers();
    if (!members.length) return;

    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 8;
    const arc = (2 * Math.PI) / members.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    members.forEach((m, i) => {
      const start = this.spinAngle + i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = this.colors[i % this.colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;
      const label = m.name.length > 11 ? m.name.slice(0, 10) + '…' : m.name;
      ctx.fillText(label, r - 10, 5);
      ctx.restore();
    });

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', cx, cy + 4);
  }

  spin() {
    const members = this.unassignedMembers();
    if (!members.length || this.isSpinning()) return;
    this.isSpinning.set(true);
    this.spinResult.set(null);

    this.targetIdx = Math.floor(Math.random() * members.length);
    const arc = (2 * Math.PI) / members.length;
    const winnerCenter = this.targetIdx * arc + arc / 2;
    const targetAngle = -Math.PI / 2 - winnerCenter;
    const finalAngle = this.spinAngle + (targetAngle - this.spinAngle % (2 * Math.PI)) + 6 * 2 * Math.PI;

    const startAngle = this.spinAngle;
    const duration = 4000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.spinAngle = startAngle + (finalAngle - startAngle) * eased;
      this.drawWheel();
      if (progress < 1) {
        this.animFrame = requestAnimationFrame(animate);
      } else {
        this.spinAngle = finalAngle;
        this.drawWheel();
        this.isSpinning.set(false);
        this.spinResult.set(members[this.targetIdx]);
      }
    };
    this.animFrame = requestAnimationFrame(animate);
  }

  async confirmSpin() {
    const winner = this.spinResult();
    const month = this.spinningForMonth();
    const cid = this.committee()?.id;
    if (!winner || !cid) return;

    // Reset existing slot assignment for this month (keep enrolled)
    const existing = this.payoutSlots().find(s => s.month === month)?.assigned;
    if (existing) {
      await this.dataService.assignMemberToCommittee(existing.member_id, cid, 0, 'manual');
      this.committeeMembers.update(l => l.map(cm =>
        cm.member_id === existing.member_id ? { ...cm, payout_order: 0 } : cm
      ));
    }

    try {
      const cm = await this.dataService.assignMemberToCommittee(winner.id, cid, month, 'spin');
      this.committeeMembers.update(l => l.map(e =>
        e.member_id === winner.id ? cm : e
      ));
      this.payoutSlots.update(slots =>
        slots.map(s => s.month === month ? { ...s, assigned: cm } : s)
      );
      this.toast.success(`🎉 Month ${month}: ${winner.name} selected by Spin Wheel!`);
      this.closeSpinModal();
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    }
  }

  spinAgain() { this.spinResult.set(null); this.spinAngle = 0; this.drawWheel(); }

  // ── Activate / Complete ───────────────────────────────────────
  async activateCommittee() {
    const c = this.committee();
    if (!c) return;
    this.activating.set(true);
    try {
      await this.dataService.updateCommittee(c.id, { status: 'active' });
      this.committee.update(v => v ? { ...v, status: 'active' } : v);
      this.toast.success(`"${c.name}" is now Active!`);
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.activating.set(false);
    }
  }

  async markComplete() {
    const c = this.committee();
    if (!c || !confirm(`Mark "${c.name}" as Completed?`)) return;
    this.activating.set(true);
    try {
      await this.dataService.updateCommittee(c.id, { status: 'completed' });
      this.committee.update(v => v ? { ...v, status: 'completed' } : v);
      this.toast.success(`"${c.name}" marked as Completed`);
    } catch (e: any) {
      this.toast.error('Failed: ' + (e?.message || ''));
    } finally {
      this.activating.set(false);
    }
  }

  getInitials(name: string) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(name: string) {
    if (!name) return this.avatarColors[0];
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  getWheelColor(i: number) { return this.colors[i % this.colors.length]; }

  assignedCount() { return this.payoutSlots().filter(s => s.assigned).length; }
  totalSlots() { return this.payoutSlots().length; }
}
