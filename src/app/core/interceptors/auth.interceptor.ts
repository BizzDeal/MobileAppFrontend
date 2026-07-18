import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authSession = inject(AuthSessionService);
  const injector = inject(Injector);

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
            if (!isRefreshing) {
              isRefreshing = true;
              refreshTokenSubject.next(null);

              return from(authSession.getRefreshToken()).pipe(
                switchMap((refreshToken) => {
                  if (refreshToken) {
                    const authApi = injector.get(AuthApiService);
                    return authApi.refreshToken(refreshToken).pipe(
                      switchMap((tokens) => {
                        isRefreshing = false;
                        refreshTokenSubject.next(tokens.accessToken);
                        return from(authSession.updateTokens(tokens.accessToken, tokens.refreshToken)).pipe(
                          switchMap(() => {
                            const newReq = req.clone({
                              setHeaders: {
                                Authorization: `Bearer ${tokens.accessToken}`,
                              },
                            });
                            return next(newReq);
                          })
                        );
                      }),
                      catchError((refreshErr) => {
                        isRefreshing = false;
                        authSession.logout(true);
                        return throwError(() => refreshErr);
                      })
                    );
                  } else {
                    isRefreshing = false;
                    authSession.logout(true);
                    return throwError(() => error);
                  }
                })
              );
            } else {
              return refreshTokenSubject.pipe(
                filter((result) => result !== null),
                take(1),
                switchMap((newToken) => {
                  const newReq = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newToken}`,
                    },
                  });
                  return next(newReq);
                })
              );
            }
          }
          return throwError(() => error);
        })
      );
    })
  );
};
