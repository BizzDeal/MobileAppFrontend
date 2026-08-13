import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { AuthSessionService } from '../services/auth-session.service';
import { UserRole } from '../../features/auth/models/auth.model';

export const authGuard: CanActivateFn = (route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSession.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const isWeb = !Capacitor.isNativePlatform();
  const currentRole = authSession.userRole();

  // On web platform, only ADMIN can proceed.
  if (isWeb && currentRole !== UserRole.ADMIN) {
    authSession.clearSession();
    return router.createUrlTree(['/auth/login']);
  }

  const allowedRoles = route.data['roles'] as UserRole[] | undefined;
  if (allowedRoles && allowedRoles.length > 0) {
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      if (currentRole === UserRole.ADMIN) {
        return router.createUrlTree(['/admin']);
      }
      return router.createUrlTree(['/home']);
    }
  }

  return true;
};
