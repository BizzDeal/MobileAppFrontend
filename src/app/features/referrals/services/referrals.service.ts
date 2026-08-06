import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CreateReferralSlipDto, ReferralDTO, ReferralQueryDto, MemberBusinessDTO, AdminReferralQueryDto, AdminReferralResponse, AppreciateReferralDto } from '../models/referral.model';

@Injectable({
  providedIn: 'root',
})
export class ReferralsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getReferralSlips(query: ReferralQueryDto = {}): Observable<{ data: ReferralDTO[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    let params = new HttpParams();
    if (query.type) params = params.set('type', query.type);
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);

    return this.http.get<any>(`${this.apiUrl}/referrals`, { params }).pipe(
      map((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const meta = res.meta || res.data?.meta || { page: query.page || 1, limit: query.limit || 15, total: data.length, totalPages: 1 };
        return { data, meta };
      })
    );
  }

  getAdminReferralSlips(query: AdminReferralQueryDto = {}): Observable<AdminReferralResponse> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.referral_type) params = params.set('referral_type', query.referral_type);
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.start_date) params = params.set('start_date', query.start_date);
    if (query.end_date) params = params.set('end_date', query.end_date);
    if (query.dates) params = params.set('dates', query.dates);
    if (query.state_id) params = params.set('state_id', query.state_id);
    if (query.district_id) params = params.set('district_id', query.district_id);

    return this.http.get<AdminReferralResponse>(`${this.apiUrl}/referrals/admin`, { params });
  }



  createReferralSlip(dto: CreateReferralSlipDto): Observable<ReferralDTO> {
    return this.http.post<any>(`${this.apiUrl}/referrals`, dto, {
      context: new HttpContext().set(SHOW_SUCCESS_TOAST, true)
    }).pipe(
      map((res) => res.data?.data || res.data || res)
    );
  }

  searchMembers(searchQuery: string = '', districtId?: string, excludeDistricts?: string): Observable<MemberBusinessDTO[]> {
    let params = new HttpParams();
    if (searchQuery.trim()) {
      params = params.set('search', searchQuery.trim());
    }
    if (districtId) {
      params = params.set('districts', districtId);
    }
    if (excludeDistricts) {
      params = params.set('exclude_districts', excludeDistricts);
    }
    return this.http.get<any>(`${this.apiUrl}/users/members`, { params }).pipe(
      map((res) => Array.isArray(res.data) ? res.data : (res.data?.data || []))
    );
  }

  appreciateReferral(id: string, payload: AppreciateReferralDto): Observable<ReferralDTO> {
    return this.http.post<any>(`${this.apiUrl}/referrals/${id}/appreciate`, payload, {
      context: new HttpContext().set(SHOW_SUCCESS_TOAST, true)
    }).pipe(
      map((res) => res.data?.data || res.data || res)
    );
  }
}

