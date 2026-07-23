import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminMember,
  AdminCustomer,
  ApiResponse,
  UserStatus,
  AdminUser,
} from '../models/admin-user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getMembers(page = 1, limit = 20, search = ''): Observable<ApiResponse<AdminMember[]>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<AdminMember[]>>(`${this.apiUrl}/members`, { params });
  }

  getCustomers(page = 1, limit = 20, search = ''): Observable<ApiResponse<AdminCustomer[]>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<AdminCustomer[]>>(`${this.apiUrl}/customers`, { params });
  }

  approveMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    return this.http.put<ApiResponse<{ memberId: string; status: UserStatus }>>(`${this.apiUrl}/approve-member`, { memberId }, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) });
  }

  rejectMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    return this.http.put<ApiResponse<{ memberId: string; status: UserStatus }>>(`${this.apiUrl}/reject-member`, { memberId }, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) });
  }

  suspendMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    return this.http.put<ApiResponse<{ memberId: string; status: UserStatus }>>(`${this.apiUrl}/suspend-member`, { memberId }, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) });
  }

  deleteMember(memberId: string): Observable<ApiResponse<null>> {
    return this.http.request<ApiResponse<null>>('delete', `${this.apiUrl}/member`, { body: { memberId }, context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) });
  }

  getUserById(id: string): Observable<ApiResponse<AdminMember | AdminCustomer | null>> {
    return this.http.get<ApiResponse<AdminMember | AdminCustomer | null>>(`${this.apiUrl}/${id}`);
  }
}

