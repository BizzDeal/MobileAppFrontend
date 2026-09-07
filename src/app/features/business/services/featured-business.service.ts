import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import {
  FeaturedBusinessRequestDTO,
  CategoryLiveStatusDTO,
} from '../models/featured-business.model';

@Injectable({
  providedIn: 'root',
})
export class FeaturedBusinessService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/featured-business`;

  /**
   * Submit or update a featured business request (multipart/form-data)
   */
  submitRequest(formData: FormData): Observable<FeaturedBusinessRequestDTO> {
    return this.http
      .post<any>(`${this.apiUrl}/request`, formData, {
        context: new HttpContext().set(SHOW_SUCCESS_TOAST, true),
      })
      .pipe(map((res) => res?.data || res));
  }

  /**
   * Get authenticated member's own requests
   */
  getMyRequests(): Observable<FeaturedBusinessRequestDTO[]> {
    return this.http
      .get<any>(`${this.apiUrl}/my`)
      .pipe(map((res) => (Array.isArray(res) ? res : res?.data || [])));
  }

  /**
   * Check if a category has an active live featured business
   */
  getCategoryLiveStatus(categoryId: string): Observable<CategoryLiveStatusDTO> {
    return this.http
      .get<any>(`${this.apiUrl}/category-status/${categoryId}`)
      .pipe(map((res) => res?.data || res));
  }

  /**
   * Cancel a pending request
   */
  cancelRequest(id: string): Observable<FeaturedBusinessRequestDTO> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}/cancel`, {}, {
        context: new HttpContext().set(SHOW_SUCCESS_TOAST, true),
      })
      .pipe(map((res) => res?.data || res));
  }

  /**
   * Admin: List all requests
   */
  getAllRequests(query?: {
    status?: string;
    category_id?: string;
    business_id?: string;
  }): Observable<FeaturedBusinessRequestDTO[]> {
    let url = `${this.apiUrl}/admin/requests`;
    if (query) {
      const params = new URLSearchParams();
      if (query.status && query.status !== 'ALL') params.set('status', query.status);
      if (query.category_id) params.set('category_id', query.category_id);
      if (query.business_id) params.set('business_id', query.business_id);
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return this.http
      .get<any>(url)
      .pipe(map((res) => (Array.isArray(res) ? res : res?.data || [])));
  }

  /**
   * Admin: Approve request
   */
  approveRequest(id: string): Observable<FeaturedBusinessRequestDTO> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}/approve`, {}, {
        context: new HttpContext().set(SHOW_SUCCESS_TOAST, true),
      })
      .pipe(map((res) => res?.data || res));
  }

  /**
   * Admin: Reject request with reason
   */
  rejectRequest(id: string, reason: string): Observable<FeaturedBusinessRequestDTO> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}/reject`, { reason }, {
        context: new HttpContext().set(SHOW_SUCCESS_TOAST, true),
      })
      .pipe(map((res) => res?.data || res));
  }
}
