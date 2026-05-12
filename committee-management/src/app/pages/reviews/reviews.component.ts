import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { SupabaseService } from "../../services/supabase.service";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: "app-reviews",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./reviews.component.html",
  styleUrls: ["./reviews.component.scss"]
})
export class ReviewsComponent implements OnInit {
  loading = signal(true);
  myProfile = signal<any>(null);
  receivedReviews = signal<any[]>([]);
  committeeMembers = signal<any[]>([]);
  showReviewModal = signal(false);
  reviewingUser = signal<any>(null);
  submitting = signal(false);
  activeTab = signal<"received"|"write">("received");

  reviewForm = {
    rating: 0, communication_rating: 0, reliability_rating: 0,
    payment_behavior_rating: 0, review_message: "", tags: [] as string[]
  };

  availableTags = [
    { key: "trusted", label: "Trusted", color: "#4ade80" },
    { key: "cooperative", label: "Cooperative", color: "#60A5FA" },
    { key: "responsive", label: "Responsive", color: "#a78bfa" },
    { key: "recommended", label: "Recommended", color: "#fbbf24" },
    { key: "late_payer", label: "Late Payer", color: "#f87171" },
    { key: "fraud_risk", label: "Fraud Risk", color: "#ef4444" }
  ];

  private colors = ["#2563eb","#7c3aed","#db2777","#059669","#d97706","#dc2626"];

  constructor(public auth: AuthService, private supabase: SupabaseService, private toast: ToastService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    await Promise.all([this.loadMyProfile(), this.loadReceivedReviews(), this.loadCommitteeMembers()]);
    this.loading.set(false);
  }

  private async loadMyProfile() {
    const { data } = await this.supabase.client.from("profiles").select("*").eq("id", this.auth.currentUser()?.id).single();
    this.myProfile.set(data);
  }

  private async loadReceivedReviews() {
    const { data } = await this.supabase.client
      .from("reviews").select("*, reviewer:reviewer_id(name, email), committee:committee_id(name)")
      .eq("reviewed_user_id", this.auth.currentUser()?.id)
      .order("created_at", { ascending: false });
    this.receivedReviews.set(data || []);
  }

  private async loadCommitteeMembers() {
    const userId = this.auth.currentUser()?.id;
    const email = this.auth.currentUser()?.email;

    // Get committees this user CREATED
    const { data: myCreatedCommittees } = await this.supabase.client
      .from('committees').select('id, name').eq('created_by', userId);

    // Get committees this user JOINED (via members table)
    const { data: myMemberRecs } = await this.supabase.client
      .from('members').select('id').eq('email', email || '');
    const myMemberIds = (myMemberRecs || []).map((m: any) => m.id);

    let joinedCommitteeIds: string[] = [];
    if (myMemberIds.length > 0) {
      const { data: myCMs } = await this.supabase.client
        .from('committee_members').select('committee_id').in('member_id', myMemberIds);
      joinedCommitteeIds = (myCMs || []).map((c: any) => c.committee_id);
    }

    // All committee IDs this user is part of
    const allCommitteeIds = [
      ...new Set([
        ...(myCreatedCommittees || []).map((c: any) => c.id),
        ...joinedCommitteeIds
      ])
    ];

    if (!allCommitteeIds.length) { this.committeeMembers.set([]); return; }

    // Get all committee details
    const { data: allCommittees } = await this.supabase.client
      .from('committees').select('id, name, created_by').in('id', allCommitteeIds);

    // Get all members in these committees
    const { data: allCMs } = await this.supabase.client
      .from('committee_members')
      .select('member_id, committee_id, members(id, name, email)')
      .in('committee_id', allCommitteeIds);

    // Build email→authId map from profiles for all member emails
    const memberEmails = [...new Set((allCMs || []).map((cm: any) => cm.members?.email).filter(Boolean))];
    let emailToAuthId: Record<string, string> = {};
    if (memberEmails.length > 0) {
      const { data: profilesByEmail } = await this.supabase.client
        .from('profiles').select('id, email').in('email', memberEmails);
      (profilesByEmail || []).forEach((p: any) => { emailToAuthId[p.email] = p.id; });
    }

    // Get all committee creators (other sub-admins who created committees you joined)
    const creatorIds = (allCommittees || [])
      .map((c: any) => c.created_by)
      .filter((id: string) => id !== userId);

    let creatorProfiles: any[] = [];
    if (creatorIds.length > 0) {
      const { data: profiles } = await this.supabase.client
        .from('profiles').select('id, name, email').in('id', creatorIds);
      creatorProfiles = profiles || [];
    }

    // Get already-reviewed pairs
    const { data: existingReviews } = await this.supabase.client
      .from('reviews').select('reviewed_user_id, committee_id').eq('reviewer_id', userId);
    const reviewed = new Set((existingReviews || []).map((r: any) => `${r.reviewed_user_id}-${r.committee_id}`));

    const unique = new Map();

    // Add committee members (people in same committees via members table)
    (allCMs || []).forEach((cm: any) => {
      const memberEmail = cm.members?.email;
      const memberId = cm.members?.id;
      if (memberEmail && memberEmail !== email && memberId) {
        const key = `${memberId}-${cm.committee_id}`;
        if (!unique.has(key) && !reviewed.has(key)) {
          const committee = (allCommittees || []).find((c: any) => c.id === cm.committee_id);
          unique.set(key, {
            member: cm.members,
            committee: { id: cm.committee_id, name: committee?.name || 'Committee' },
            committee_id: cm.committee_id,
            type: 'member'
          });
        }
      }
    });

    // Add committee creators (sub-admins who created committees you joined)
    creatorProfiles.forEach((profile: any) => {
      (allCommittees || [])
        .filter((c: any) => c.created_by === profile.id && joinedCommitteeIds.includes(c.id))
        .forEach((c: any) => {
          const key = `${profile.id}-${c.id}`;
          if (!unique.has(key) && !reviewed.has(key)) {
            unique.set(key, {
              member: { id: profile.id, name: profile.name, email: profile.email },
              committee: { id: c.id, name: c.name },
              committee_id: c.id,
              type: 'creator'
            });
          }
        });
    });

    // Add members of YOUR committees (people who joined your committees)
    (allCMs || []).forEach((cm: any) => {
      const memberEmail = cm.members?.email;
      const memberId = cm.members?.id;
      const isMyCommittee = (myCreatedCommittees || []).some((c: any) => c.id === cm.committee_id);
      if (isMyCommittee && memberEmail && memberEmail !== email && memberId) {
        const key = `${memberId}-${cm.committee_id}`;
        if (!unique.has(key) && !reviewed.has(key)) {
          const committee = (allCommittees || []).find((c: any) => c.id === cm.committee_id);
          unique.set(key, {
            member: cm.members,
            committee: { id: cm.committee_id, name: committee?.name || 'Committee' },
            committee_id: cm.committee_id,
            type: 'participant'
          });
        }
      }
    });

    this.committeeMembers.set([...unique.values()]);
  }

