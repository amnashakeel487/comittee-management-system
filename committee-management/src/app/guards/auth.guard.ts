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

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  await auth.waitForAuth();
  if (auth.isAdmin()) return true;
  router.navigate(['/auth/login']);
  return false;
};

// alias
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
