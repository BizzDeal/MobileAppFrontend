import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface DetailedAnalyticsDto {
  kpis: {
    totalUsers: number;
    totalBusinesses: number;
    totalVouchersRedeemed: number;
    totalWalletVolume: number;
  };
  userGrowth: {
    months: string[];
    customers: number[];
    members: number[];
  };
  voucherPerformance: {
    months: string[];
    issued: number[];
    redeemed: number[];
  };
  businessDistribution: {
    categories: string[];
    counts: number[];
  };
  walletVolume: {
    months: string[];
    credits: number[];
    debits: number[];
  };
  referralStats: {
    total: number;
    converted: number;
    conversionRate: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  constructor() {}

  getDetailedAnalytics(state?: string, district?: string): Observable<DetailedAnalyticsDto> {
    let params = new HttpParams();
    if (state) params = params.set('state', state);
    if (district) params = params.set('district', district);
    
    return this.http
      .get<DetailedAnalyticsDto | { success: boolean; data: DetailedAnalyticsDto }>(`${this.apiUrl}/analytics/detailed`, { params })
      .pipe(map((res: any) => res?.data || res));
  }

  syncAnalytics(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/analytics/sync`, {});
  }
}
