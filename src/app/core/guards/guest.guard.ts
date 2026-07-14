import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';
import { UserRole } from '../../features/auth/models/auth.model';

export const guestGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (authSession.isAuthenticated()) {
    const currentRole = authSession.userRole();
    if (currentRole === UserRole.ADMIN) {
      return router.createUrlTree(['/admin']);
    }
    return router.createUrlTree(['/home']);
  }

  return true;
};
