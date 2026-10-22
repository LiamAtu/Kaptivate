import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/** Only the owner (role 'admin') can open admin pages; clients go back to their dashboard. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const profile = await auth.getProfile();
  return profile?.role === 'admin' ? true : router.createUrlTree(['/portal/dashboard']);
};
