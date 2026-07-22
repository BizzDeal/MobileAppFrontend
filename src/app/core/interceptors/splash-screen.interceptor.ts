import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SplashScreenService } from '../services/splash-screen.service';
import { filter, switchMap, take } from 'rxjs/operators';

export const splashScreenInterceptor: HttpInterceptorFn = (req, next) => {
  const splashScreenService = inject(SplashScreenService);
  
  // If the splash screen is visible, wait for it to emit false before proceeding with the request.
  // Otherwise, proceed immediately.
  return splashScreenService.isSplashVisible$.pipe(
    filter(isVisible => !isVisible),
    take(1),
    switchMap(() => next(req))
  );
};
