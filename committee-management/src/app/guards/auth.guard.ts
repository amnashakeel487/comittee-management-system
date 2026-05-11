import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const checkSession = async (router: Router, auth: AuthService): Promise<boolean> => {
  if (sessionStorage.getItem('demo_mode') === 'true') return true;
  await auth.waitForAuth();
  if (auth.currentUser()) return true;
  router.navigate(['/auth/login']);
  return false;
};

export const authGuard: CanActivateFn = async () =>
  checkSession(inject(Router), inject(AuthService));

export const adminGuard: CanActivateFn = async () =>
  checkSession(inject(Router), inject(AuthService));

export const memberGuard: CanActivateFn = async () =>
  checkSession(inject(Router), inject(AuthService));

export const superAdminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (auth.isSuperAdmin()) return true;
  router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (sessionStorage.getItem('demo_mode') === 'true') {
    router.navigate(['/dashboard']);
    return false;
  }
  await auth.waitForAuth();
  if (auth.currentUser()) {
    const role = auth.currentUser()?.role;
    if (role === 'super_admin') router.navigate(['/super-admin']);
    else if (role === 'member') router.navigate(['/member-portal']);
    else router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
