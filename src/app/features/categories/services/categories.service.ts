import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BusinessCategoryDTO, CategoryMemberDTO, OfferDTO } from '../../home/models/home.model';
import { CustomerVouchersService } from '../../vouchers/services/customer-vouchers.service';
import { HomeService } from '../../home/services/home.service';
import { ProfileService } from '../../profile/services/profile.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { CategoryFilterType, CategorySortType } from '../models/category-view.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly homeService = inject(HomeService);
  private readonly customerVouchersService = inject(CustomerVouchersService);
  private readonly profileService = inject(ProfileService);
  private readonly authSession = inject(AuthSessionService);
  private readonly apiUrl = environment.apiUrl;

  readonly userDistrict = computed<string | null>(() => {
    const prof = this.profileService.profile();
    if (prof?.district_id) return prof.district_id;
    if (prof?.business_district_id) return prof.business_district_id;

    const authUser = this.authSession.currentUser();
    if (authUser?.district_id) return authUser.district_id;
    if (authUser?.business_district_id) return authUser.business_district_id;

    return null;
  });

  readonly userDistrictName = computed<string | null>(() => {
    const prof = this.profileService.profile();
    return prof?.district_name || prof?.primary_business_district_name || null;
  });

  private readonly _categories = signal<BusinessCategoryDTO[]>([]);
  private readonly _selectedCategoryId = signal<string>('ALL');
  private readonly _rawOffers = signal<OfferDTO[]>([]);
  private readonly _loadingCategories = signal<boolean>(false);
  private readonly _loadingOffers = signal<boolean>(false);
  private readonly _loadingMember = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  private readonly _searchQuery = signal<string>('');
  private readonly _filterType = signal<CategoryFilterType>('ALL');
  private readonly _sortType = signal<CategorySortType>('NEWEST');

  readonly categories = this._categories.asReadonly();
  readonly selectedCategoryId = this._selectedCategoryId.asReadonly();
  readonly loadingCategories = this._loadingCategories.asReadonly();
  readonly loadingOffers = this._loadingOffers.asReadonly();
  readonly loadingMember = this._loadingMember.asReadonly();
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
        member: null,
      };
    }
    return this._categories().find((c) => c.id === id) || null;
  });

  readonly selectedCategoryMember = computed<CategoryMemberDTO | null>(() => {
    const selected = this.selectedCategory();
    if (!selected || selected.id === 'ALL') {
      return null;
    }
    return selected.member || null;
  });

  constructor() {
    effect(() => {
      const district = this.userDistrict();
      untracked(() => {
        if (district) {
          this.loadCategories(district).subscribe();
          this.loadOffers(this._selectedCategoryId(), district).subscribe();
        }
      });
    });
  }

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

  loadCategories(districtId?: string): Observable<BusinessCategoryDTO[]> {
    this._loadingCategories.set(true);
    const district = districtId || this.userDistrict();
    const queryParam = district ? `?district=${encodeURIComponent(district)}` : '';

    return this.http.get<any>(`${this.apiUrl}/businesses/categories${queryParam}`).pipe(
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
            member: cat.member ? {
              id: cat.member.id,
              name: cat.member.name,
              business_name: cat.member.business_name,
              profile_pic_url: cat.member.profile_pic_url || null,
              phone: cat.member.phone || '',
              whatsapp: cat.member.whatsapp || cat.member.phone || '',
              website: cat.member.website || null,
              address: cat.member.address || null,
              district_name: cat.member.district_name || null,
              state_name: cat.member.state_name || null,
              owner_id: cat.member.owner_id,
              initials: cat.member.initials || 'BD',
              description: cat.member.description || null,
            } : null,
          }));
        return categories;
      }),
      tap({
        next: (cats) => {
          this._categories.set(cats);
          this._loadingCategories.set(false);
          // If a category was already selected and member was missing, check if now available
          const currentId = this._selectedCategoryId();
          if (currentId !== 'ALL') {
            const currentCat = cats.find((c) => c.id === currentId);
            if (!currentCat?.member) {
              this.loadMemberForCategory(currentId, district || undefined).subscribe();
            }
          }
        },
        error: (err) => {
          this._loadingCategories.set(false);
          this._error.set('Failed to load categories');
        },
      }),
      catchError((err) => of([]))
    );
  }

  loadMemberForCategory(categoryId: string, districtId?: string): Observable<CategoryMemberDTO | null> {
    if (!categoryId || categoryId === 'ALL') {
      return of(null);
    }
    const currentCat = this._categories().find((c) => c.id === categoryId);
    if (currentCat?.member) {
      return of(currentCat.member);
    }

    this._loadingMember.set(true);
    const queryParts: string[] = [`category_id=${encodeURIComponent(categoryId)}`];
    const district = districtId || this.userDistrict();
    if (district) {
      queryParts.push(`district=${encodeURIComponent(district)}`);
    }

    return this.http.get<any>(`${this.apiUrl}/businesses?${queryParts.join('&')}`).pipe(
      map((res) => {
        const list: any[] = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          const b = list[0];
          const ownerName = b.owner_name || 'Member';
          const initials = (ownerName || 'BD')
            .split(' ')
            .map((w: string) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          const member: CategoryMemberDTO = {
            id: b.id,
            name: ownerName,
            business_name: b.name,
            profile_pic_url: b.profile_pic_url || null,
            phone: b.phone || '',
            whatsapp: b.whatsapp || '',
            website: b.website || null,
            address: b.address || null,
            district_name: b.district_name || null,
            state_name: b.state_name || null,
            owner_id: b.owner_id,
            initials,
            description: b.description || null,
            banner_url: b.banner_url || null,
            bannerUrl: b.bannerUrl || null,
          };
          this._categories.update((cats) =>
            cats.map((c) => (c.id === categoryId ? { ...c, member } : c))
          );
          return member;
        }
        return null;
      }),
      tap({
        next: () => this._loadingMember.set(false),
        error: () => this._loadingMember.set(false),
      }),
      catchError(() => {
        this._loadingMember.set(false);
        return of(null);
      })
    );
  }

  loadOffers(categoryId: string = this._selectedCategoryId(), districtId?: string): Observable<OfferDTO[]> {
    this._loadingOffers.set(true);
    this._error.set(null);

    const queryParts: string[] = [];
    if (categoryId && categoryId !== 'ALL') {
      queryParts.push(`category_id=${encodeURIComponent(categoryId)}`);
    }
    const district = districtId || this.userDistrict();
    if (district) {
      queryParts.push(`district=${encodeURIComponent(district)}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    return this.http.get<any>(`${this.apiUrl}/offers${queryString}`).pipe(
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
          businessName: o.businessName || 'Partner Business',
          businessLogoUrl: o.businessLogoUrl || null,
          imageUrl: o.imageUrl || null,
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
    const district = this.userDistrict() || undefined;
    this.loadOffers(categoryId, district).subscribe();
    if (categoryId !== 'ALL') {
      const cat = this._categories().find((c) => c.id === categoryId);
      if (!cat?.member) {
        this.loadMemberForCategory(categoryId, district).subscribe();
      }
    }
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
