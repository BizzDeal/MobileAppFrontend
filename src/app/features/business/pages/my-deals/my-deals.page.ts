import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  addCircleOutline,
  pricetagOutline,
  flameOutline,
  cashOutline,
  starOutline,
  calendarOutline,
  createOutline,
  timeOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  closeCircleOutline,
  refreshOutline,
  ribbonOutline,
  searchOutline,
  sparklesOutline,
  alertCircleOutline,
  filterOutline,
  funnelOutline,
  closeOutline,
  chevronDownOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { environment } from '../../../../../environments/environment';
import { OfferDTO } from '../../../home/models/home.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { ProfileService } from '../../../profile/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';

export type DealFilterKey = 'ALL' | 'ACTIVE' | 'TOP' | 'FLAT' | 'CASHBACK' | 'FEATURED' | 'PENDING' | 'EXPIRED' | 'REJECTED';

interface FilterOption {
  key: DealFilterKey;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-my-deals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    CachedImgDirective
  ],
  templateUrl: './my-deals.page.html',
  styleUrls: ['./my-deals.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyDealsPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly apiUrl = environment.apiUrl;

  readonly profile = this.profileService.profile;
  readonly deals = signal<OfferDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly searchQuery = signal<string>('');
  readonly activeFilter = signal<DealFilterKey>('ALL');

  readonly filterOptions: FilterOption[] = [
    { key: 'ALL', label: 'All Deals', icon: 'pricetag-outline' },
    { key: 'ACTIVE', label: 'Active / Approved', icon: 'checkmark-circle-outline' },
    { key: 'TOP', label: 'Top Deals (Percentage)', icon: 'flame-outline' },
    { key: 'FLAT', label: 'Flat Offers (Fixed ₹)', icon: 'pricetag-outline' },
    { key: 'CASHBACK', label: 'Cashback Rewards', icon: 'cash-outline' },
    { key: 'FEATURED', label: 'Featured Deals', icon: 'star-outline' },
    { key: 'PENDING', label: 'Pending Approval', icon: 'hourglass-outline' },
    { key: 'EXPIRED', label: 'Past / Expired', icon: 'time-outline' },
    { key: 'REJECTED', label: 'Rejected', icon: 'close-circle-outline' },
  ];

  readonly activeFilterOption = computed(() => {
    const key = this.activeFilter();
    return this.filterOptions.find(o => o.key === key) || this.filterOptions[0];
  });

  constructor() {
    addIcons({
      addOutline,
      addCircleOutline,
      pricetagOutline,
      flameOutline,
      cashOutline,
      starOutline,
      calendarOutline,
      createOutline,
      timeOutline,
      checkmarkCircleOutline,
      hourglassOutline,
      closeCircleOutline,
      refreshOutline,
      ribbonOutline,
      searchOutline,
      sparklesOutline,
      alertCircleOutline,
      filterOutline,
      funnelOutline,
      closeOutline,
      chevronDownOutline,
      checkmarkOutline
    });
  }

  ngOnInit(): void {
    this.loadDeals();
  }

  ionViewWillEnter(): void {
    this.loadDeals();
  }

  loadDeals(refresherEvent?: any): void {
    if (!refresherEvent) {
      this.loading.set(true);
    }
    this.error.set(null);

    this.http.get<any>(`${this.apiUrl}/offers/my`).pipe(
      map((res: any) => {
        const rawOffers: OfferDTO[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const profile = this.profile();
        return rawOffers.map(offer => ({
          ...offer,
          businessName: offer.businessName || profile?.business_name || undefined,
          businessLogoUrl: offer.businessLogoUrl || profile?.business_logo_url || undefined,
        }));
      }),
      catchError((err) => {
        this.error.set('Failed to load deals. Please try again.');
        return of([]);
      })
    ).subscribe({
      next: (offers) => {
        this.deals.set(offers);
        this.loading.set(false);
        if (refresherEvent) {
          refresherEvent.target.complete();
        }
      },
      error: () => {
        this.loading.set(false);
        if (refresherEvent) {
          refresherEvent.target.complete();
        }
      }
    });
  }

  handleRefresh(event: any): void {
    this.loadDeals(event);
  }

  setFilter(key: DealFilterKey): void {
    this.activeFilter.set(key);
  }

  resetFilter(): void {
    this.activeFilter.set('ALL');
  }

  async openFilterActionSheet(): Promise<void> {
    const counts = this.countsByFilter();
    const current = this.activeFilter();

    const buttons = this.filterOptions.map((opt) => {
      const isSelected = current === opt.key;
      return {
        text: `${opt.label} (${counts[opt.key] ?? 0})`,
        icon: opt.icon || (isSelected ? 'checkmark-outline' : undefined),
        cssClass: isSelected ? 'selected-sheet-option' : undefined,
        handler: () => {
          this.setFilter(opt.key);
        },
      };
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Filter Deals',
      subHeader: 'Select a filter category',
      buttons: [
        ...buttons,
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close-outline',
        },
      ],
    });

    await actionSheet.present();
  }

  onSearch(event: any): void {
    const query = event?.target?.value || '';
    this.searchQuery.set(query.trim().toLowerCase());
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  isDealExpired(deal: OfferDTO): boolean {
    if (deal.status === 'EXPIRED') return true;
    if (!deal.end_date) return false;
    return new Date(deal.end_date).getTime() < Date.now();
  }

  isDealActive(deal: OfferDTO): boolean {
    if (deal.status !== 'APPROVED') return false;
    return !this.isDealExpired(deal);
  }

  getStatusBadge(deal: OfferDTO): { label: string; class: string; icon: string } {
    if (deal.status === 'PENDING') {
      return { label: 'Pending Approval', class: 'status-pending', icon: 'hourglass-outline' };
    }
    if (deal.status === 'REJECTED') {
      return { label: 'Rejected', class: 'status-rejected', icon: 'close-circle-outline' };
    }
    if (this.isDealExpired(deal)) {
      return { label: 'Expired', class: 'status-expired', icon: 'time-outline' };
    }
    if (deal.status === 'APPROVED') {
      return { label: 'Approved', class: 'status-active', icon: 'checkmark-circle-outline' };
    }
    return { label: deal.status, class: 'status-other', icon: 'time-outline' };
  }

  getDiscountLabel(deal: OfferDTO): string {
    if (deal.offer_type === 'CASHBACK') {
      return deal.discount_value ? `₹${deal.discount_value} Cashback` : 'Cashback';
    }
    if (deal.discount_type === 'PERCENTAGE') {
      return `${deal.discount_value}% OFF`;
    }
    if (deal.discount_type === 'FIXED_AMOUNT') {
      return `₹${deal.discount_value} OFF`;
    }
    return 'Special Deal';
  }

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }

  readonly countsByFilter = computed(() => {
    const all = this.deals();
    const now = Date.now();

    let activeCount = 0;
    let topCount = 0;
    let flatCount = 0;
    let cashbackCount = 0;
    let featuredCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;
    let rejectedCount = 0;

    for (const d of all) {
      const isExp = d.status === 'EXPIRED' || (d.end_date && new Date(d.end_date).getTime() < now);
      if (d.status === 'APPROVED' && !isExp) activeCount++;
      if (d.status === 'PENDING') pendingCount++;
      if (d.status === 'REJECTED') rejectedCount++;
      if (isExp) expiredCount++;
      if (d.is_featured) featuredCount++;
      if (d.offer_type === 'DISCOUNT' && d.discount_type === 'PERCENTAGE') topCount++;
      if (d.offer_type === 'DISCOUNT' && d.discount_type === 'FIXED_AMOUNT') flatCount++;
      if (d.offer_type === 'CASHBACK') cashbackCount++;
    }

    return {
      ALL: all.length,
      ACTIVE: activeCount,
      TOP: topCount,
      FLAT: flatCount,
      CASHBACK: cashbackCount,
      FEATURED: featuredCount,
      PENDING: pendingCount,
      EXPIRED: expiredCount,
      REJECTED: rejectedCount,
    };
  });

  readonly filteredDeals = computed(() => {
    const all = this.deals();
    const filter = this.activeFilter();
    const query = this.searchQuery();

    return all.filter((deal) => {
      // 1. Search filter
      if (query) {
        const titleMatch = deal.title?.toLowerCase().includes(query);
        const descMatch = deal.description?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      // 2. Category / Status filter
      const isExp = this.isDealExpired(deal);
      switch (filter) {
        case 'ACTIVE':
          return deal.status === 'APPROVED' && !isExp;
        case 'TOP':
          return deal.offer_type === 'DISCOUNT' && deal.discount_type === 'PERCENTAGE';
        case 'FLAT':
          return deal.offer_type === 'DISCOUNT' && deal.discount_type === 'FIXED_AMOUNT';
        case 'CASHBACK':
          return deal.offer_type === 'CASHBACK';
        case 'FEATURED':
          return !!deal.is_featured;
        case 'PENDING':
          return deal.status === 'PENDING';
        case 'EXPIRED':
          return isExp;
        case 'REJECTED':
          return deal.status === 'REJECTED';
        case 'ALL':
        default:
          return true;
      }
    });
  });

  onCreateDeal(): void {
    if (this.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create offers');
      return;
    }
    this.router.navigate(['/offers/new']);
  }

  onEditDeal(deal: OfferDTO): void {
    this.router.navigate(['/offers', deal.id, 'edit']);
  }
}
