import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminFilterStateService } from '../../features/admin/services/admin-filter-state.service';
import { AuthSessionService } from '../services/auth-session.service';
import { UserRole } from '../../features/auth/models/auth.model';
import { environment } from '../../../environments/environment';

export const adminRegionFilterInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const filterService = inject(AdminFilterStateService);
  const authSession = inject(AuthSessionService);
  
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  
  // Only apply to GET API requests when the logged-in user is an ADMIN
  if (isApiRequest && req.method === 'GET') {
    const user = authSession.currentUser();
    if (user?.role === UserRole.ADMIN && filterService.hasActiveFilter()) {
      const filters = filterService.currentFilter();
      
      let params = req.params;
      
      if (filters.states && filters.states.length > 0) {
        // Append multiple states as states=id1,id2 or states=id1&states=id2
        // We'll append it as a comma-separated string for easier backend parsing
        params = params.set('states', filters.states.join(','));
      }
      
      if (filters.districts && filters.districts.length > 0) {
        params = params.set('districts', filters.districts.join(','));
      }
      
      const newReq = req.clone({ params });
      return next(newReq);
    }
  }

  return next(req);
};
