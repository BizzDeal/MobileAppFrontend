import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  BusinessCategoryDTO,
  BusinessDTO,
  CustomerHomeFeedDTO,
  CustomerProfileDTO,
  OfferDTO,
  VoucherDTO,
  WalletDTO
} from '../models/home.model';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { ProfileService } from '../../profile/services/profile.service';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly profileService = inject(ProfileService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _homeFeed = signal<CustomerHomeFeedDTO | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedCategory = signal<string>('ALL');

  readonly homeFeed = this._homeFeed.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();

  readonly filteredTrendingOffers = computed(() => {
    const feed = this._homeFeed();
    const cat = this._selectedCategory();
    if (!feed) return [];
    if (cat === 'ALL') return feed.trendingOffers;
    const selectedCatObj = feed.categories.find(c => c.id === cat || c.slug === cat);
    return feed.trendingOffers.filter(offer => {
      const biz = feed.featuredBusinesses.find(b => b.id === offer.business_id) ||
                  feed.recommendedBusinesses.find(b => b.id === offer.business_id);
      if (biz && biz.category_id === cat) return true;
      if (selectedCatObj && biz && biz.categoryName && biz.categoryName.toLowerCase() === selectedCatObj.name.toLowerCase()) return true;
      if (selectedCatObj && biz && biz.categoryName && selectedCatObj.name.toLowerCase().includes(biz.categoryName.toLowerCase())) return true;
      return false;
    });
  });

  readonly filteredRecommendedBusinesses = computed(() => {
    const feed = this._homeFeed();
    const cat = this._selectedCategory();
    if (!feed) return [];
    if (cat === 'ALL') return feed.recommendedBusinesses;
    const selectedCatObj = feed.categories.find(c => c.id === cat || c.slug === cat);
    return feed.recommendedBusinesses.filter(biz => {
      if (biz.category_id === cat) return true;
      if (selectedCatObj && biz.categoryName && biz.categoryName.toLowerCase() === selectedCatObj.name.toLowerCase()) return true;
      if (selectedCatObj && biz.categoryName && selectedCatObj.name.toLowerCase().includes(biz.categoryName.toLowerCase())) return true;
      return false;
    });
  });

  constructor() {
    this.loadHomeFeed().subscribe({
      error: (err) => console.error('Initial home feed load encountered error:', err),
    });
  }

  loadHomeFeed(): Observable<CustomerHomeFeedDTO> {
    this._loading.set(true);
    this._error.set(null);

    const currentUser = this.authSession.currentUser();
    const currentProf = this.profileService.profile();
    const customer: CustomerProfileDTO = {
      id: currentProf?.id || currentUser?.id || 'unknown',
      name: currentProf?.full_name || currentUser?.full_name || 'Customer',
      phone: currentProf?.phone || currentUser?.phone || '',
      address: currentProf?.address || currentUser?.address || '',
    };

    return forkJoin({
      categories: this.http.get<any>(`${this.apiUrl}/businesses/categories`),
      featuredBusinesses: this.http.get<any>(`${this.apiUrl}/businesses/featured`),
      recommendedBusinesses: this.http.get<any>(`${this.apiUrl}/businesses`),
      offers: this.http.get<any>(`${this.apiUrl}/offers`),
      vouchers: this.http.get<any>(`${this.apiUrl}/vouchers/customer`),
      wallet: this.http.get<any>(`${this.apiUrl}/wallet/balance`),
      notifications: this.http.get<any>(`${this.apiUrl}/notifications`),
    }).pipe(
      map((res) => {
        // Map Categories
        const catListRaw: any[] = Array.isArray(res.categories) ? res.categories : res.categories?.data || res.categories?.items || [];
        const categories: BusinessCategoryDTO[] = catListRaw
          .filter((cat) => cat.is_active !== false)
          .map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || null,
            is_active: cat.is_active ?? true,
            created_at: cat.created_at || new Date().toISOString(),
            updated_at: cat.updated_at || new Date().toISOString(),
            icon: cat.icon || cat.slug,
            color: cat.color || undefined
          }));

        // Map Featured Businesses
        const featuredRaw: any[] = Array.isArray(res.featuredBusinesses) ? res.featuredBusinesses : res.featuredBusinesses?.data || res.featuredBusinesses?.items || [];
        const featuredBusinesses: BusinessDTO[] = featuredRaw.map((b) => ({
          id: b.id,
          owner_id: b.owner_id,
          category_id: b.category_id,
          name: b.name,
          description: b.description || null,
          website: b.website || null,
          gst_number: b.gst_number || null,
          logo_id: b.logo_id || null,
          status: b.status || 'ACTIVE',
          is_featured: b.is_featured ?? true,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString(),
          categoryName: b.categoryName || b.category?.name || 'Partner Business',
          logoUrl: b.logoUrl || b.business_logo_url || null,
          bannerUrl: b.bannerUrl || b.banner_url || null,
        }));

        // Map Recommended Businesses (Only featured businesses come under recommended businesses)
        const recRaw: any[] = Array.isArray(res.recommendedBusinesses) ? res.recommendedBusinesses : res.recommendedBusinesses?.data || res.recommendedBusinesses?.items || [];
        const allMappedBusinesses: BusinessDTO[] = recRaw.map((b) => ({
          id: b.id,
          owner_id: b.owner_id,
          category_id: b.category_id,
          name: b.name,
          description: b.description || null,
          website: b.website || null,
          gst_number: b.gst_number || null,
          logo_id: b.logo_id || null,
          status: b.status || 'ACTIVE',
          is_featured: b.is_featured ?? false,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString(),
          categoryName: b.categoryName || b.category?.name || 'Partner Business',
          logoUrl: b.logoUrl || b.business_logo_url || null,
          bannerUrl: b.bannerUrl || b.banner_url || null,
        }));

        const filteredRec = allMappedBusinesses.filter(b => b.is_featured === true || featuredBusinesses.some(fb => fb.id === b.id));
        const recommendedBusinesses: BusinessDTO[] = filteredRec.length > 0 ? filteredRec : (featuredBusinesses.length > 0 ? [...featuredBusinesses] : allMappedBusinesses);

        // Map Offers
        const offersRaw: any[] = Array.isArray(res.offers) ? res.offers : res.offers?.data || res.offers?.items || [];
        const allOffers: OfferDTO[] = offersRaw.map((o) => ({
          id: o.id,
          business_id: o.business_id,
          title: o.title,
          description: o.description || '',
          offer_type: o.offer_type || 'DISCOUNT',
          discount_value: o.discount_value ?? null,
          discount_type: o.discount_type || null,
          start_date: o.start_date || new Date().toISOString(),
          end_date: o.end_date || new Date().toISOString(),
          image_id: o.image_id || null,
          status: o.status || 'APPROVED',
          approved_by_id: o.approved_by_id || null,
          approved_at: o.approved_at || null,
          created_at: o.created_at || new Date().toISOString(),
          updated_at: o.updated_at || new Date().toISOString(),
          businessName: o.businessName || o.business?.name || 'Partner Business',
          businessLogoUrl: o.businessLogoUrl || o.business?.business_logo_url || o.business?.logoUrl || null,
          imageUrl: o.imageUrl || o.image_url || null,
        }));

        const megaDeals = allOffers.filter(o => 
          (o.discount_type === 'PERCENTAGE' && (o.discount_value || 0) >= 30) ||
          (o.discount_type === 'FIXED_AMOUNT' && (o.discount_value || 0) >= 500) ||
          featuredBusinesses.some(fb => fb.id === o.business_id)
        );
        const trendingOffers = allOffers;

        // Map Vouchers
        const vouchersRaw: any[] = Array.isArray(res.vouchers) ? res.vouchers : res.vouchers?.data || res.vouchers?.items || [];
        const myActiveVouchers: VoucherDTO[] = vouchersRaw.map((v) => ({
          id: v.id,
          voucher_code: v.voucher_code,
          offer_id: v.offer_id,
          customer_id: v.customer_id,
          business_id: v.business_id,
          status: v.status || 'ISSUED',
          issued_at: v.issued_at || new Date().toISOString(),
          redeemed_at: v.redeemed_at || null,
          expires_at: v.expires_at || new Date().toISOString(),
          redeemed_by_id: v.redeemed_by_id || null,
          created_at: v.created_at || new Date().toISOString(),
          updated_at: v.updated_at || new Date().toISOString(),
          offerTitle: v.offerTitle || v.offer?.title || 'Promotional Offer',
          businessName: v.businessName || v.business?.name || 'BizzDeal Partner',
          discountText: v.discountText || (v.offer?.discount_type === 'PERCENTAGE' ? `${v.offer.discount_value}% OFF` : v.offer?.discount_type === 'FIXED_AMOUNT' ? `₹${v.offer.discount_value} OFF` : 'Special Deal'),
        }));

        // Map Wallet
        const w = res.wallet?.data || res.wallet || {};
        const wallet: WalletDTO = {
          id: w.id || `wallet-${customer.id}`,
          user_id: w.user_id || customer.id,
          balance: Number(w.balance || 0),
          total_savings: Number(w.total_savings || 0),
          created_at: w.created_at || new Date().toISOString(),
          updated_at: w.updated_at || new Date().toISOString(),
        };

        // Map Notifications Count
        const notifRaw: any[] = Array.isArray(res.notifications) ? res.notifications : res.notifications?.data || res.notifications?.items || [];
        const unreadNotificationsCount = notifRaw.filter((n) => !n.is_read).length;

        const feedData: CustomerHomeFeedDTO = {
          customer,
          wallet,
          unreadNotificationsCount,
          categories,
          featuredBusinesses,
          megaDeals,
          trendingOffers,
          recommendedBusinesses,
          myActiveVouchers,
        };

        return feedData;
      }),
      tap({
        next: (feedData) => {
          this._homeFeed.set(feedData);
          this._loading.set(false);
        },
        error: (err) => {
          const errorMessage = err?.error?.message || err?.message || 'Failed to load customer home feed from server';
          this._error.set(errorMessage);
          this._loading.set(false);
        },
      }),
      catchError((err) => {
        // Explicitly re-throw error without swallowing or substituting fallback
        return throwError(() => err);
      })
    );
  }

  selectCategory(categoryId: string): void {
    if (this._selectedCategory() === categoryId) {
      this._selectedCategory.set('ALL');
    } else {
      this._selectedCategory.set(categoryId);
    }
  }

  claimOffer(offer: OfferDTO): Observable<VoucherDTO> {
    const feed = this._homeFeed();
    if (!feed) {
      return throwError(() => new Error('Home feed not initialized'));
    }

    return this.http.post<any>(`${this.apiUrl}/vouchers/issue`, { offer_id: offer.id }).pipe(
      map((res) => {
        const v = res?.data || res;
        const newVoucher: VoucherDTO = {
          id: v.id,
          voucher_code: v.voucher_code,
          offer_id: v.offer_id,
          customer_id: v.customer_id,
          business_id: v.business_id,
          status: v.status || 'ISSUED',
          issued_at: v.issued_at || new Date().toISOString(),
          redeemed_at: v.redeemed_at || null,
          expires_at: v.expires_at || offer.end_date,
          redeemed_by_id: v.redeemed_by_id || null,
          created_at: v.created_at || new Date().toISOString(),
          updated_at: v.updated_at || new Date().toISOString(),
          offerTitle: v.offerTitle || offer.title,
          businessName: v.businessName || offer.businessName || 'BizzDeal Partner',
          discountText: v.discountText || (offer.discount_type === 'PERCENTAGE' 
            ? `${offer.discount_value}% OFF` 
            : offer.discount_type === 'FIXED_AMOUNT' 
              ? `₹${offer.discount_value} OFF` 
              : 'Special Deal'),
        };

        const currentFeed = this._homeFeed();
        if (currentFeed) {
          this._homeFeed.set({
            ...currentFeed,
            myActiveVouchers: [newVoucher, ...currentFeed.myActiveVouchers],
          });
        }

        return newVoucher;
      }),
      catchError((err) => {
        const errorMessage = err?.error?.message || err?.message || 'Failed to claim deal via server API';
        this._error.set(errorMessage);
        return throwError(() => err);
      })
    );
  }
}
