import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

function extractResourceName(url: string): string {
  try {
    // Handle relative URLs by providing a base
    const urlObj = new URL(url, url.startsWith('http') ? undefined : 'http://localhost');
    const segments = urlObj.pathname.split('/').filter(s => s && s !== 'api' && s !== 'v1' && s !== 'v2' && s !== 'admin');
    
    if (segments.length > 0) {
      // Find the last segment that doesn't look like an ID (UUID or number)
      for (let i = segments.length - 1; i >= 0; i--) {
        const segment = segments[i];
        const isId = segment.length >= 24 || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || /^\d+$/.test(segment);
        if (!isId) {
          // Format: replace hyphens/underscores with spaces and capitalize
          return segment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
    }
  } catch (e) {
    // Ignore URL parsing errors
  }
  return 'Resource';
}

function getFriendlyErrorMessage(req: HttpRequest<any>, error: HttpErrorResponse): string {
  // If backend provided a specific message, use it
  if (error.error && typeof error.error.message === 'string') {
    // Exclude generic Node/Nest routing errors if they leak URLs
    if (!error.error.message.startsWith('Cannot ') && !error.error.message.includes('http')) {
      return error.error.message;
    }
  }
  
  const resource = extractResourceName(req.url);
  switch (req.method) {
    case 'GET': return `Failed to get ${resource.toLowerCase()}`;
    case 'POST': return `Failed to create ${resource.toLowerCase()}`;
    case 'PUT':
    case 'PATCH': return `Failed to update ${resource.toLowerCase()}`;
    case 'DELETE': return `Failed to delete ${resource.toLowerCase()}`;
    default: return `Operation failed`;
  }
}

function getFriendlySuccessMessage(req: HttpRequest<any>, res: HttpResponse<any>): string {
  // Use backend message if provided
  if (res.body && typeof res.body.message === 'string') {
    return res.body.message;
  }

  const resource = extractResourceName(req.url);
  switch (req.method) {
    case 'POST': return `${resource} created successfully`;
    case 'PUT':
    case 'PATCH': return `${resource} updated successfully`;
    case 'DELETE': return `${resource} deleted successfully`;
    default: return `Operation successful`;
  }
}

export const apiMessageInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          // Only show success messages for mutations
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            // Ignore 3xx/4xx/5xx statuses if they somehow get here, though usually they go to catchError
            if (event.status >= 200 && event.status < 300) {
              const msg = getFriendlySuccessMessage(req, event);
              toastService.showSuccess(msg);
            }
          }
        }
      },
    }),
    catchError((error: HttpErrorResponse) => {
      const msg = getFriendlyErrorMessage(req, error);
      toastService.showError(msg);
      return throwError(() => error);
    })
  );
};
