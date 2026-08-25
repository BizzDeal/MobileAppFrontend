import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BusinessCategoryDTO, OfferDTO } from '../../home/models/home.model';
import { CustomerVouchersService } from '../../vouchers/services/customer-vouchers.service';
import { HomeService } from '../../home/services/home.service';
import { CategoryFilterType, CategorySortType } from '../models/category-view.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly homeService = inject(HomeService);
  private readonly customerVouchersService = inject(CustomerVouchersService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _categories = signal<BusinessCategoryDTO[]>([]);
  private readonly _selectedCategoryId = signal<string>('ALL');
  private readonly _rawOffers = signal<OfferDTO[]>([]);
  private readonly _loadingCategories = signal<boolean>(false);
  private readonly _loadingOffers = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  private readonly _searchQuery = signal<string>('');
  private readonly _filterType = signal<CategoryFilterType>('ALL');
  private readonly _sortType = signal<CategorySortType>('NEWEST');

  readonly categories = this._categories.asReadonly();
  readonly selectedCategoryId = this._selectedCategoryId.asReadonly();
  readonly loadingCategories = this._loadingCategories.asReadonly();
  readonly loadingOffers = this._loadingOffers.asReadonly();
  readonly error = this._error.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly filterType = this._filterType.asReadonly();
  readonly sortType = this._sortType.asReadonly();

  readonly selectedCategory = computed<BusinessCategoryDTO | null>(() => {
    const id = this._selectedCategoryId();
    if (id === 'ALL') {
      return {
        id: 'ALL',
        name: 'All Categories',
        slug: 'all-categories',
        description: 'Explore deals & offers from all categories',
        icon: '🛍️',
        is_active: true,
        created_at: '',
        updated_at: '',
      };
    }
    return this._categories().find((c) => c.id === id) || null;
  });

  readonly filteredOffers = computed<OfferDTO[]>(() => {
    let list = this._rawOffers();
    const query = this._searchQuery().toLowerCase().trim();
    const filter = this._filterType();
    const sort = this._sortType();

    // 1. Search Query
    if (query) {
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(query) ||
          (o.description && o.description.toLowerCase().includes(query)) ||
          (o.businessName && o.businessName.toLowerCase().includes(query))
      );
    }

    // 2. Offer Type / Discount Filter
    if (filter === 'PERCENTAGE') {
      list = list.filter(
        (o) => o.offer_type === 'DISCOUNT' && o.discount_type === 'PERCENTAGE'
      );
    } else if (filter === 'FIXED') {
      list = list.filter(
        (o) =>
          o.offer_type === 'DISCOUNT' &&
          (o.discount_type === 'FIXED_AMOUNT' || (o.discount_type as string) === 'FIXED')
      );
    } else if (filter === 'CASHBACK') {
      list = list.filter((o) => o.offer_type === 'CASHBACK');
    }

    // 3. Sorting
    const sorted = [...list];
    if (sort === 'DISCOUNT_DESC') {
      sorted.sort((a, b) => (b.discount_value || 0) - (a.discount_value || 0));
    } else if (sort === 'TITLE_ASC') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // NEWEST
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return sorted;
  });

  loadCategories(): Observable<BusinessCategoryDTO[]> {
    this._loadingCategories.set(true);
    return this.http.get<any>(`${this.apiUrl}/businesses/categories`).pipe(
      map((res) => {
        const rawList: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const categories: BusinessCategoryDTO[] = rawList
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
            color: cat.color || undefined,
          }));
        return categories;
      }),
      tap({
        next: (cats) => {
          this._categories.set(cats);
          this._loadingCategories.set(false);
        },
        error: (err) => {
          this._loadingCategories.set(false);
          this._error.set('Failed to load categories');
        },
      }),
      catchError((err) => of([]))
    );
  }

  loadOffers(categoryId: string = this._selectedCategoryId()): Observable<OfferDTO[]> {
    this._loadingOffers.set(true);
    this._error.set(null);

    const queryParam = categoryId && categoryId !== 'ALL' ? `?category_id=${categoryId}` : '';

    return this.http.get<any>(`${this.apiUrl}/offers${queryParam}`).pipe(
      map((res) => {
        const dataRaw: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const claimedOfferIds = new Set(
          this.customerVouchersService.vouchers().map((v) => v.offer_id)
        );

        const mapped: OfferDTO[] = dataRaw.map((o: any) => ({
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
          businessLogoUrl:
            o.businessLogoUrl ||
            o.business?.business_logo_url ||
            o.business?.logoUrl ||
            null,
          imageUrl: o.imageUrl || o.image_url || null,
          isClaimed: claimedOfferIds.has(o.id),
        }));

        return mapped;
      }),
      tap({
        next: (offers) => {
          this._rawOffers.set(offers);
          this._loadingOffers.set(false);
        },
        error: (err) => {
          this._loadingOffers.set(false);
          this._error.set('Failed to load deals for this category');
        },
      }),
      catchError((err) => {
        this._loadingOffers.set(false);
        return of([]);
      })
    );
  }

  selectCategory(categoryId: string): void {
    this._selectedCategoryId.set(categoryId);
    this.loadOffers(categoryId).subscribe();
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  setFilterType(type: CategoryFilterType): void {
    this._filterType.set(type);
  }

  setSortType(sort: CategorySortType): void {
    this._sortType.set(sort);
  }

  claimOffer(offer: OfferDTO): Observable<any> {
    return this.homeService.claimOffer(offer).pipe(
      tap(() => {
        // Mark offer as claimed in raw offers
        const updated = this._rawOffers().map((o) =>
          o.id === offer.id ? { ...o, isClaimed: true } : o
        );
        this._rawOffers.set(updated);
      })
    );
  }
}
