import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getMembers(): Observable<ApiResponse<AdminMember[]>> {
    return this.http.get<ApiResponse<AdminMember[]>>(`${this.apiUrl}/members`);
  }

  getCustomers(): Observable<ApiResponse<AdminCustomer[]>> {
    return this.http.get<ApiResponse<AdminCustomer[]>>(`${this.apiUrl}/customers`);
  }

  approveMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    return this.http.put<ApiResponse<{ memberId: string; status: UserStatus }>>(`${this.apiUrl}/approve-member`, { memberId });
  }

  rejectMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    return this.http.put<ApiResponse<{ memberId: string; status: UserStatus }>>(`${this.apiUrl}/reject-member`, { memberId });
  }

  suspendMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    return this.http.put<ApiResponse<{ memberId: string; status: UserStatus }>>(`${this.apiUrl}/suspend-member`, { memberId });
  }

  deleteMember(memberId: string): Observable<ApiResponse<null>> {
    return this.http.request<ApiResponse<null>>('delete', `${this.apiUrl}/member`, { body: { memberId } });
  }

  getUserById(id: string): Observable<ApiResponse<AdminMember | AdminCustomer | null>> {
    return this.http.get<ApiResponse<AdminMember | AdminCustomer | null>>(`${this.apiUrl}/${id}`);
  }
}

