import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/** Only signed-in users can open the portal; everyone else goes to the login page. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const profile = await auth.getProfile();
  return profile
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
