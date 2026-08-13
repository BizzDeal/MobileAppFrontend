import { Component, OnInit, OnDestroy, HostListener, signal, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonBadge,
  IonButton,
  IonButtons,
  IonModal,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shareSocialOutline,
  searchOutline,
  filterOutline,
  peopleOutline,
  star,
  starOutline,
  callOutline,
  mailOutline,
  locationOutline,
  closeOutline,
  checkmarkCircleOutline,
  arrowForwardOutline,
  briefcaseOutline,
  alertCircleOutline,
  cardOutline,
  heart,
  heartOutline,
  cashOutline,
  trophyOutline,
  personCircleOutline,
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { ReferralsService } from '../../../referrals/services/referrals.service';
import { AdminReferralsStateService } from '../../services/admin-referrals-state.service';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { ReferralDTO, ReferralType, AdminReferralSummary } from '../../../referrals/models/referral.model';
import { ListSkeletonComponent } from '../../../../shared/components/skeletons/list-skeleton/list-skeleton.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-admin-referrals',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonButton,
    IonButtons,
    IonModal,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSkeletonText,
    ListSkeletonComponent
  ],
  templateUrl: './admin-referrals.page.html',
  styleUrls: ['./admin-referrals.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminReferralsPage implements OnInit, OnDestroy {
  private readonly referralsService = inject(ReferralsService);
  private readonly adminReferralsStateService = inject(AdminReferralsStateService);

  readonly referrals = signal<ReferralDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<AdminReferralSummary>({ 
    totalCount: 0, 
    inhouseCount: 0, 
    outhouseCount: 0,
    totalAppreciations: 0,
    totalAppreciationRevenue: 0 
  });

  // Filtering & Pagination State
  readonly searchQuery = signal<string>('');
  readonly selectedType = signal<string>('ALL'); // ALL, INHOUSE, OUTHOUSE
  readonly hasMore = signal<boolean>(false);
  
  // Desktop / Mobile view detection
  isDesktop = window.innerWidth >= 992;
  currentPage = 1;
  limit = this.isDesktop ? 5 : 15;
  totalPages = 1;
  private isLoadingMore = false;

  filterState: { startDate: string | null, endDate: string | null, dates?: string | null, stateId: string | null, districtId: string | null } = { startDate: null, endDate: null, dates: null, stateId: null, districtId: null };

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  // Modal State
  readonly selectedReferral = signal<ReferralDTO | null>(null);
  readonly isModalOpen = signal<boolean>(false);

  constructor() {
    addIcons({
      shareSocialOutline,
      searchOutline,
      filterOutline,
      peopleOutline,
      star,
      starOutline,
      callOutline,
      mailOutline,
      locationOutline,
      closeOutline,
      checkmarkCircleOutline,
      arrowForwardOutline,
      briefcaseOutline,
      alertCircleOutline,
      cardOutline,
      heart,
      heartOutline,
      cashOutline,
      trophyOutline,
      personCircleOutline,
      calendarOutline,
      chevronBackOutline,
      chevronForwardOutline
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.reloadReferrals();
    });
  }

  ngOnInit(): void {
    this.adminReferralsStateService.filter$.pipe(takeUntil(this.destroy$)).subscribe(filter => {
      this.filterState = filter;
      this.reloadReferrals();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth >= 992;
    if (this.isDesktop !== wasDesktop) {
      this.limit = this.isDesktop ? 5 : 15;
      this.reloadReferrals();
    }
  }

  reloadReferrals(): void {
    this.currentPage = 1;
    this.totalPages = 1;
    this.hasMore.set(false);
    this.isLoadingMore = false;
    this.referrals.set([]);
    this.fetchReferrals();
  }

  clearDateFilter(): void {
    this.adminReferralsStateService.setFilter({ startDate: null, endDate: null, dates: null, stateId: null, districtId: null });
  }

  fetchReferrals(event?: any): void {
    if (this.isLoadingMore) {
      event?.target?.complete();
      return;
    }

    const isInitial = this.currentPage === 1;
    if (isInitial) {
      this.loading.set(true);
      this.error.set(null);
    }
    this.isLoadingMore = true;

    const referralTypeFilter = this.selectedType() !== 'ALL' ? (this.selectedType() as ReferralType) : undefined;

    this.referralsService.getAdminReferralSlips({
      search: this.searchQuery(),
      referral_type: referralTypeFilter,
      start_date: this.filterState.startDate || undefined,
      end_date: this.filterState.endDate || undefined,
      dates: this.filterState.dates || undefined,
      state_id: this.filterState.stateId || undefined,
      district_id: this.filterState.districtId || undefined,
      page: this.currentPage,
      limit: this.limit
    }).subscribe({
      next: (res) => {
        if (res && res.success) {
          const newItems = res.data || [];
          if (this.isDesktop || isInitial) {
            // Desktop: replace data (page-based); Mobile initial: replace
            this.referrals.set(newItems);
          } else {
            // Mobile subsequent: append for infinite scroll
            this.referrals.update(prev => [...prev, ...newItems]);
          }
          if (res.summary) {
            this.summary.set(res.summary);
          }
          const meta = res.meta;
          if (meta) {
            this.currentPage = meta.page;
            this.totalPages = meta.totalPages;
            this.hasMore.set(meta.page < meta.totalPages);
          } else {
            this.hasMore.set(false);
          }
        }
        this.loading.set(false);
        this.isLoadingMore = false;
        event?.target?.complete();
      },
      error: (err) => {
        if (isInitial) {
          this.error.set(extractFriendlyErrorMessage(err, 'Failed to retrieve referral slips.'));
        }
        this.loading.set(false);
        this.isLoadingMore = false;
        this.hasMore.set(false);
        event?.target?.complete();
      }
    });
  }

  onIonInfinite(event: any): void {
    if (this.hasMore() && !this.isLoadingMore) {
      this.currentPage++;
      this.fetchReferrals(event);
    } else {
      event.target.complete();
    }
  }

  // Desktop table pagination
  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.limit = parseInt(target.value, 10);
    this.reloadReferrals();
  }

  changePage(newPage: number): void {
    if (newPage > 0 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.fetchReferrals();
    }
  }

  onSearchInput(event: any): void {
    const val = event.detail.value || '';
    this.searchSubject.next(val);
  }

  segmentChanged(event: any): void {
    this.selectedType.set(event.detail.value);
    this.reloadReferrals();
  }

  openDetailModal(referral: ReferralDTO): void {
    this.selectedReferral.set(referral);
    this.isModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isModalOpen.set(false);
    this.selectedReferral.set(null);
  }
}
