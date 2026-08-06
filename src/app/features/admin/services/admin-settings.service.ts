import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PlatformSettings {
  id?: string;
  mega_deals_percent_threshold: number;
  mega_deals_fixed_threshold: number;
  home_feed_limit: number;
}

export interface PlatformSettingsResponse {
  success: boolean;
  data: PlatformSettings;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSettingsService {
  private readonly apiUrl = `${environment.apiUrl}/settings/platform`;

  constructor(private readonly http: HttpClient) {}

  getSettings(): Observable<PlatformSettingsResponse> {
    return this.http.get<PlatformSettingsResponse>(this.apiUrl);
  }

  updateSettings(data: Partial<PlatformSettings>): Observable<PlatformSettingsResponse> {
    return this.http.put<PlatformSettingsResponse>(this.apiUrl, data, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) });
  }

  getStates(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/locations/states`);
  }

  getDistricts(stateId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/locations/states/${stateId}/districts`);
  }

  clearSystemCache(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}/settings/cache/clear`, 
      {},
      { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }
    );
  }
}
