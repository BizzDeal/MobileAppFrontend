import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthSessionService } from '../services/auth-session.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authSession = inject(AuthSessionService);

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isExcludedUrl =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register-member') ||
    req.url.includes('/auth/register-customer') ||
    req.url.includes('/auth/register-admin') ||
    req.url.includes('/auth/refresh-token') ||
    req.url.includes('/auth/forgot-pin') ||
    req.url.includes('/auth/reset-pin') ||
    req.url.includes('/users/user-exist');

  if (!isApiRequest || isExcludedUrl) {
    return next(req);
  }

  return from(authSession.getAccessToken()).pipe(
    switchMap((token) => {
      let authReq = req;
      if (token) {
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 && !req.url.includes('/auth/logout')) {
            authSession.logout(true);
          }
          return throwError(() => error);
        })
      );
    })
  );
};
