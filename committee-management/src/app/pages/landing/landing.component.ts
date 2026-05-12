import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://vxvgagkwgsjetvyvxdxg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dmdhZ2t3Z3NqZXR2eXZ4ZHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTI1NTUsImV4cCI6MjA5Mzk2ODU1NX0.knri6Kwk9p09rJ1zLwhOokbcCj-ByKdIlt774hKyJn8"
);

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./landing.component.html",
  styleUrls: ["./landing.component.scss"]
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
  activeFilter = signal("All");
  searchQuery = "";
  activeFaq = signal(-1);
  filters = ["All", "Open", "Pending"];
  joinForm = { name: "", phone: "", email: "", cnic: "", address: "", message: "" };

  steps = [
    { num: 1, title: "Register / Login", desc: "Create your account or log in as Sub-Admin." },
    { num: 2, title: "Join a Committee", desc: "Browse public committees and request to join." },
    { num: 3, title: "Pay Monthly", desc: "Upload your payment screenshot each month." },
    { num: 4, title: "Receive Your Turn", desc: "Get the full payout when your turn arrives." }
  ];

  features = [
    { title: "Secure Member Management", desc: "CNIC-verified profiles and role-based access." },
    { title: "Payment Tracking", desc: "Upload screenshots and track payment history." },
    { title: "Turn Management", desc: "Automated turn scheduling with spin wheel." },
    { title: "Screenshot Upload", desc: "Members upload receipts, admins verify." },
    { title: "Notifications", desc: "Alerts for payment due dates and approvals." },
    { title: "Spin Wheel", desc: "Fair, transparent turn selection." },
    { title: "Dashboards", desc: "Professional dashboards for all roles." },
    { title: "Financial Reports", desc: "Monthly reports and fund summaries." }
  ];

  testimonials = [
    { stars: "★★★★★", text: "Finally a proper system for committees. Payment tracking saved us from many disputes.", initials: "AU", name: "Ahmed Usman", role: "Committee Member, Lahore" },
    { stars: "★★★★★", text: "Managing 3 committees and 45 members became easy. The spin wheel is brilliant.", initials: "SR", name: "Sara Rehman", role: "Focal Person, Islamabad" },
    { stars: "★★★★☆", text: "Full visibility into who has paid. No more chasing people every month.", initials: "KA", name: "Kamran Ali", role: "Admin, Karachi" },
    { stars: "★★★★★", text: "Got my turn payout on time. Everything was smooth and transparent.", initials: "NB", name: "Nadia Baig", role: "Member, Rawalpindi" }
  ];

  faqs = [
    { q: "How do committees work?", a: "All members contribute a fixed monthly amount. Each month, one member receives the total collected amount. CommitteeHub manages tracking, payment verification, and turn scheduling." },
    { q: "How are payments verified?", a: "Members upload a bank transfer screenshot. The admin reviews and marks the payment as verified, creating a full audit trail." },
    { q: "How is turn selection decided?", a: "Turns can be pre-assigned or determined through our animated spin wheel for maximum fairness and transparency." },
    { q: "How do I request to join?", a: "Click Request to Join on any committee card. Fill in your details. The admin will review and respond within 24-48 hours." },
    { q: "Can I be in multiple committees?", a: "Yes, subject to each admin approval. Each committee has its own independent payment and turn schedule." }
  ];

  private colors = ["#2563eb", "#7c3aed", "#db2777", "#059669", "#d97706", "#dc2626"];

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    try {
      const [cRes, mRes] = await Promise.all([
        sb.from("committees")
          .select("id, name, description, monthly_amount, total_members, duration_months, status, current_month, start_date, created_by, profiles(name, verified)")
          .in("status", ["active", "pending"])
          .order("created_at", { ascending: false }),
        sb.from("members").select("id", { count: "exact", head: true })
      ]);
      const cs = cRes.data || [];
      this.committees.set(cs);
      this.filteredCommittees.set(cs);
      const totalManaged = cs.reduce((s: number, c: any) => s + ((c.monthly_amount || 0) * (c.total_members || 0)), 0);
      this.stats.set({ committees: cs.length, members: mRes.count || 0, managed: totalManaged });
    } catch (e) {
      console.error("Landing load error:", e);
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    const f = this.activeFilter();
    let result = this.committees();
    if (f === "Open") result = result.filter((c: any) => c.status === "active");
    else if (f === "Pending") result = result.filter((c: any) => c.status === "pending");
    if (q) result = result.filter((c: any) => c.name?.toLowerCase().includes(q) || c.profiles?.name?.toLowerCase().includes(q));
    this.filteredCommittees.set(result);
  }

  setFilter(f: string) { this.activeFilter.set(f); this.applyFilter(); }
  openDetailModal(c: any) { this.selectedCommittee.set(c); this.showDetailModal.set(true); }
  closeDetailModal() { this.showDetailModal.set(false); this.selectedCommittee.set(null); }
  openJoinModal(c: any) { this.joiningCommittee.set(c); this.joinForm = { name: "", phone: "", email: "", cnic: "", address: "", message: "" }; this.joinSuccess.set(false); this.showJoinModal.set(true); }
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

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  getInitials(name: string): string {
    if (!name) return "A";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  getColor(name: string): string {
    return this.colors[(name?.charCodeAt(0) || 0) % this.colors.length];
  }

  formatPKR(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M+";
    if (n >= 1000) return Math.round(n / 1000) + "K+";
    return n.toString();
  }
}
