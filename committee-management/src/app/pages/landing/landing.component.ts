import { Component, OnInit, signal } from '@angular/core';
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
export class LandingComponent implements OnInit {
  loading = signal(true);
  committees = signal<any[]>([]);
  filteredCommittees = signal<any[]>([]);
  stats = signal({ committees: 0, members: 0, managed: 0 });

  showDetailModal = signal(false);
  showJoinModal = signal(false);
  selectedCommittee = signal<any>(null);
  joiningCommittee = signal<any>(null);
  joinSubmitting = signal(false);
  joinSuccess = signal(false);

  activeFilter = signal('All');
  searchQuery = '';
  filters = ['All', 'Open', 'Pending'];

  activeFaq = signal(-1);
  theme = signal('dark');

  joinForm = { name: '', phone: '', email: '', cnic: '', address: '', message: '' };

  steps = [
    { num: 1, title: 'Register / Login', desc: 'Create your account. Admin sets up your member profile and access.' },
    { num: 2, title: 'Join a Committee', desc: 'Browse committees, submit a request, and get approved by the focal person.' },
    { num: 3, title: 'Pay Monthly', desc: 'Upload your payment screenshot. Admin verifies and marks it paid.' },
    { num: 4, title: 'Receive Your Turn', desc: 'When your number is drawn, you receive the full monthly payout.' }
  ];

  features = [
    { icon: 'ti ti-shield-lock', title: 'Secure Member Management', desc: 'CNIC-verified profiles with role-based access and full audit history.' },
    { icon: 'ti ti-receipt-2', title: 'Payment Tracking', desc: 'Upload receipts, track monthly installments, and view real-time status.' },
    { icon: 'ti ti-arrows-shuffle', title: 'Turn Management', desc: 'Automated scheduling with manual override. Everyone knows their date.' },
    { icon: 'ti ti-photo-up', title: 'Screenshot Upload', desc: 'Members upload bank receipts. Admins verify with one click.' },
    { icon: 'ti ti-bell-ringing', title: 'Smart Notifications', desc: 'Automated alerts for due dates, turns, and approvals.' },
    { icon: 'ti ti-rotate-clockwise-2', title: 'Spin Wheel Selection', desc: 'Fair, visible turn selection with an animated spin wheel.' },
    { icon: 'ti ti-layout-dashboard', title: 'Role-Based Dashboards', desc: 'Separate views for members, focal persons, and admins.' },
    { icon: 'ti ti-chart-bar', title: 'Financial Reports', desc: 'Monthly summaries, outstanding balances, and full fund history.' }
  ];

  testimonials = [
    { stars: '★★★★★', text: '"Payment tracking and screenshot uploads saved us from so many disputes."', initials: 'AU', name: 'Ahmed Usman', role: 'Member, Lahore' },
    { stars: '★★★★★', text: '"Managing 3 committees and 45 members is now easy. The spin wheel feature is great."', initials: 'SR', name: 'Sara Rehman', role: 'Focal Person, Islamabad' },
    { stars: '★★★★☆', text: '"Full visibility into payments — no more chasing members every month."', initials: 'KA', name: 'Kamran Ali', role: 'Admin, Karachi' },
    { stars: '★★★★★', text: '"The verification process gave me confidence. My payout came on time without any issue."', initials: 'NB', name: 'Nadia Baig', role: 'Member, Rawalpindi' },
    { stars: '★★★★★', text: '"Running a family committee across multiple cities was hard — CommitteeHub fixed that."', initials: 'MH', name: 'Muhammad Hussain', role: 'Family Admin' },
    { stars: '★★★★★', text: '"Notifications mean I never miss a payment date. Professional and trustworthy."', initials: 'ZF', name: 'Zara Farooq', role: 'Member, Faisalabad' }
  ];

