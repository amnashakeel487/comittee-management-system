import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://vxvgagkwgsjetvyvxdxg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dmdhZ2t3Z3NqZXR2eXZ4ZHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTI1NTUsImV4cCI6MjA5Mzk2ODU1NX0.knri6Kwk9p09rJ1zLwhOokbcCj-ByKdIlt774hKyJn8'
);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  loading = signal(true);
  scrolled = false;
  committees = signal<any[]>([]);
  filteredCommittees = signal<any[]>([]);
  stats = signal({ committees: 0, members: 0, managed: 0 });
  heroCommittee = signal<any>(null);

  // Modals
  showDetailModal = signal(false);
  showJoinModal = signal(false);
  selectedCommittee = signal<any>(null);
  joiningCommittee = signal<any>(null);
  joinSubmitting = signal(false);
  joinSuccess = signal(false);

  // Filter
  activeFilter = signal('All');
  searchQuery = '';
  filters = ['All', 'Open', 'Filling Fast', 'Savings', 'Family', 'Business'];

  // Toast
  toastVisible = signal(false);
  toastMsg = signal('');
  private toastTimer: any;

  // FAQ
  activeFaq = signal(-1);

  // Floating dots
  dots: string[] = [];

  steps = [
    { num: 1, icon: 'ti-user-plus', title: 'Register / Login', desc: 'Create your account or log in. Admin creates your member profile and committee access.' },
    { num: 2, icon: 'ti-building-community', title: 'Join a Committee', desc: 'Browse public committees, submit a join request, and get approved by the focal person.' },
    { num: 3, icon: 'ti-credit-card', title: 'Pay Monthly', desc: 'Upload your payment screenshot each month. Admin verifies and marks your installment paid.' },
    { num: 4, icon: 'ti-trophy', title: 'Receive Your Turn', desc: 'When your number is drawn via the spin wheel, receive the full committee payout for that month.' }
  ];

  features = [
    { icon: 'ti-shield-lock', title: 'Secure Member Management', desc: 'CNIC-verified profiles, role-based access, and full audit history for every member.' },
    { icon: 'ti-receipt-2', title: 'Payment Tracking', desc: 'Upload payment screenshots and track monthly installment history with real-time status updates.' },
    { icon: 'ti-arrows-shuffle', title: 'Committee Turn Management', desc: 'Automated turn scheduling with manual override support. Everyone knows their number and date.' },
    { icon: 'ti-photo-up', title: 'Screenshot Upload', desc: 'Members upload bank receipts directly. Admins review and verify with one click.' },
    { icon: 'ti-bell-ringing', title: 'Real-Time Notifications', desc: 'Automated alerts for payment due dates, turn assignments, and approval decisions.' },
    { icon: 'ti-rotate-clockwise-2', title: 'Random Spin Wheel', desc: 'Fair, transparent turn selection using an animated spin wheel. No bias, full visibility.' },
    { icon: 'ti-layout-dashboard', title: 'Professional Dashboards', desc: 'Separate dashboards for members, focal persons, and admins — each with the right level of access.' },
    { icon: 'ti-chart-bar', title: 'Financial Reports', desc: 'Monthly reports, outstanding balances, and full committee fund summaries for complete oversight.' }
  ];

  testimonials = [
    { stars: '★★★★★', text: 'Finally a proper system for committees. The payment tracking and screenshot upload feature saved us from so many disputes. Highly recommended.', initials: 'AU', name: 'Ahmed Usman', role: 'Committee Member, Lahore' },
    { stars: '★★★★★', text: 'As a focal person managing 3 committees and 45 members, this system made my life incredibly easy. The spin wheel for turn selection is brilliant.', initials: 'SR', name: 'Sara Rehman', role: 'Focal Person, Islamabad' },
    { stars: '★★★★☆', text: "The dashboard gives me full visibility into who has paid and who hasn't. No more chasing people with phone calls every month.", initials: 'KA', name: 'Kamran Ali', role: 'Admin, Karachi' },
    { stars: '★★★★★', text: 'I was skeptical about online committees but the disclaimer and verification process gave me confidence. Got my turn payout on time, everything was smooth.', initials: 'NB', name: 'Nadia Baig', role: 'Member, Rawalpindi' },
    { stars: '★★★★★', text: 'Running a family committee for 20 members across different cities was a nightmare. CommitteeHub brought us all together on one platform.', initials: 'MH', name: 'Muhammad Hussain', role: 'Family Committee Admin' },
    { stars: '★★★★★', text: "The notifications are great — I never miss a payment date now. The whole experience is professional and trustworthy.", initials: 'ZF', name: 'Zara Farooq', role: 'Committee Member, Faisalabad' }
  ];

  faqs = [
    { q: 'How do committees work on this platform?', a: 'A committee is a group savings arrangement where all members contribute a fixed monthly amount. Each month, one member receives the total collected amount (their "turn"). CommitteeHub manages the tracking, payment verification, and turn scheduling for every committee.' },
    { q: 'How are payments verified?', a: 'Members upload a bank transfer screenshot or payment proof through the platform. The assigned admin or focal person reviews the screenshot and manually marks the payment as verified. This creates a full audit trail for every transaction.' },
    { q: 'How is turn selection decided?', a: 'Turns can be pre-assigned when a member joins, or determined through our animated spin wheel feature for maximum fairness and transparency. All members can see the spin wheel result in real time, ensuring no bias in selection.' },
    { q: 'Is my payment information secure?', a: 'CommitteeHub uses CNIC-verified registration and secure data storage. However, all financial transactions happen directly between members and admins outside the platform. The platform records and tracks these transactions but does not process payments itself.' },
    { q: "What if a member doesn't pay on time?", a: 'The system sends automated payment reminders before the due date. If a member misses payment, their status is flagged and the admin/focal person is notified. The committee rules (penalties, grace periods) are defined by the admin when creating the committee.' },
    { q: 'How do I request to join a committee?', a: 'Click "Request to Join" on any open committee card. Fill in your full name, CNIC, phone, email, and address. Your request is sent to the committee admin/focal person who will review and either approve or reject your application.' },
    { q: 'Can I be in multiple committees at once?', a: 'Yes, subject to each admin\'s approval. You can request to join multiple committees. Each committee maintains its own independent payment and turn schedule.' }
  ];

  joinForm = { name: '', phone: '', email: '', cnic: '', address: '', message: '' };

  @HostListener('window:scroll')
  onScroll() { this.scrolled = window.scrollY > 60; }

  async ngOnInit() {
    // Generate floating dots
    this.dots = Array.from({ length: 12 }, () => {
      const size = Math.random() * 4 + 2;
      return `width:${size}px;height:${size}px;background:rgba(45,140,255,${(Math.random() * 0.3 + 0.05).toFixed(2)});left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${(Math.random() * 4).toFixed(1)}s;animation-duration:${(5 + Math.random() * 5).toFixed(1)}s;`;
    });
    await this.loadData();
  }

  ngOnDestroy() { if (this.toastTimer) clearTimeout(this.toastTimer); }

  private async loadData() {
    try {
      const [cRes, mRes, aRes] = await Promise.all([
        sb.from('committees').select('*, profiles(name, email, phone, verified)').in('status', ['active', 'pending']).order('created_at', { ascending: false }),
        sb.from('members').select('id', { count: 'exact', head: true }),
        sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
      ]);
      const cs = cRes.data || [];
      this.committees.set(cs);
      this.filteredCommittees.set(cs);
      if (cs.length > 0) this.heroCommittee.set(cs[0]);
      const totalManaged = cs.reduce((s: number, c: any) => s + (c.monthly_amount * c.total_members), 0);
      this.stats.set({ committees: cs.length, members: mRes.count || 0, managed: totalManaged });
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase();
    const f = this.activeFilter();
    let result = this.committees();
    if (f === 'Open') result = result.filter((c: any) => c.status === 'active');
    else if (f === 'Filling Fast') result = result.filter((c: any) => c.status === 'pending');
    else if (f !== 'All') result = result.filter((c: any) =>
      c.name?.toLowerCase().includes(f.toLowerCase()) ||
      c.description?.toLowerCase().includes(f.toLowerCase())
    );
    if (q) result = result.filter((c: any) =>
      c.name?.toLowerCase().includes(q) ||
      c.profiles?.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
    this.filteredCommittees.set(result);
  }

  setFilter(f: string) { this.activeFilter.set(f); this.applyFilter(); }

  openDetailModal(c: any) { this.selectedCommittee.set(c); this.showDetailModal.set(true); }
  closeDetailModal() { this.showDetailModal.set(false); }

  openJoinModal(c: any) {
    this.joiningCommittee.set(c);
    this.joinForm = { name: '', phone: '', email: '', cnic: '', address: '', message: '' };
    this.joinSuccess.set(false);
    this.showJoinModal.set(true);
  }
  closeJoinModal() { this.showJoinModal.set(false); }

  async submitJoin() {
    if (!this.joinForm.name || !this.joinForm.phone || !this.joinForm.cnic) return;
    this.joinSubmitting.set(true);
    await new Promise(r => setTimeout(r, 900));
    this.joinSubmitting.set(false);
    this.joinSuccess.set(true);
    this.showToast('Join request submitted! The admin will review and respond within 24–48 hours.');
    setTimeout(() => this.closeJoinModal(), 2500);
  }

  showToast(msg: string) {
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 4000);
  }

  toggleFaq(i: number) { this.activeFaq.set(this.activeFaq() === i ? -1 : i); }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatPKR(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M+';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K+';
    return n.toString();
  }
}
