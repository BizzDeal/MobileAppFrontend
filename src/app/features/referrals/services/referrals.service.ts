import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ReferralDTO } from '../models/referral.model';

@Injectable({
  providedIn: 'root',
})
export class ReferralsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  findAll(): Observable<ReferralDTO[]> {
    return this.http.get<any>(`${this.apiUrl}/referrals`).pipe(
      map((res) => res.data || res)
    );
  }

  create(referredPhone: string, referralCode: string): Observable<ReferralDTO> {
    return this.http.post<any>(`${this.apiUrl}/referrals`, {
      referred_phone: referredPhone,
      referral_code: referralCode,
    }, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).pipe(
      map((res) => res.data || res)
    );
  }

  checkContacts(phones: string[]): Observable<string[]> {
    return this.http.post<any>(`${this.apiUrl}/referrals/check-contacts`, {
      phones,
    }).pipe(
      map((res) => res.data || res)
    );
  }

  bulkCreate(referredPhones: string[], referralCode: string): Observable<ReferralDTO[]> {
    return this.http.post<any>(`${this.apiUrl}/referrals/bulk`, {
      referred_phones: referredPhones,
      referral_code: referralCode,
    }, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).pipe(
      map((res) => res.data || res)
    );
  }
}