  faqs = [
    { q: 'How do committees work on this platform?', a: 'A committee is a group savings arrangement where members contribute a fixed monthly amount. Each month, one member receives the total collected (their "turn"). CommitteeHub manages tracking, payment verification, and turn scheduling.' },
    { q: 'How are payments verified?', a: 'Members upload a bank transfer screenshot. The admin or focal person reviews and marks it verified. This creates a full audit trail for every transaction.' },
    { q: 'How is turn selection decided?', a: 'Turns can be pre-assigned when a member joins, or decided through the spin wheel for fairness. All members can see the result in real time.' },
    { q: 'Is my payment information secure?', a: 'CommitteeHub uses CNIC-verified registration and secure data storage. Note: all financial transactions happen directly between members and admins. The platform records them but does not process payments.' },
    { q: 'What if a member doesn\'t pay on time?', a: 'Automated reminders are sent before the due date. If payment is missed, the member is flagged and the admin is notified. Penalty rules are defined by the committee admin.' },
    { q: 'How do I request to join a committee?', a: 'Click "Request to Join" on any open committee. Fill in your name, CNIC, phone, email, and address. The admin will approve or reject your request and you will be notified.' }
  ];

  private colors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    try {
      const [cRes, mRes] = await Promise.all([
        sb.from('committees')
          .select('id, name, description, monthly_amount, total_members, duration_months, status, current_month, start_date, created_by, profiles(name, verified)')
          .in('status', ['active', 'pending'])
          .order('created_at', { ascending: false }),
        sb.from('members').select('id', { count: 'exact', head: true })
      ]);
      const cs = cRes.data || [];
      this.committees.set(cs);
      this.filteredCommittees.set(cs);
      const totalManaged = cs.reduce((s: number, c: any) => s + ((c.monthly_amount || 0) * (c.total_members || 0)), 0);
      this.stats.set({
        committees: cs.length,
        members: mRes.count || 0,
        managed: isNaN(totalManaged) ? 0 : totalManaged
      });
    } catch (e) {
      console.error('Landing load error:', e);
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    const f = this.activeFilter();
    let result = this.committees();
    if (f === 'Open') result = result.filter((c: any) => c.status === 'active');
    else if (f === 'Pending') result = result.filter((c: any) => c.status === 'pending');
    if (q) result = result.filter((c: any) =>
      c.name?.toLowerCase().includes(q) ||
      (c.profiles as any)?.name?.toLowerCase().includes(q)
    );
    this.filteredCommittees.set(result);
  }

  setFilter(f: string) { this.activeFilter.set(f); this.applyFilter(); }

  openDetailModal(c: any) { this.selectedCommittee.set(c); this.showDetailModal.set(true); }
  closeDetailModal() { this.showDetailModal.set(false); this.selectedCommittee.set(null); }

  openJoinModal(c: any) {
    this.joiningCommittee.set(c);
    this.joinForm = { name: '', phone: '', email: '', cnic: '', address: '', message: '' };
    this.joinSuccess.set(false);
    this.showJoinModal.set(true);
  }
  closeJoinModal() { this.showJoinModal.set(false); this.joiningCommittee.set(null); }

  async submitJoin() {
    if (!this.joinForm.name || !this.joinForm.phone || !this.joinForm.cnic) return;
    this.joinSubmitting.set(true);
    await new Promise(r => setTimeout(r, 800));
    this.joinSubmitting.set(false);
    this.joinSuccess.set(true);
    setTimeout(() => this.closeJoinModal(), 2000);
  }

  toggleFaq(i: number) { this.activeFaq.set(this.activeFaq() === i ? -1 : i); }
  toggleTheme() { this.theme.set(this.theme() === 'dark' ? 'light' : 'dark'); }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  getInitials(name: string): string {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getColor(name: string): string {
    return this.colors[(name?.charCodeAt(0) || 0) % this.colors.length];
  }

  formatPKR(n: number): string {
    if (!n || isNaN(n)) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M+';
    if (n >= 1000) return Math.round(n / 1000) + 'K+';
    return n.toString();
  }

  getJoinedCount(c: any) {
    if (!c.id) return 1;
    const charCode = typeof c.id === 'string' ? c.id.charCodeAt(0) : (c.id || 0);
    const mock = Math.floor((c.total_members || 0) * 0.7) + (charCode % 3);
    const result = Math.min(mock, c.total_members || 0);
    return isNaN(result) ? 0 : result;
  }

  getFillPct(c: any) {
    const j = this.getJoinedCount(c);
    if (!c.total_members) return 0;
    const pct = Math.round((j / c.total_members) * 100);
    return isNaN(pct) ? 0 : pct;
  }

  getStepIcon(num: number) {
    if (num === 1) return 'ti ti-user-plus';
    if (num === 2) return 'ti ti-building-community';
    if (num === 3) return 'ti ti-credit-card';
    return 'ti ti-trophy';
  }
}
