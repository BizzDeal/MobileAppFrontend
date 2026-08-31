import { Injectable, inject, signal, effect, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MemberDashboardData, MemberDashboardAnalytics } from '../models/member-dashboard.model';
import { OfferDTO, VoucherDTO } from '../models/home.model';
import { ProfileService } from '../../profile/services/profile.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { AppSocketService } from '../../../core/services/app-socket.service';
import { extractFriendlyErrorMessage } from '../../../core/utils/error.utils';

@Injectable({
  providedIn: 'root'
})
export class MemberDashboardService {
  private readonly http = inject(HttpClient);
  private readonly profileService = inject(ProfileService);
  private readonly authSession = inject(AuthSessionService);
  private readonly appSocket = inject(AppSocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = environment.apiUrl;

  private readonly _dashboardData = signal<MemberDashboardData | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly dashboardData = this._dashboardData.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.appSocket.connect();
    this.appSocket.onEvent('PLATFORM_SETTINGS_UPDATED')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.authSession.userRole() === 'MEMBER') {
          this.loadDashboardData().subscribe();
        }
      });

    effect(() => {
      const role = this.authSession.userRole();
      if (role === 'MEMBER') {
        untracked(() => {
          this.loadDashboardData().subscribe({
            error: (err) => console.error('Initial member dashboard load encountered error:', err),
          });
        });
      }
    });
  }

  loadDashboardData(): Observable<MemberDashboardData> {
    this._loading.set(true);
    this._error.set(null);

    return forkJoin({
      profile: this.http.get<any>(`${this.apiUrl}/users/profile`).pipe(catchError(() => of(null))),
      vouchers: this.http.get<any>(`${this.apiUrl}/vouchers/my`).pipe(catchError(() => of([]))),
      myOffers: this.http.get<any>(`${this.apiUrl}/offers/my`).pipe(catchError(() => of([]))),
      bizzCoinOffer: this.http.get<any>(`${this.apiUrl}/offers/bizz-coins/my`).pipe(catchError(() => of(null))),
      analytics: this.http.get<any>(`${this.apiUrl}/analytics/member/summary`).pipe(catchError(() => of(null)))
    }).pipe(
      map((response: any) => {
        const { myOffers: offersRes, vouchers: vouchersRes, analytics: analyticsRes, bizzCoinOffer: bizzCoinsRes } = response;
        const rawOffers: OfferDTO[] = Array.isArray(offersRes) ? offersRes : offersRes?.data || offersRes?.items || [];
        const rawVouchers: VoucherDTO[] = Array.isArray(vouchersRes) ? vouchersRes : vouchersRes?.data || vouchersRes?.items || [];
        const backendAnalytics = analyticsRes?.data || {};

        const profile = this.profileService.profile();
        const bizIdFromVouchers = rawVouchers.length > 0 ? rawVouchers[0].business_id : null;

        // With ?my_offers=true, the server returns only offers created by this member's business owner
        const myOffers = rawOffers.map(offer => ({
          ...offer,
          businessName: offer.businessName || profile?.business_name || undefined,
          businessLogoUrl: offer.businessLogoUrl || profile?.business_logo_url || undefined
        }));

        const rawBizzOffer = bizzCoinsRes?.data || bizzCoinsRes;
        const bizzCoinOffer: OfferDTO | null = (rawBizzOffer && rawBizzOffer.id)
          ? {
              ...rawBizzOffer,
              businessName: rawBizzOffer.businessName || profile?.business_name || undefined,
              businessLogoUrl: rawBizzOffer.businessLogoUrl || profile?.business_logo_url || undefined
            }
          : (myOffers.find(o => o.offer_type === 'BIZZ_COINS') || null);

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

        const successfulReferrals = backendAnalytics.successfulReferrals || 0;
        const referralsGiven = backendAnalytics.referralsGiven || 0;
        const referralsGivenCompleted = backendAnalytics.referralsGivenCompleted || 0;
        const givenBusinessValue = Number(backendAnalytics.givenBusinessValue || 0);
        const referralsReceived = backendAnalytics.referralsReceived || 0;
        const referralsReceivedCompleted = backendAnalytics.referralsReceivedCompleted || 0;
        const receivedBusinessValue = Number(backendAnalytics.receivedBusinessValue || 0);

        const districtStats = backendAnalytics.districtStats ? {
          totalBusinesses: backendAnalytics.districtStats.totalBusinesses || 0,
          totalMembers: backendAnalytics.districtStats.totalMembers || 0,
          totalVouchers: backendAnalytics.districtStats.totalVouchers || 0,
          revenue: backendAnalytics.districtStats.revenue || 0,
          totalReferrals: backendAnalytics.districtStats.totalReferrals || 0,
          totalBusinessValue: backendAnalytics.districtStats.totalBusinessValue || backendAnalytics.districtStats.revenue || 0,
          districtName: backendAnalytics.districtStats.districtName || profile?.district_name || 'Region',
        } : undefined;

        const analytics: MemberDashboardAnalytics = {
          activeOffersCount,
          vouchersRedeemedToday,
          vouchersRedeemedWeek,
          businessGrowth,
          successfulReferrals,
          referralsGiven,
          referralsGivenCompleted,
          givenBusinessValue,
          referralsReceived,
          referralsReceivedCompleted,
          receivedBusinessValue,
          districtStats
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
          myOffers,
          bizzCoinOffer
        };

        return dashboardData;
      }),
      tap({
        next: (data) => {
          this._dashboardData.set(data);
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = extractFriendlyErrorMessage(err, 'Failed to load member dashboard.');
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

