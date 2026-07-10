import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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
  constructor() {}

  getDetailedAnalytics(): Observable<DetailedAnalyticsDto> {
    const mockData: DetailedAnalyticsDto = {
      kpis: {
        totalUsers: 51250,
        totalBusinesses: 3420,
        totalVouchersRedeemed: 42100,
        totalWalletVolume: 1250000
      },
      userGrowth: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        customers: [2000, 3500, 4100, 5800, 7200, 8900, 11000],
        members: [150, 200, 320, 450, 510, 680, 850]
      },
      voucherPerformance: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        issued: [5000, 7000, 8500, 10000, 12000, 14500, 16000],
        redeemed: [2000, 3100, 4200, 5800, 7500, 9100, 10400]
      },
      businessDistribution: {
        categories: ['Food & Beverage', 'Retail', 'Health & Wellness', 'Services', 'Entertainment'],
        counts: [1200, 850, 450, 600, 320]
      },
      walletVolume: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        credits: [50000, 65000, 80000, 95000, 120000, 140000, 180000],
        debits: [30000, 45000, 60000, 75000, 95000, 110000, 150000]
      },
      referralStats: {
        total: 15400,
        converted: 6200,
        conversionRate: 40.2
      }
    };
    return of(mockData).pipe(delay(600));
  }
}