  openReviewModal(item: any) { this.reviewingUser.set(item); this.reviewForm = { rating: 0, communication_rating: 0, reliability_rating: 0, payment_behavior_rating: 0, review_message: "", tags: [] }; this.showReviewModal.set(true); }
  closeReviewModal() { this.showReviewModal.set(false); this.reviewingUser.set(null); }

  setRating(field: string, val: number) { (this.reviewForm as any)[field] = val; }
  toggleTag(tag: string) { const t = this.reviewForm.tags; const i = t.indexOf(tag); if (i >= 0) t.splice(i, 1); else t.push(tag); }
  hasTag(tag: string) { return this.reviewForm.tags.includes(tag); }

  async submitReview() {
    if (!this.reviewForm.rating) { this.toast.error("Please give an overall rating"); return; }
    const item = this.reviewingUser();
    if (!item) return;

    // reviews.reviewed_user_id has a FK to auth.users(id), so we MUST insert a valid auth user id.
    // Always resolve via profiles by email (case-insensitive) regardless of `type` — for
    // type='member'/'participant' the member.id is a members-table id (not an auth id), and even
    // for type='creator' an email-based lookup protects against orphaned/stale ids.
    const memberEmail = (item.member?.email || '').trim();
    if (!memberEmail) {
      this.toast.error(`Cannot review ${item.member?.name || 'this user'} — no email on record.`);
      return;
    }

    const { data: profile, error: profErr } = await this.supabase.client
      .from('profiles')
      .select('id')
      .ilike('email', memberEmail)
      .maybeSingle();

    if (profErr) { this.toast.error("Could not look up user: " + profErr.message); return; }
    if (!profile?.id) {
      this.toast.error(`${item.member?.name} doesn't have an account yet and cannot be reviewed.`);
      return;
    }

    const reviewedAuthId = profile.id;
    if (reviewedAuthId === this.auth.currentUser()?.id) { this.toast.error("You cannot review yourself"); return; }

    this.submitting.set(true);
    try {
      const { error } = await this.supabase.client.from("reviews").insert({
        reviewer_id: this.auth.currentUser()?.id,
        reviewed_user_id: reviewedAuthId,
        committee_id: item.committee_id,
        rating: this.reviewForm.rating,
        communication_rating: this.reviewForm.communication_rating || null,
        reliability_rating: this.reviewForm.reliability_rating || null,
        payment_behavior_rating: this.reviewForm.payment_behavior_rating || null,
        review_message: this.reviewForm.review_message || null,
        tags: this.reviewForm.tags.length ? this.reviewForm.tags : null
      });
      if (error) throw new Error(error.message);
      await this.updateReputationScore(reviewedAuthId);
      await this.supabase.client.from("notifications").insert({
        user_id: reviewedAuthId,
        title: "New Review Received ⭐",
        message: `${this.auth.currentUser()?.name} left you a ${this.reviewForm.rating}-star review.`,
        type: "info", read: false
      });
      this.toast.success("Review submitted successfully!");
      this.closeReviewModal();
      await this.loadCommitteeMembers();
    } catch (e: any) { this.toast.error("Failed: " + e?.message); }
    finally { this.submitting.set(false); }
  }

  private async updateReputationScore(userId: string) {
    const { data: reviews } = await this.supabase.client.from("reviews").select("rating").eq("reviewed_user_id", userId);
    if (!reviews?.length) return;
    const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
    await this.supabase.client.from("profiles").update({ reputation_score: Math.round(avg * 10) / 10, review_count: reviews.length }).eq("id", userId);
  }

  getReputationLevel(score: number) {
    if (score >= 4.5) return { label: "Excellent", color: "#4ade80" };
    if (score >= 3.5) return { label: "Trusted", color: "#60A5FA" };
    if (score >= 2.5) return { label: "Average", color: "#fbbf24" };
    return { label: "Risky", color: "#f87171" };
  }

  getStars(n: number) { return Array(5).fill(0).map((_, i) => i < n); }
  getInitials(name: string) { return (name || "U").split(" ").map((x: string) => x[0]).join("").toUpperCase().slice(0, 2); }
  getColor(name: string) { return this.colors[(name?.charCodeAt(0) || 0) % this.colors.length]; }
}
