import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

// Simple session check — just verifies the user is logged in
const checkSession = (router: Router, supabase: SupabaseService): Promise<boolean> => {
  if (sessionStorage.getItem('demo_mode') === 'true') return Promise.resolve(true);
  return supabase.getSession().then(({ data }) => {
    if (data?.session) return true;
    router.navigate(['/auth/login']);
    return false;
  }).catch(() => { router.navigate(['/auth/login']); return false; });
};

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);
  return checkSession(router, supabase);
};

// adminGuard = same as authGuard (role redirect handled in login flow)
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);
  return checkSession(router, supabase);
};

// memberGuard = same as authGuard
export const memberGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);
  return checkSession(router, supabase);
};

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);

  if (sessionStorage.getItem('demo_mode') === 'true') {
    router.navigate(['/dashboard']);
    return false;
  }

  return supabase.getSession().then(({ data }) => {
    if (data?.session) { router.navigate(['/dashboard']); return false; }
    return true;
  }).catch(() => true);
};
