import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
  showAuthGate = signal(false);
  showAdminProfile = signal(false);
  adminProfile = signal<any>(null);
  adminReviewsLoading = signal(false);
  isLoggedIn = signal(false);
  currentUserEmail = signal<string>('');
  selectedC = signal<any>(null);
  joiningC = signal<any>(null);
  joinSubmitting = signal(false);
  joinSuccess = signal(false);
  toastVisible = signal(false);
  toastMsg = signal('');
  requestMessage = '';
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
    { q: 'How do I request to join a committee?', a: 'Click "Request to Join" on any open committee. You\'ll be asked to sign in (or create a free account first). Once signed in, your request is sent to the focal person/admin who will approve or reject it — you\'ll be notified in your dashboard.' }
  ];

  private colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];

  constructor(private router: Router) {}

  async ngOnInit() {
    await this.loadData();
    // Track auth state so the "Request to Join" button can route the user
    // through the Auth Gate when they're not signed in.  The anon `sb`
    // client shares localStorage session storage with the rest of the app,
    // so getSession() correctly reflects whether the user is signed in.
    const { data } = await sb.auth.getSession();
    this.applySession(data?.session);
    sb.auth.onAuthStateChange((_event, session) => this.applySession(session));
  }

  private applySession(session: any) {
    if (session?.user?.id) {
      this.isLoggedIn.set(true);
      this.currentUserEmail.set(session.user.email || '');
    } else {
      this.isLoggedIn.set(false);
      this.currentUserEmail.set('');
    }
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
        const pRes = await sb.from('profiles')
          .select('id, name, verified, reputation_score, review_count')
          .in('id', creatorIds);
        (pRes.data || []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      // Step 3: enrich committees with admin info + reputation snapshot
      const enriched = cs.map((c: any) => ({
        ...c,
        admin_name:         profileMap[c.created_by]?.name             || 'Admin',
        admin_verified:     profileMap[c.created_by]?.verified         || false,
        admin_reputation:   Number(profileMap[c.created_by]?.reputation_score || 0),
        admin_review_count: Number(profileMap[c.created_by]?.review_count     || 0)
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

  // Entry point for the "Request to Join" button on every committee card.
  // If the visitor isn't signed in we show the Auth Gate so they can pick
  // Sign In or Create Account — once authenticated, clicking the same
  // button opens the simplified join modal that calls the
  // `submit_join_request_as_self` RPC (no need to re-enter name / CNIC /
  // phone / email — that comes from their profile).
  openJoin(c: any) {
    this.joiningC.set(c);
    this.requestMessage = '';
    this.joinSuccess.set(false);
    if (this.isLoggedIn()) {
      this.showJoin.set(true);
    } else {
      // Remember which committee they wanted to join so we can deep-link
      // back to it after sign-in.  Browse & Join in the dashboard reads
      // this key to auto-open the join modal for the same committee.
      try {
        sessionStorage.setItem('pendingJoinCommitteeId', c.id);
      } catch { /* private mode */ }
      this.showAuthGate.set(true);
    }
  }
  closeJoin() { this.showJoin.set(false); }
  closeAuthGate() { this.showAuthGate.set(false); }

  goToLogin() {
    this.showAuthGate.set(false);
    this.router.navigate(['/auth/login']);
  }
  goToRegister() {
    this.showAuthGate.set(false);
    this.router.navigate(['/auth/register']);
  }

  async submitJoin() {
    if (this.joinSubmitting()) return;

    const c = this.joiningC();
    if (!c) { this.showToast('No committee selected.'); return; }

    // Defensive: re-check session right before submitting in case it
    // expired while the modal was open.
    if (!this.isLoggedIn()) {
      this.closeJoin();
      this.showAuthGate.set(true);
      return;
    }

    const message = (this.requestMessage || '').trim();

    this.joinSubmitting.set(true);
    try {
      // Authenticated flow: the RPC reads auth.uid() and pulls the
      // caller's name / email / phone from `profiles`, finds-or-creates
      // their `members` row, upserts the join request, and notifies the
      // committee admin.  See scripts/migration-self-join-request.sql.
      const { error } = await sb.rpc('submit_join_request_as_self', {
        p_committee_id: c.id,
        p_message:      message || null
      });

      if (error) throw new Error(error.message);

      this.joinSuccess.set(true);
      this.showToast('Join request submitted! The admin will review and respond within 24–48 hours.');
      setTimeout(() => this.closeJoin(), 2200);
    } catch (e: any) {
      const msg = e?.message || 'Failed to submit join request.';
      if (msg.includes('Could not find the function') || msg.includes('does not exist')) {
        this.showToast('Setup incomplete: run scripts/migration-self-join-request.sql in Supabase.');
      } else if (msg.toLowerCase().includes('admin of this committee')) {
        this.showToast("You're the admin of this committee — you can't send a join request to yourself.");
      } else if (msg.toLowerCase().includes('not signed in')) {
        this.closeJoin();
        this.showAuthGate.set(true);
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

  // --- Admin Trust profile ----------------------------------------------

  async openAdminProfile(c: any) {
    if (!c?.created_by) return;
    this.adminProfile.set({
      id: c.created_by,
      name: c.admin_name,
      verified: c.admin_verified,
      reputation: c.admin_reputation || 0,
      review_count: c.admin_review_count || 0,
      committee: c,
      reviews: []
    });
    this.showAdminProfile.set(true);
    this.adminReviewsLoading.set(true);
    try {
      const { data: revs } = await sb
        .from('reviews')
        .select('id, rating, review_message, tags, created_at, reviewer_id, committee_id')
        .eq('reviewed_user_id', c.created_by)
        .order('created_at', { ascending: false })
        .limit(3);

      const reviewerIds = [...new Set((revs || []).map((r: any) => r.reviewer_id).filter(Boolean))];
      let reviewerMap = new Map<string, any>();
      if (reviewerIds.length) {
        const { data: profiles } = await sb
          .from('profiles').select('id, name').in('id', reviewerIds);
        reviewerMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      }
      const stitched = (revs || []).map((r: any) => ({
        ...r,
        reviewer: reviewerMap.get(r.reviewer_id) || null
      }));
      this.adminProfile.update(curr => ({ ...curr, reviews: stitched }));
    } catch {
      // ignore — reputation card still renders without reviews
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
    this.openJoin(ap.committee);
  }

  getStars(n: number) { return Array(5).fill(0).map((_, i) => i < Math.round(n)); }
  getReputationLevel(score: number) {
    if (score >= 4.5) return { label: 'Excellent', color: '#22c55e' };
    if (score >= 3.5) return { label: 'Trusted',   color: '#60A5FA' };
    if (score >= 2.5) return { label: 'Average',   color: '#fbbf24' };
    if (score > 0)    return { label: 'Risky',     color: '#f87171' };
    return { label: 'New Admin', color: '#94a3b8' };
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
