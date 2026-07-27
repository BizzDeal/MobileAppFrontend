import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal, effect, untracked } from '@angular/core';
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
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { CustomerVouchersService } from '../../vouchers/services/customer-vouchers.service';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly profileService = inject(ProfileService);
  private readonly customerVouchersService = inject(CustomerVouchersService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _homeFeed = signal<CustomerHomeFeedDTO | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedCategory = signal<string>('ALL');

  readonly homeFeed = this._homeFeed.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();

  constructor() {
    effect(() => {
      const role = this.authSession.userRole();
      if (role === 'CUSTOMER') {
        untracked(() => {
          this.loadHomeFeed().subscribe({
            error: (err) => console.error('Initial home feed load encountered error:', err),
          });
        });
      }
    });
  }

  loadHomeFeed(categoryId: string = 'ALL'): Observable<CustomerHomeFeedDTO> {
    this._loading.set(true);
    this._error.set(null);

    const currentUser = this.authSession.currentUser();
    const currentProf = this.profileService.profile();

    const queryParam = categoryId !== 'ALL' ? `?category_id=${categoryId}` : '';

    return forkJoin({
      categories: this.http.get<any>(`${this.apiUrl}/businesses/categories`),
      featuredBusinesses: this.http.get<any>(`${this.apiUrl}/businesses/featured${queryParam}`),
      topBusinesses: this.http.get<any>(`${this.apiUrl}/businesses/top${queryParam}`),
      megaDeals: this.http.get<any>(`${this.apiUrl}/offers/mega${queryParam}`),
      trendingOffers: this.http.get<any>(`${this.apiUrl}/offers/trending${queryParam}`),
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
          district_id: b.district_id || '',
          is_featured: b.is_featured ?? true,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString(),
          categoryName: b.categoryName || b.category?.name || 'Partner Business',
          logoUrl: b.logoUrl || b.business_logo_url || null,
          bannerUrl: b.bannerUrl || b.banner_url || b.logoUrl || b.business_logo_url || null,
        }));

        // Map Top Businesses
        const topRaw: any[] = Array.isArray(res.topBusinesses) ? res.topBusinesses : res.topBusinesses?.data || res.topBusinesses?.items || [];
        const topBusinesses: BusinessDTO[] = topRaw.map((b) => ({
          id: b.id,
          owner_id: b.owner_id,
          category_id: b.category_id,
          name: b.name,
          description: b.description || null,
          website: b.website || null,
          gst_number: b.gst_number || null,
          logo_id: b.logo_id || null,
          status: b.status || 'ACTIVE',
          district_id: b.district_id || '',
          is_featured: b.is_featured ?? false,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString(),
          categoryName: b.categoryName || b.category?.name || 'Partner Business',
          logoUrl: b.logoUrl || b.business_logo_url || null,
          bannerUrl: b.bannerUrl || b.banner_url || b.logoUrl || b.business_logo_url || null,
        }));

        const claimedOfferIds = new Set(this.customerVouchersService.vouchers().map(v => v.offer_id));

        // Map Mega Deals
        const megaRaw: any[] = Array.isArray(res.megaDeals) ? res.megaDeals : res.megaDeals?.data || res.megaDeals?.items || [];
        const megaDeals: OfferDTO[] = megaRaw.map((o) => ({
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
          isClaimed: claimedOfferIds.has(o.id),
        }));

        // Map Trending Offers
        const trendingRaw: any[] = Array.isArray(res.trendingOffers) ? res.trendingOffers : res.trendingOffers?.data || res.trendingOffers?.items || [];
        const trendingOffers: OfferDTO[] = trendingRaw.map((o) => ({
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
          isClaimed: claimedOfferIds.has(o.id),
        }));

        const feedData: CustomerHomeFeedDTO = {
          categories,
          featuredBusinesses,
          topBusinesses,
          megaDeals,
          trendingOffers,
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
    const newCategory = this._selectedCategory() === categoryId ? 'ALL' : categoryId;
    this._selectedCategory.set(newCategory);
    this.loadHomeFeed(newCategory).subscribe();
  }

  claimOffer(offer: OfferDTO): Observable<VoucherDTO> {
    const feed = this._homeFeed();
    if (!feed) {
      return throwError(() => new Error('Home feed not initialized'));
    }

    return this.http.post<any>(`${this.apiUrl}/vouchers/issue`, { offer_id: offer.id }, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).pipe(
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
          redeemed_by_id: v.redeemed_by_id || null,
          created_at: v.created_at || new Date().toISOString(),
          updated_at: v.updated_at || new Date().toISOString(),
          offerTitle: v.offerTitle || offer.title,
          businessName: v.businessName || offer.businessName || 'BizzDeal Partner',
          discountText: v.discountText || (offer.offer_type === 'CASHBACK'
            ? `₹${offer.discount_value} Cashback`
            : offer.discount_type === 'PERCENTAGE' 
              ? `${offer.discount_value}% OFF` 
              : `₹${offer.discount_value} Flat OFF`),
        };

        const currentFeed = this._homeFeed();
        if (currentFeed) {
          const updatedMegaDeals = currentFeed.megaDeals.map(o => o.id === offer.id ? { ...o, isClaimed: true } : o);
          const updatedTrendingOffers = currentFeed.trendingOffers.map(o => o.id === offer.id ? { ...o, isClaimed: true } : o);

          this._homeFeed.set({
            ...currentFeed,
            megaDeals: updatedMegaDeals,
            trendingOffers: updatedTrendingOffers,
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

  searchBusinesses(query: string, page: number = 1, limit: number = 15): Observable<any> {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    return this.http.get<any>(`${this.apiUrl}/businesses/search?${params.toString()}`).pipe(
      map(res => {
        const dataRaw = Array.isArray(res) ? res : res.data || res.items || [];
        const meta = res.meta || { currentPage: page, totalPages: 1 };
        
        const mappedData: BusinessDTO[] = dataRaw.map((b: any) => ({
          id: b.id,
          owner_id: b.owner_id,
          category_id: b.category_id,
          name: b.name,
          description: b.description || null,
          website: b.website || null,
          gst_number: b.gst_number || null,
          logo_id: b.logo_id || null,
          status: b.status || 'ACTIVE',
          district_id: b.district_id || '',
          is_featured: b.is_featured ?? false,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString(),
          categoryName: b.categoryName || b.category?.name || 'Partner Business',
          logoUrl: b.logoUrl || b.business_logo_url || null,
          bannerUrl: b.bannerUrl || b.banner_url || b.logoUrl || b.business_logo_url || null,
        }));
        
        return { data: mappedData, meta };
      })
    );
  }

  searchOffers(query: string, page: number = 1, limit: number = 15): Observable<any> {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    return this.http.get<any>(`${this.apiUrl}/offers/search?${params.toString()}`).pipe(
      map(res => {
        const dataRaw = Array.isArray(res) ? res : res.data || res.items || [];
        const meta = res.meta || { currentPage: page, totalPages: 1 };
        const claimedOfferIds = new Set(this.customerVouchersService.vouchers().map(v => v.offer_id));
        
        const mappedData: OfferDTO[] = dataRaw.map((o: any) => ({
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
          isClaimed: claimedOfferIds.has(o.id),
        }));
        
        return { data: mappedData, meta };
      })
    );
  }
}
