import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { MemberDashboardData } from '../models/member-dashboard.model';

const MOCK_MEMBER_DASHBOARD: MemberDashboardData = {
  businessName: 'BizzDeal HQ',
  businessLogoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
  analytics: {
    activeOffersCount: 3,
    vouchersRedeemedToday: 12,
    vouchersRedeemedWeek: 45,
    businessGrowth: 15,
    successfulReferrals: 4,
  },
  alerts: [
    {
      id: 'a1',
      type: 'warning',
      message: "Offer '50% Off Electronics' is pending Admin approval.",
      timestamp: new Date().toISOString(),
    },
    {
      id: 'a2',
      type: 'info',
      message: 'Upcoming meeting with Supplier at 2:00 PM today.',
      timestamp: new Date().toISOString(),
    }
  ],
  recentActivity: [
    { id: 'ra1', text: 'Voucher claimed by Alex D.', time: '10 mins ago' },
    { id: 'ra2', text: 'New chat message from Sarah', time: '1 hour ago' },
    { id: 'ra3', text: 'Offer 20% Off Coffee expired', time: 'Yesterday' }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class MemberDashboardService {
  private readonly _dashboardData = signal<MemberDashboardData | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly dashboardData = this._dashboardData.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.loadDashboardData().subscribe();
  }

  loadDashboardData(): Observable<MemberDashboardData> {
    this._loading.set(true);
    this._error.set(null);
    return of(MOCK_MEMBER_DASHBOARD).pipe(
      delay(500),
      tap({
        next: (data) => {
          this._dashboardData.set(data);
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err.message || 'Failed to load dashboard data');
          this._loading.set(false);
        }
      })
    );
  }
}
