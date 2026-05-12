import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (auth.isAuthenticated()) return true;
  router.navigate(['/auth/login']);
  return false;
};

export const subAdminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (auth.isSubAdmin()) return true;
  if (auth.isSuperAdmin()) { router.navigate(['/super-admin']); return false; }
  router.navigate(['/auth/login']);
  return false;
};

// Keep adminGuard as alias for backward compat
export const adminGuard = subAdminGuard;
export const memberGuard = authGuard;

export const superAdminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (auth.isSuperAdmin()) return true;
  if (auth.isAuthenticated()) router.navigate(['/dashboard']);
  else router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (!auth.isAuthenticated()) return true;
  if (auth.isSuperAdmin()) router.navigate(['/super-admin']);
  else router.navigate(['/dashboard']);
  return false;
};
