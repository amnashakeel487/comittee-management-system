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

  waitForAuth(): Promise<void> { return this._authReady; }

  private initAuth() {
    this.supabase.getSession().then(async ({ data }) => {
      if (data?.session?.user) await this.loadUserProfile(data.session.user);
      this._resolve();
    }).catch(() => this._resolve());

    this.supabase.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.user) {
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

  async loadUserProfile(supabaseUser: any) {
    try {
      const { data: profile, error } = await this.supabase.client
        .from('profiles').select('*').eq('id', supabaseUser.id).single();

      if (profile && !error) {
        // Map old 'admin' role to 'sub_admin' for backward compatibility
        let role = profile.role as string;
        if (role === 'admin') role = 'sub_admin';

        this.currentUser.set({
          id: supabaseUser.id,
          name: profile.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
          email: supabaseUser.email || '',
          phone: profile.phone,
          address: profile.address,
          cnic: profile.cnic,
          avatar: profile.profile_image,
          role: role as 'sub_admin' | 'super_admin',
          status: (profile.status as any) || 'active',
          verified: profile.verified || false,
          trust_score: profile.trust_score || 100
        });
        return;
      }
    } catch (e) {
      console.warn('loadUserProfile error:', e);
    }

    // Fallback
    const metaRole = supabaseUser.user_metadata?.role;
    this.currentUser.set({
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      role: metaRole === 'super_admin' ? 'super_admin' : 'sub_admin',
      status: 'active',
      trust_score: 100
    });
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.signIn(email, password);
      if (error) return { success: false, error: error.message };

      await this.loadUserProfile(data.user!);
      const profile = this.currentUser();

      if (profile?.status === 'suspended') {
        await this.supabase.signOut();
        this.currentUser.set(null);
        return { success: false, error: '🚫 Your account has been suspended. Contact support.' };
      }
      if (profile?.status === 'banned') {
        await this.supabase.signOut();
        this.currentUser.set(null);
        return { success: false, error: '🚫 Your account has been banned.' };
      }

      return { success: true, role: profile?.role || 'sub_admin' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Login failed' };
    } finally {
      this.isLoading.set(false);
    }
  }

  async register(email: string, password: string, name: string, phone?: string, cnic?: string): Promise<{ success: boolean; error?: string }> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.signUp(email, password, name, {
        role: 'sub_admin', phone: phone || '', cnic: cnic || ''
      });
      if (error) return { success: false, error: error.message };

      // Upsert profile with sub_admin role
      if (data.user) {
        await this.supabase.client.from('profiles').upsert({
          id: data.user.id,
          name, email,
          phone: phone || null,
          cnic: cnic || null,
          role: 'sub_admin',
          status: 'active',
          trust_score: 100
        }, { onConflict: 'id' });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Registration failed' };
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout() {
    const isSA = this.isSuperAdmin();
    try { await this.supabase.signOut(); } catch (e) {}
    this.currentUser.set(null);
    if (isSA) this.router.navigate(['/super-admin/login']);
    else this.router.navigate(['/auth/login']);
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
  isSubAdmin(): boolean { return this.currentUser()?.role === 'sub_admin'; }
  isSuperAdmin(): boolean { return this.currentUser()?.role === 'super_admin'; }
  // Keep isAdmin as alias for backward compat with existing components
  isAdmin(): boolean { return this.isSubAdmin() || this.isSuperAdmin(); }
}
