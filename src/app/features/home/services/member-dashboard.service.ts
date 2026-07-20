import { Injectable, inject, signal, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MemberDashboardData, MemberDashboardAnalytics } from '../models/member-dashboard.model';
import { OfferDTO, VoucherDTO } from '../models/home.model';
import { ProfileService } from '../../profile/services/profile.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
@Injectable({
  providedIn: 'root'
})
export class MemberDashboardService {
  private readonly http = inject(HttpClient);
  private readonly profileService = inject(ProfileService);
  private readonly authSession = inject(AuthSessionService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _dashboardData = signal<MemberDashboardData | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly dashboardData = this._dashboardData.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    effect(() => {
      const role = this.authSession.userRole();
      if (role === 'MEMBER' || role === 'ADMIN') {
        untracked(() => {
          this.loadDashboardData().subscribe({
            error: (err) => console.error('Initial dashboard load failed:', err)
          });
        });
      }
    });
  }

  loadDashboardData(): Observable<MemberDashboardData> {
    this._loading.set(true);
    this._error.set(null);

    return forkJoin({
      offersRes: this.http.get<any>(`${this.apiUrl}/offers?my_offers=true`).pipe(
        catchError(() => of([]))
      ),
      vouchersRes: this.http.get<any>(`${this.apiUrl}/vouchers/history`).pipe(
        catchError(() => of([]))
      ),
      referralsRes: this.http.get<any>(`${this.apiUrl}/referrals`).pipe(
        catchError(() => of([]))
      )
    }).pipe(
      map((response: any) => {
        const { offersRes, vouchersRes, referralsRes } = response;
        const rawOffers: OfferDTO[] = Array.isArray(offersRes) ? offersRes : offersRes?.data || offersRes?.items || [];
        const rawVouchers: VoucherDTO[] = Array.isArray(vouchersRes) ? vouchersRes : vouchersRes?.data || vouchersRes?.items || [];
        const rawReferrals: any[] = Array.isArray(referralsRes) ? referralsRes : referralsRes?.data || referralsRes?.items || [];

        const profile = this.profileService.profile();
        const bizIdFromVouchers = rawVouchers.length > 0 ? rawVouchers[0].business_id : null;

        // With ?my_offers=true, the server returns only offers created by this member's business owner
        const myOffers = rawOffers.map(offer => ({
          ...offer,
          businessName: offer.businessName || profile?.business_name || undefined,
          businessLogoUrl: offer.businessLogoUrl || profile?.business_logo_url || undefined
        }));

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);

        const activeOffersCount = myOffers.filter(o => 
          o.status === 'APPROVED' && new Date(o.start_date) <= now && new Date(o.end_date) >= now
        ).length;

        const vouchersRedeemedToday = rawVouchers.filter(v => 
          v.status === 'REDEEMED' && v.redeemed_at && v.redeemed_at.startsWith(todayStr)
        ).length;

        const vouchersRedeemedWeek = rawVouchers.filter(v => 
          v.status === 'REDEEMED' && v.redeemed_at && new Date(v.redeemed_at) >= weekAgo
        ).length;

        const lastWeekCount = rawVouchers.filter(v => 
          v.status === 'REDEEMED' && v.redeemed_at && new Date(v.redeemed_at) >= twoWeeksAgo && new Date(v.redeemed_at) < weekAgo
        ).length;

        const businessGrowth = lastWeekCount > 0 
          ? Math.round(((vouchersRedeemedWeek - lastWeekCount) / lastWeekCount) * 100) 
          : (vouchersRedeemedWeek > 0 ? 100 : 0);

        const successfulReferrals = rawReferrals.length;

        const analytics: MemberDashboardAnalytics = {
          activeOffersCount,
          vouchersRedeemedToday,
          vouchersRedeemedWeek,
          businessGrowth,
          successfulReferrals
        };

        const dashboardData: MemberDashboardData = {
          businessName: profile?.business_name || 'My Business',
          businessLogoUrl: profile?.business_logo_url || '',
          analytics,
          alerts: [],
          recentActivity: rawVouchers.slice(0, 5).map(v => ({
            id: v.id,
            text: `Voucher ${v.voucher_code} ${v.status.toLowerCase()}`,
            time: v.updated_at || v.created_at
          })),
          myOffers
        };

        return dashboardData;
      }),
      tap({
        next: (data) => {
          this._dashboardData.set(data);
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to load member dashboard from server';
          this._error.set(errMsg);
          this._loading.set(false);
        }
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }
}

