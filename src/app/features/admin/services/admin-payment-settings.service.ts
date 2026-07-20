import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../models/admin-user.model';

export interface PaymentSettings {
  id: number;
  upi_id: string;
  account_name: string;
  registration_fee: number;
  currency: string;
  card_title: string;
  card_subtitle: string;
  benefits: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminPaymentSettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/payment-settings`;

  getSettings(): Observable<PaymentSettings> {
    return this.http.get<PaymentSettings>(this.apiUrl);
  }

  updateSettings(settings: Omit<PaymentSettings, 'id'>): Observable<ApiResponse<PaymentSettings>> {
    return this.http.put<ApiResponse<PaymentSettings>>(this.apiUrl, settings, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) });
  }
}
