import { Component, OnInit, signal, inject } from '@angular/core';
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
  IonItem
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
  cardOutline
} from 'ionicons/icons';
import { ReferralsService } from '../../../referrals/services/referrals.service';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { ReferralDTO, ReferralType, AdminReferralSummary } from '../../../referrals/models/referral.model';
import { ListSkeletonComponent } from '../../../../shared/components/skeletons/list-skeleton/list-skeleton.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
    ListSkeletonComponent
  ],
  templateUrl: './admin-referrals.page.html',
  styleUrls: ['./admin-referrals.page.scss']
})
export class AdminReferralsPage implements OnInit {
  private readonly referralsService = inject(ReferralsService);

  readonly referrals = signal<ReferralDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<AdminReferralSummary>({ totalCount: 0, insideCount: 0, outsideCount: 0 });

  // Filtering & Pagination State
  readonly searchQuery = signal<string>('');
  readonly selectedType = signal<string>('ALL'); // ALL, INSIDE, OUTSIDE
  readonly hasMore = signal<boolean>(false);
  
  currentPage = 1;
  readonly pageSize = 15;
  private isLoadingMore = false;

  private readonly searchSubject = new Subject<string>();

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
      cardOutline
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.reloadReferrals();
    });
  }

  ngOnInit(): void {
    this.fetchReferrals();
  }

  reloadReferrals(): void {
    this.currentPage = 1;
    this.hasMore.set(false);
    this.isLoadingMore = false;
    this.referrals.set([]);
    this.fetchReferrals();
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
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (res) => {
        if (res && res.success) {
          const newItems = res.data || [];
          this.referrals.update(prev => isInitial ? newItems : [...prev, ...newItems]);
          if (res.summary) {
            this.summary.set(res.summary);
          }
          const meta = res.meta;
          this.hasMore.set(meta ? meta.page < meta.totalPages : false);
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
