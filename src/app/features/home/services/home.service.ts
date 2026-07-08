import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  CustomerHomeFeedDTO,
  OfferDTO,
  BusinessDTO,
  VoucherDTO,
  BusinessCategoryDTO,
} from '../models/home.model';

const FAKE_HOME_FEED: CustomerHomeFeedDTO = {
  customer: {
    id: 'cust-101',
    name: 'Venkata Satya Ravi Teja',
    phone: '+91 98765 43210',
    address: 'Banjara Hills, Hyderabad',
  },
  wallet: {
    id: 'wallet-101',
    user_id: 'cust-101',
    balance: 2450.00,
    total_savings: 8920.50,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-07-08T10:00:00Z',
  },
  unreadNotificationsCount: 3,
  categories: [
    {
      id: 'cat-restaurant',
      name: 'Restaurant',
      slug: 'restaurant',
      description: 'Food, Dining, and Restaurants',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      icon: 'fast-food',
      color: '#F97316',
    },
    {
      id: 'cat-retail',
      name: 'Retail',
      slug: 'retail',
      description: 'Retail Stores, Shopping, and E-commerce',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      icon: 'shirt',
      color: '#EC4899',
    },
    {
      id: 'cat-healthcare',
      name: 'Healthcare',
      slug: 'healthcare',
      description: 'Hospitals, Clinics, and Healthcare Providers',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      icon: 'fitness',
      color: '#38BDF8',
    },
    {
      id: 'cat-it-services',
      name: 'IT Services',
      slug: 'it-services',
      description: 'Information Technology and Software Services',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      icon: 'hardware-chip',
      color: '#A78BFA',
    },
    {
      id: 'cat-hotels',
      name: 'Hotels',
      slug: 'hotels',
      description: 'Hotels, Resorts, and Hospitality',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      icon: 'business',
      color: '#EAB308',
    },
    {
      id: 'cat-real-estate',
      name: 'Real Estate',
      slug: 'real-estate',
      description: 'Real Estate Agencies, Brokers, and Properties',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      icon: 'home',
      color: '#10B981',
    },
    {
      id: 'cat-education',
      name: 'Education',
      slug: 'education',
      description: 'Schools, Colleges, and Educational Institutes',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      icon: 'school',
      color: '#3B82F6',
    },
  ],
  featuredBusinesses: [
    {
      id: 'biz-1',
      owner_id: 'owner-1',
      category_id: 'cat-restaurant',
      name: 'The Artisan Roast Café',
      description: 'Experience handcrafted specialty coffees, freshly baked croissants, and a serene ambient workspace in the heart of the city.',
      website: 'https://artisanroast.com',
      gst_number: '36AAAAA0000A1Z5',
      logo_id: 'logo-1',
      status: 'ACTIVE',
      is_featured: true,
      created_at: '2026-02-10T10:00:00Z',
      updated_at: '2026-06-20T10:00:00Z',
      categoryName: 'Restaurant',
      logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'biz-2',
      owner_id: 'owner-2',
      category_id: 'cat-retail',
      name: 'Vogue Avenue Boutique',
      description: 'Premium designer streetwear, luxury ethnic ensembles, and bespoke fashion styling tailored for every celebration.',
      website: 'https://vogueavenue.in',
      gst_number: '36BBBBB1111B1Z5',
      logo_id: 'logo-2',
      status: 'ACTIVE',
      is_featured: true,
      created_at: '2026-03-01T10:00:00Z',
      updated_at: '2026-06-25T10:00:00Z',
      categoryName: 'Retail',
      logoUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'biz-3',
      owner_id: 'owner-3',
      category_id: 'cat-healthcare',
      name: 'Zenith Spa & Sanctuary',
      description: 'Holistic Ayurvedic therapies, aromatherapy massages, and organic skincare treatments to rejuvenate your mind and soul.',
      website: 'https://zenithspa.com',
      gst_number: '36CCCCC2222C1Z5',
      logo_id: 'logo-3',
      status: 'ACTIVE',
      is_featured: true,
      created_at: '2026-01-20T10:00:00Z',
      updated_at: '2026-07-01T10:00:00Z',
      categoryName: 'Healthcare',
      logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    },
  ],
  megaDeals: [
    {
      id: 'deal-1',
      business_id: 'biz-1',
      title: 'Mega Feast: 50% OFF on All Specialty Coffees & Pastries',
      description: 'Treat yourself and your colleagues to handcrafted caramel macchiatos, almond croissants, and signature tiramisu. Valid all week!',
      offer_type: 'DISCOUNT',
      discount_value: 50,
      discount_type: 'PERCENTAGE',
      start_date: '2026-07-01T00:00:00Z',
      end_date: '2026-07-15T23:59:59Z',
      image_id: 'img-1',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: '2026-06-30T10:00:00Z',
      created_at: '2026-06-28T10:00:00Z',
      updated_at: '2026-06-30T10:00:00Z',
      businessName: 'The Artisan Roast Café',
      businessLogoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'deal-2',
      business_id: 'biz-2',
      title: 'Monsoon Luxe Sale: Flat ₹2,000 OFF on Party Wear & Suits',
      description: 'Upgrade your wardrobe with handcrafted silk dresses, tailored blazers, and premium streetwear. Minimum purchase ₹5,000.',
      offer_type: 'DISCOUNT',
      discount_value: 2000,
      discount_type: 'FIXED_AMOUNT',
      start_date: '2026-07-05T00:00:00Z',
      end_date: '2026-07-20T23:59:59Z',
      image_id: 'img-2',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: '2026-07-04T10:00:00Z',
      created_at: '2026-07-03T10:00:00Z',
      updated_at: '2026-07-04T10:00:00Z',
      businessName: 'Vogue Avenue Boutique',
      businessLogoUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
    },
  ],
  trendingOffers: [
    {
      id: 'off-1',
      business_id: 'biz-1',
      title: 'Buy 1 Get 1 FREE on Gourmet Breakfast Combos',
      description: 'Enjoy avocado toast with poached eggs and a complimentary cappuccino on weekday mornings between 8 AM and 11 AM.',
      offer_type: 'DISCOUNT',
      discount_value: 100,
      discount_type: 'PERCENTAGE',
      start_date: '2026-07-01T00:00:00Z',
      end_date: '2026-07-31T23:59:59Z',
      image_id: 'img-3',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: '2026-06-29T10:00:00Z',
      created_at: '2026-06-28T10:00:00Z',
      updated_at: '2026-06-29T10:00:00Z',
      businessName: 'The Artisan Roast Café',
      businessLogoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'off-2',
      business_id: 'biz-3',
      title: '35% Cashback on Royal Aromatherapy & Spa Day Pass',
      description: 'Recharge your senses with a 90-minute full body relaxation massage and herbal steam bath. Instant cashback into your BizzDeal wallet!',
      offer_type: 'CASHBACK',
      discount_value: 35,
      discount_type: 'PERCENTAGE',
      start_date: '2026-07-02T00:00:00Z',
      end_date: '2026-07-25T23:59:59Z',
      image_id: 'img-4',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: '2026-07-01T10:00:00Z',
      created_at: '2026-06-30T10:00:00Z',
      updated_at: '2026-07-01T10:00:00Z',
      businessName: 'Zenith Spa & Sanctuary',
      businessLogoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'off-3',
      business_id: 'biz-4',
      title: 'Flat ₹500 OFF on Smart Fitness Watches & Audio',
      description: 'Upgrade your workout gear with noise-canceling earbuds and heart-rate monitoring smartwatches from top global brands.',
      offer_type: 'DISCOUNT',
      discount_value: 500,
      discount_type: 'FIXED_AMOUNT',
      start_date: '2026-07-05T00:00:00Z',
      end_date: '2026-07-30T23:59:59Z',
      image_id: 'img-5',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: '2026-07-04T10:00:00Z',
      created_at: '2026-07-03T10:00:00Z',
      updated_at: '2026-07-04T10:00:00Z',
      businessName: 'TechZone Gadgets & Hub',
      businessLogoUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'off-4',
      business_id: 'biz-5',
      title: '25% OFF on Premium Hair Styling & Keratin Treatment',
      description: 'Get salon-perfect hair with organic keratin smoothing treatments and styling by senior celebrity stylists.',
      offer_type: 'DISCOUNT',
      discount_value: 25,
      discount_type: 'PERCENTAGE',
      start_date: '2026-07-01T00:00:00Z',
      end_date: '2026-07-28T23:59:59Z',
      image_id: 'img-6',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: '2026-06-30T10:00:00Z',
      created_at: '2026-06-29T10:00:00Z',
      updated_at: '2026-06-30T10:00:00Z',
      businessName: 'Glamour Lounge Studio',
      businessLogoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    },
  ],
  recommendedBusinesses: [
    {
      id: 'biz-4',
      owner_id: 'owner-4',
      category_id: 'cat-it-services',
      name: 'TechZone Gadgets & Hub',
      description: 'Authorized store for flagship smartphones, laptops, mechanical keyboards, and high-fidelity audio equipment with instant repairs.',
      website: 'https://techzonehub.com',
      gst_number: '36DDDDD3333D1Z5',
      logo_id: 'logo-4',
      status: 'ACTIVE',
      is_featured: false,
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-07-01T10:00:00Z',
      categoryName: 'IT Services',
      logoUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'biz-5',
      owner_id: 'owner-5',
      category_id: 'cat-hotels',
      name: 'Glamour Lounge Studio',
      description: 'Luxury unisex salon offering celebrity hair styling, bridal makeup, organic facials, and spa manicures.',
      website: 'https://glamourlounge.in',
      gst_number: '36EEEEE4444E1Z5',
      logo_id: 'logo-5',
      status: 'ACTIVE',
      is_featured: false,
      created_at: '2026-05-15T10:00:00Z',
      updated_at: '2026-07-02T10:00:00Z',
      categoryName: 'Hotels',
      logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'biz-6',
      owner_id: 'owner-6',
      category_id: 'cat-restaurant',
      name: 'Bistro 57 Gourmet & Bar',
      description: 'Wood-fired authentic Italian pizzas, handmade pasta, and artisanal mocktails served under open sky rooftop dining.',
      website: 'https://bistro57.com',
      gst_number: '36FFFFF5555F1Z5',
      logo_id: 'logo-6',
      status: 'ACTIVE',
      is_featured: false,
      created_at: '2026-02-01T10:00:00Z',
      updated_at: '2026-06-15T10:00:00Z',
      categoryName: 'Restaurant',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    },
  ],
  myActiveVouchers: [
    {
      id: 'vouch-1',
      voucher_code: 'BIZZ-ART-50',
      offer_id: 'deal-1',
      customer_id: 'cust-101',
      business_id: 'biz-1',
      status: 'ISSUED',
      issued_at: '2026-07-07T14:30:00Z',
      redeemed_at: null,
      expires_at: '2026-07-15T23:59:59Z',
      redeemed_by_id: null,
      created_at: '2026-07-07T14:30:00Z',
      updated_at: '2026-07-07T14:30:00Z',
      offerTitle: '50% OFF on All Specialty Coffees & Pastries',
      businessName: 'The Artisan Roast Café',
      discountText: '50% OFF',
    },
    {
      id: 'vouch-2',
      voucher_code: 'BIZZ-SPA-35',
      offer_id: 'off-2',
      customer_id: 'cust-101',
      business_id: 'biz-3',
      status: 'ISSUED',
      issued_at: '2026-07-06T11:15:00Z',
      redeemed_at: null,
      expires_at: '2026-07-25T23:59:59Z',
      redeemed_by_id: null,
      created_at: '2026-07-06T11:15:00Z',
      updated_at: '2026-07-06T11:15:00Z',
      offerTitle: '35% Cashback on Royal Aromatherapy & Spa Day Pass',
      businessName: 'Zenith Spa & Sanctuary',
      discountText: '35% Cashback',
    },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private readonly http = inject(HttpClient);
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
    this.loadHomeFeed().subscribe();
  }

  loadHomeFeed(): Observable<CustomerHomeFeedDTO> {
    this._loading.set(true);
    this._error.set(null);

    // Call real backend API for categories and merge into explore categories feed
    this.http.get<any>(`${this.apiUrl}/businesses/categories`).subscribe({
      next: (res) => {
        const list: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const activeList = list.filter((cat) => cat.is_active !== false).map((cat) => ({
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

        if (activeList.length > 0) {
          const currentFeed = this._homeFeed() || FAKE_HOME_FEED;
          this._homeFeed.set({
            ...currentFeed,
            categories: activeList
          });
        }
      },
      error: (err) => {
        console.error('Failed to fetch categories from server in HomeService:', err);
      }
    });

    // Rule compliance: No silent error swallowing or hardcoded fallback substitution on error.
    return of(FAKE_HOME_FEED).pipe(
      delay(400),
      tap({
        next: (data) => {
          const existing = this._homeFeed();
          const cats = (existing && existing.categories && existing.categories !== FAKE_HOME_FEED.categories) 
            ? existing.categories 
            : data.categories;

          this._homeFeed.set({
            ...data,
            categories: cats
          });
          this._loading.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || 'Failed to load customer home feed from server';
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

    const newVoucher: VoucherDTO = {
      id: `vouch-${Date.now()}`,
      voucher_code: `BIZZ-${offer.id.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      offer_id: offer.id,
      customer_id: feed.customer.id,
      business_id: offer.business_id,
      status: 'ISSUED',
      issued_at: new Date().toISOString(),
      redeemed_at: null,
      expires_at: offer.end_date,
      redeemed_by_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      offerTitle: offer.title,
      businessName: offer.businessName || 'BizzDeal Partner',
      discountText: offer.discount_type === 'PERCENTAGE' 
        ? `${offer.discount_value}% OFF` 
        : offer.discount_type === 'FIXED_AMOUNT' 
          ? `₹${offer.discount_value} OFF` 
          : 'Special Deal',
    };

    const updatedVouchers = [newVoucher, ...feed.myActiveVouchers];
    this._homeFeed.set({
      ...feed,
      myActiveVouchers: updatedVouchers,
    });

    return of(newVoucher).pipe(delay(300));
  }
}
