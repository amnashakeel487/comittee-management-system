import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Sub-admin: must be authenticated as sub_admin
export const subAdminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (auth.isSubAdmin()) return true;
  if (auth.isSuperAdmin()) { router.navigate(['/super-admin/dashboard']); return false; }
  router.navigate(['/auth/login']);
  return false;
};

export const adminGuard = subAdminGuard;
export const authGuard = subAdminGuard;
export const memberGuard = subAdminGuard;

// Super admin: must be authenticated as super_admin
export const superAdminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (auth.isSuperAdmin()) return true;
  // Not super admin — send to super admin login
  router.navigate(['/super-admin/login']);
  return false;
};

// Super admin guest: if already logged in as super_admin, redirect to dashboard
export const superAdminGuestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (auth.isSuperAdmin()) {
    router.navigate(['/super-admin/dashboard']);
    return false;
  }
  return true;
};

// Sub-admin guest: if already logged in, redirect appropriately
export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (!auth.isAuthenticated()) return true;
  if (auth.isSuperAdmin()) router.navigate(['/super-admin/dashboard']);
  else router.navigate(['/dashboard']);
  return false;
};
