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
  alerts: [],
  recentActivity: [
    { id: 'ra1', text: 'Voucher claimed by Alex D.', time: '10 mins ago' },
    { id: 'ra2', text: 'New chat message from Sarah', time: '1 hour ago' },
    { id: 'ra3', text: 'Offer 20% Off Coffee expired', time: 'Yesterday' }
  ],
  myOffers: [
    {
      id: 'offer-m1',
      business_id: 'biz-1',
      title: '50% Off on Electronics',
      description: 'Get half price on all accessories.',
      offer_type: 'DISCOUNT',
      discount_value: 50,
      discount_type: 'PERCENTAGE',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      image_id: null,
      imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&auto=format&fit=crop&q=80',
      status: 'APPROVED',
      approved_by_id: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      businessName: 'BizzDeal HQ',
      businessLogoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'offer-m2',
      business_id: 'biz-1',
      title: '₹200 Cashback on ₹1000 spend',
      description: 'Spend 1000 and get 200 back.',
      offer_type: 'CASHBACK',
      discount_value: 200,
      discount_type: 'FIXED_AMOUNT',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      image_id: null,
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop&q=80',
      status: 'APPROVED',
      approved_by_id: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      businessName: 'BizzDeal HQ',
      businessLogoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'offer-m3',
      business_id: 'biz-1',
      title: '50% Off Electronics',
      description: 'Get half price on electronics accessories, pending admin approval.',
      offer_type: 'DISCOUNT',
      discount_value: 50,
      discount_type: 'PERCENTAGE',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      image_id: null,
      imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&auto=format&fit=crop&q=80',
      status: 'PENDING',
      approved_by_id: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      businessName: 'BizzDeal HQ',
      businessLogoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
    }
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
