import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DataService } from "../../services/data.service";
import { ToastService } from "../../services/toast.service";
import { AuthService } from "../../services/auth.service";
import { Member } from "../../models";

interface StoredCredential {
  memberId: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

@Component({
  selector: "app-members",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./members.component.html",
  styleUrls: ["./members.component.scss"]
})
export class MembersComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  members = signal<Member[]>([]);
  filteredMembers = signal<Member[]>([]);
  showModal = signal(false);
  showCredentialsModal = signal(false);
  editingMember = signal<Member | null>(null);
  viewingCredentials = signal<StoredCredential | null>(null);
  copiedField = signal<string>("");
  showPassword = signal(false);

  memberForm = {
    name: "", phone: "", email: "", cnic: "" as string | undefined,
    role: "member" as "sub_admin" | "member",
    payout_order: 1
  };

  private readonly avatarColors = ["#2563eb", "#7c3aed", "#db2777", "#059669", "#d97706", "#dc2626"];

  constructor(private dataService: DataService, private toast: ToastService, private auth: AuthService) {}

  async ngOnInit() {
    await this.auth.waitForAuth();
    try {
      const members = await this.dataService.getMembers();
      this.members.set(members);
      this.filteredMembers.set(members);
    } finally {
      this.loading.set(false);
    }
  }

  // -- Credential Storage --------------------------------------

  getCredential(member: Member): StoredCredential | null {
    if (!member.login_password) return null;
    return {
      memberId: member.id,
      name: member.name,
      email: member.email,
      password: member.login_password,
      createdAt: member.created_at || new Date().toISOString()
    };
  }

  hasCredential(member: Member): boolean {
    return !!member.login_password;
  }

  viewCredentials(member: Member) {
    const cred = this.getCredential(member);
    if (!cred) {
      this.toast.warning("No saved credentials for this member. Credentials are only saved when a member is first added.");
      return;
    }
    this.showPassword.set(false);
    this.viewingCredentials.set(cred);
    this.showCredentialsModal.set(true);
  }

  closeCredentialsModal() {
    this.showCredentialsModal.set(false);
    this.viewingCredentials.set(null);
  }

  // -- Members CRUD --------------------------------------------

  activeCount() { return this.members().filter(m => m.status === "active").length; }
  adminCount() { return this.members().filter(m => m.role === "sub_admin").length; }

  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredMembers.set(
      q ? this.members().filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.includes(q)
      ) : this.members()
    );
  }

  openAddModal() {
    this.editingMember.set(null);
    this.memberForm = { name: "", phone: "", email: "", cnic: "", role: "member", payout_order: this.members().length + 1 };
    this.showModal.set(true);
  }

  editMember(member: Member) {
    this.editingMember.set(member);
    this.memberForm = { name: member.name, phone: member.phone, email: member.email, cnic: member.cnic, role: member.role, payout_order: member.payout_order };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  generatePassword(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
    let pwd = "";
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
  }

  async saveMember() {
    if (!this.memberForm.name || !this.memberForm.phone || !this.memberForm.email || !this.memberForm.cnic) {
      this.toast.error("Please fill all required fields");
      return;
    }
    this.saving.set(true);
    try {
      if (this.editingMember()) {
        const updated = await this.dataService.updateMember(this.editingMember()!.id, this.memberForm);
        this.members.update(list => list.map(m => m.id === updated.id ? updated : m));
        this.filteredMembers.update(list => list.map(m => m.id === updated.id ? updated : m));
        this.toast.success("Member updated successfully");
        this.closeModal();
      } else {
        const generatedPassword = this.generatePassword();
        const newMember = await this.dataService.createMember({ ...this.memberForm, password: generatedPassword });
        this.members.update(list => [...list, newMember]);
        this.filteredMembers.update(list => [...list, newMember]);
        // Show credentials modal immediately
        this.showPassword.set(true);
        this.viewingCredentials.set({ memberId: newMember.id, name: newMember.name, email: newMember.email, password: generatedPassword, createdAt: new Date().toISOString() });
        this.closeModal();
        this.showCredentialsModal.set(true);
      }
    } catch (e: any) {
      console.error("Save member error:", e);
      this.toast.error("Error: " + (e?.message || JSON.stringify(e)));
    } finally {
      this.saving.set(false);
    }
  }

  async deleteMember(member: Member) {
    if (!confirm("Remove " + member.name + " from the system?")) return;
    try {
      await this.dataService.deleteMember(member.id);
      this.members.update(list => list.filter(m => m.id !== member.id));
      this.filteredMembers.update(list => list.filter(m => m.id !== member.id));
      this.toast.success("Member removed");
    } catch { this.toast.error("Failed to remove member"); }
  }

  copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedField.set(field);
      setTimeout(() => this.copiedField.set(""), 2000);
      this.toast.success("Copied to clipboard!");
    });
  }

  copyBoth() {
    const cred = this.viewingCredentials();
    if (!cred) return;
    this.copyToClipboard(`Email: ${cred.email}\nPassword: ${cred.password}`, "both");
  }

  getInitials(name: string): string { return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
  getAvatarColor(name: string): string { return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length]; }
}
