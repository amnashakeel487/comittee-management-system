import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Wait for auth to initialize, then check currentUser signal
const checkSession = async (router: Router, auth: AuthService): Promise<boolean> => {
  if (sessionStorage.getItem('demo_mode') === 'true') return true;
  await auth.waitForAuth();
  if (auth.currentUser()) return true;
  router.navigate(['/auth/login']);
  return false;
};

export const authGuard: CanActivateFn = async (route, state) => {
  return checkSession(inject(Router), inject(AuthService));
};

export const adminGuard: CanActivateFn = async (route, state) => {
  return checkSession(inject(Router), inject(AuthService));
};

export const memberGuard: CanActivateFn = async (route, state) => {
  return checkSession(inject(Router), inject(AuthService));
};

export const guestGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (sessionStorage.getItem('demo_mode') === 'true') {
    router.navigate(['/dashboard']);
    return false;
  }

  await auth.waitForAuth();
  if (auth.currentUser()) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
