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
  theme = signal<'dark'|'light'>('dark');
  loading = signal(true);
  committees = signal<any[]>([]);
  filtered = signal<any[]>([]);
  stats = signal({ members: 0, committees: 0, managed: 0 });
  heroC = signal<any>(null);
  activeFilter = signal('all');
  searchQuery = '';
  activeFaq = signal(-1);
  showDetail = signal(false);
  showJoin = signal(false);
  selectedC = signal<any>(null);
  joiningC = signal<any>(null);
  joinSubmitting = signal(false);
  joinSuccess = signal(false);
  toastVisible = signal(false);
  toastMsg = signal('');
  requestMessage = '';
  // Two-way bindings for the public join modal — all start empty when a
  // new committee is opened (see openJoin()).
  joinForm = { fullName: '', phone: '', email: '', cnic: '', address: '' };
  private toastTimer: any;

  filters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'filling', label: 'Filling' },
    { key: 'full', label: 'Full' },
    { key: 'savings', label: 'Savings' },
    { key: 'family', label: 'Family' },
    { key: 'business', label: 'Business' }
  ];

  steps = [
    { n: 1, icon: 'person_add', title: 'Register / Login', desc: 'Create your account. Admin sets up your member profile and access.' },
    { n: 2, icon: 'groups', title: 'Join a Committee', desc: 'Browse committees, submit a request, and get approved by the focal person.' },
    { n: 3, icon: 'credit_card', title: 'Pay Monthly', desc: 'Upload your payment screenshot. Admin verifies and marks it paid.' },
    { n: 4, icon: 'emoji_events', title: 'Receive Your Turn', desc: 'When your number is drawn, you receive the full monthly payout.' }
  ];

  features = [
    { icon: 'security', title: 'Secure Member Management', desc: 'CNIC-verified profiles with role-based access and full audit history.' },
    { icon: 'receipt_long', title: 'Payment Tracking', desc: 'Upload receipts, track monthly installments, and view real-time status.' },
    { icon: 'shuffle', title: 'Turn Management', desc: 'Automated scheduling with manual override. Everyone knows their date.' },
    { icon: 'upload_file', title: 'Screenshot Upload', desc: 'Members upload bank receipts. Admins verify with one click.' },
    { icon: 'notifications_active', title: 'Smart Notifications', desc: 'Automated alerts for due dates, turns, and approvals.' },
    { icon: 'casino', title: 'Spin Wheel Selection', desc: 'Fair, visible turn selection with an animated spin wheel.' },
    { icon: 'dashboard', title: 'Role-Based Dashboards', desc: 'Separate views for members, focal persons, and admins.' },
    { icon: 'bar_chart', title: 'Financial Reports', desc: 'Monthly summaries, outstanding balances, and full fund history.' }
  ];

  testimonials = [
    { stars: '★★★★★', q: '"Payment tracking and screenshot uploads saved us from so many disputes."', initials: 'AU', name: 'Ahmed Usman', role: 'Member, Lahore' },
    { stars: '★★★★★', q: '"Managing 3 committees and 45 members is now easy. The spin wheel feature is great."', initials: 'SR', name: 'Sara Rehman', role: 'Focal Person, Islamabad' },
    { stars: '★★★★☆', q: '"Full visibility into payments — no more chasing members every month."', initials: 'KA', name: 'Kamran Ali', role: 'Admin, Karachi' },
    { stars: '★★★★★', q: '"The verification process gave me confidence. My payout came on time."', initials: 'NB', name: 'Nadia Baig', role: 'Member, Rawalpindi' },
    { stars: '★★★★★', q: '"Running a family committee across multiple cities was hard — CommitteeHub fixed that."', initials: 'MH', name: 'Muhammad Hussain', role: 'Family Admin' },
    { stars: '★★★★★', q: '"Notifications mean I never miss a payment date. Professional and trustworthy."', initials: 'ZF', name: 'Zara Farooq', role: 'Member, Faisalabad' }
  ];

  faqs = [
    { q: 'How do committees work on this platform?', a: 'A committee is a group savings arrangement where members contribute a fixed monthly amount. Each month, one member receives the total collected (their "turn"). CommitteeHub manages tracking, payment verification, and turn scheduling.' },
    { q: 'How are payments verified?', a: 'Members upload a bank transfer screenshot. The admin or focal person reviews and marks it verified. This creates a full audit trail for every transaction.' },
    { q: 'How is turn selection decided?', a: 'Turns can be pre-assigned when a member joins, or decided through the spin wheel for fairness. All members can see the result in real time.' },
    { q: 'Is my payment information secure?', a: 'CommitteeHub uses CNIC-verified registration and secure data storage. Note: all financial transactions happen directly between members and admins. The platform records them but does not process payments.' },
    { q: "What if a member doesn't pay on time?", a: 'Automated reminders are sent before the due date. If payment is missed, the member is flagged and the admin is notified. Penalty rules are defined by the committee admin.' },
    { q: 'How do I request to join a committee?', a: 'Click "Request to Join" on any open committee. Fill in your name, CNIC, phone, email, and address. The admin will approve or reject your request and you will be notified.' }
  ];

  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    try {
      // Step 1: fetch committees (no join — join fails with anon key)
      const cRes = await sb
        .from('committees')
        .select('id, name, description, monthly_amount, total_members, duration_months, status, current_month, start_date, created_by')
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

      const cs = cRes.data || [];

      // Step 2: fetch admin names from profiles separately
      const creatorIds = [...new Set(cs.map((c: any) => c.created_by).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (creatorIds.length > 0) {
        const pRes = await sb.from('profiles').select('id, name, verified').in('id', creatorIds);
        (pRes.data || []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      // Step 3: enrich committees with admin info
      const enriched = cs.map((c: any) => ({
        ...c,
        admin_name: profileMap[c.created_by]?.name || 'Admin',
        admin_verified: profileMap[c.created_by]?.verified || false
      }));

      this.committees.set(enriched);
      this.filtered.set(enriched);
      if (enriched.length > 0) this.heroC.set(enriched[0]);

      // Step 4: get member count using service role via a simple count trick
      // Use committees data to estimate — or just show committee count
      const totalManaged = enriched.reduce((s: number, c: any) => s + ((c.monthly_amount || 0) * (c.total_members || 0)), 0);
      const totalMembers = enriched.reduce((s: number, c: any) => s + (c.total_members || 0), 0);

      this.stats.set({
        committees: enriched.length,
        members: totalMembers,
        managed: totalManaged
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
    let r = this.committees();
    if (f === 'open') r = r.filter((c: any) => c.status === 'active');
    else if (f === 'filling') r = r.filter((c: any) => c.status === 'pending');
    else if (f === 'full') r = r.filter((c: any) => c.status === 'completed');
    else if (f !== 'all') r = r.filter((c: any) =>
      c.name?.toLowerCase().includes(f) || c.description?.toLowerCase().includes(f)
    );
    if (q) r = r.filter((c: any) =>
      c.name?.toLowerCase().includes(q) || c.admin_name?.toLowerCase().includes(q)
    );
    this.filtered.set(r);
  }

  setFilter(key: string) { this.activeFilter.set(key); this.applyFilter(); }
  toggleTheme() { this.theme.update(t => t === 'dark' ? 'light' : 'dark'); }
  toggleFaq(i: number) { this.activeFaq.set(this.activeFaq() === i ? -1 : i); }
  scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }

  openDetail(c: any) { this.selectedC.set(c); this.showDetail.set(true); }
  closeDetail() { this.showDetail.set(false); }
  openJoin(c: any) {
    this.joiningC.set(c);
    this.requestMessage = '';
    this.joinForm = { fullName: '', phone: '', email: '', cnic: '', address: '' };
    this.joinSuccess.set(false);
    this.showJoin.set(true);
  }
  closeJoin() { this.showJoin.set(false); }

  async submitJoin() {
    if (this.joinSubmitting()) return;

    const c = this.joiningC();
    if (!c) { this.showToast('No committee selected.'); return; }

    const fullName = this.joinForm.fullName.trim();
    const phone    = this.joinForm.phone.trim();
    const email    = this.joinForm.email.trim();
    const cnic     = this.joinForm.cnic.trim();
    const address  = this.joinForm.address.trim();
    const message  = (this.requestMessage || '').trim();

    if (!fullName) { this.showToast('Please enter your full name.'); return; }
    if (!phone)    { this.showToast('Please enter your phone number.'); return; }
    if (!cnic)     { this.showToast('Please enter your CNIC.'); return; }

    this.joinSubmitting.set(true);
    try {
      // Anonymous visitors cannot INSERT into `members` / `join_requests`
      // directly under normal RLS, so we go through a SECURITY DEFINER RPC
      // that validates input and writes both tables + a notification.
      // See scripts/migration-landing-join-request.sql.
      const { error } = await sb.rpc('submit_landing_join_request', {
        p_committee_id: c.id,
        p_full_name:    fullName,
        p_phone:        phone,
        p_email:        email || null,
        p_cnic:         cnic,
        p_address:      address || null,
        p_message:      message || null
      });

      if (error) throw new Error(error.message);

      this.joinSuccess.set(true);
      this.showToast('Join request submitted! The admin will review and respond within 24–48 hours.');
      setTimeout(() => this.closeJoin(), 2200);
    } catch (e: any) {
      const msg = e?.message || 'Failed to submit join request.';
      // If the RPC doesn't exist yet, give a clear hint instead of a cryptic error.
      if (msg.includes('Could not find the function') || msg.includes('does not exist')) {
        this.showToast('Setup incomplete: run scripts/migration-landing-join-request.sql in Supabase.');
      } else {
        this.showToast('Failed: ' + msg);
      }
    } finally {
      this.joinSubmitting.set(false);
    }
  }

  showToast(msg: string) {
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 4000);
  }

  getStatusClass(status: string) {
    if (status === 'active') return 'open';
    if (status === 'pending') return 'filling';
    return 'full';
  }
  getStatusLabel(status: string) {
    if (status === 'active') return 'Open';
    if (status === 'pending') return 'Pending';
    return 'Completed';
  }
  getProgress(c: any) { return c.duration_months > 0 ? Math.round(((c.current_month || 0) / c.duration_months) * 100) : 0; }
  getInitials(n: string) { return (n || 'A').split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2); }
  getColor(n: string) { return this.colors[(n?.charCodeAt(0) || 0) % this.colors.length]; }
  formatPKR(n: number) { if (n >= 1000000) return (n/1000000).toFixed(1)+'M+'; if (n >= 1000) return Math.round(n/1000)+'K+'; return n.toString(); }
}
