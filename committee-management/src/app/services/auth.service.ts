import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoading = signal(false);

  private _authReady: Promise<void>;
  private _authReadyResolve!: () => void;
  private _initialized = false;

  constructor(private supabase: SupabaseService, private router: Router) {
    this._authReady = new Promise(resolve => { this._authReadyResolve = resolve; });
    this.initAuth();
  }

  /** Wait for the initial session restore to complete */
  waitForAuth(): Promise<void> {
    return this._authReady;
  }

  private initAuth() {
    if (sessionStorage.getItem('demo_mode') === 'true') {
      this.currentUser.set({
        id: 'demo-user', name: 'Demo Admin',
        email: 'demo@committeehub.com', role: 'admin'
      });
    }

    // Use getSession for the initial check — fast and reliable
    this.supabase.getSession().then(async ({ data }) => {
      if (data?.session?.user) {
        await this.loadUserProfile(data.session.user);
        sessionStorage.removeItem('demo_mode');
      }
      this._resolve();
    }).catch(() => this._resolve());

    // onAuthStateChange handles token refresh when tab regains focus
    // but we do NOT use it to resolve _authReady (getSession handles that)
    this.supabase.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Silently refresh the user profile in background — no loading state
        this.loadUserProfile(session.user).catch(() => {});
      } else if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
      }
    });
  }

  private _resolve() {
    if (!this._initialized) {
      this._initialized = true;
      this._authReadyResolve();
    }
  }

  // ── Get real role from DB ─────────────────────────────────────
  private async getRoleFromDB(userId: string, email: string): Promise<'admin' | 'member' | 'super_admin'> {
    try {
      const { data: profile } = await this.supabase.client
        .from('profiles').select('role').eq('id', userId).single();
      if (profile?.role) return profile.role as 'admin' | 'member' | 'super_admin';
    } catch (e) {}
    try {
      const { data: member } = await this.supabase.client
        .from('members').select('id').eq('email', email).maybeSingle();
      if (member) return 'member';
    } catch (e) {}
    try {
      const { data: userData } = await this.supabase.client.auth.getUser();
      const metaRole = (userData?.user?.user_metadata as any)?.role;
      if (metaRole === 'member') return 'member';
      if (metaRole === 'super_admin') return 'super_admin';
    } catch (e) {}
    return 'admin';
  }

  private async loadUserProfile(supabaseUser: any) {
    try {
      const { data: profile } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profile) {
        this.currentUser.set({
          id: supabaseUser.id,
          name: profile.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
          email: supabaseUser.email || '',
          phone: profile.phone,
          address: profile.address,
          cnic: profile.cnic,
          avatar: profile.profile_image,
          role: profile.role || 'admin'
        });
        return;
      }
    } catch (e) {}

    // Fallback: check members table
    try {
      const { data: member } = await this.supabase.client
        .from('members')
        .select('*')
        .eq('email', supabaseUser.email)
        .maybeSingle();

      if (member) {
        this.currentUser.set({
          id: supabaseUser.id,
          name: member.name,
          email: supabaseUser.email || '',
          phone: member.phone,
          role: 'member'
        });
        return;
      }
    } catch (e) {}

    this.currentUser.set({
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      role: supabaseUser.user_metadata?.role || 'admin'
    });
  }

  // ── LOGIN with role validation ────────────────────────────────
  async login(
    email: string,
    password: string,
    selectedRole: 'admin' | 'member' | 'super_admin'
  ): Promise<{ success: boolean; error?: string; role?: string }> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.signIn(email, password);
      if (error) return { success: false, error: error.message };
      const user = data.user!;
      const realRole = await this.getRoleFromDB(user.id, user.email || '');

      // Super admin bypasses role selector check
      if (realRole === 'super_admin') {
        await this.loadUserProfile(user);
        return { success: true, role: 'super_admin' };
      }

      if (selectedRole === 'admin' && realRole !== 'admin') {
        await this.supabase.signOut();
        return { success: false, error: '🚫 Access Denied. You are not registered as Admin. Please select "Member" to login.' };
      }
      if (selectedRole === 'member' && realRole !== 'member') {
        await this.supabase.signOut();
        return { success: false, error: '🚫 Access Denied. This account is registered as Admin. Please select "Admin" to login.' };
      }

      await this.loadUserProfile(user);
      return { success: true, role: realRole };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Login failed' };
    } finally {
      this.isLoading.set(false);
    }
  }

  async register(
    email: string,
    password: string,
    name: string,
    phone?: string,
    cnic?: string
  ): Promise<{ success: boolean; error?: string }> {
    this.isLoading.set(true);
    try {
      // Self-registered users are ALWAYS admin
      const { data, error } = await this.supabase.signUp(
        email, password, name,
        { role: 'admin', phone: phone || '', cnic: cnic || '' }
      );
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Registration failed' };
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout() {
    try { await this.supabase.signOut(); } catch (e) {}
    this.currentUser.set(null);
    sessionStorage.removeItem('demo_mode');
    this.router.navigate(['/auth/login']);
  }

  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.resetPassword(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send reset email' };
    }
  }

  isAuthenticated(): boolean { return !!this.currentUser(); }
  isAdmin(): boolean { return this.currentUser()?.role === 'admin'; }
  isMember(): boolean { return this.currentUser()?.role === 'member'; }
  isSuperAdmin(): boolean { return this.currentUser()?.role === 'super_admin'; }
}
