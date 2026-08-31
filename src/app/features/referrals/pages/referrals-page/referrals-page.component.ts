import { ChangeDetectionStrategy, Component, computed, inject, Input, OnInit, signal, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonSpinner,
  IonIcon,
  IonModal,
  IonButton,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonFooter,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  peopleOutline,
  personOutline,
  walletOutline,
  giftOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeOutline,
  alertCircleOutline,
  star,
  starOutline,
  callOutline,
  mailOutline,
  locationOutline,
  chatbubbleEllipsesOutline,
  calendarOutline,
  cardOutline,
  chevronForwardOutline,
  heart,
  heartOutline,
  paperPlaneOutline,
  checkmarkCircle,
  businessOutline,
  documentTextOutline,
  cashOutline,
  informationCircleOutline,
  shareSocialOutline
} from 'ionicons/icons';
import { ReferralsService } from '../../services/referrals.service';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { ProfileService } from '../../../profile/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ReferralDTO } from '../../models/referral.model';
import { ListSkeletonComponent } from '../../../../shared/components/skeletons/list-skeleton/list-skeleton.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-referrals-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonSpinner,
    IonIcon,
    IonModal,
    IonButton,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonFooter,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    ListSkeletonComponent,
    CachedImgDirective
  ],
  templateUrl: './referrals-page.component.html',
  styleUrl: './referrals-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReferralsPageComponent implements OnInit {
  @Input() set initialSegment(val: 'GIVEN' | 'RECEIVED' | undefined) {
    if (val) {
      this.activeSegment.set(val);
    }
  }
  private readonly referralsService = inject(ReferralsService);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly ngZone = inject(NgZone);

  readonly referrals = signal<ReferralDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly selectedReferralForView = signal<ReferralDTO | null>(null);
  readonly isDetailModalOpen = signal<boolean>(false);

  // Appreciation Modal State
  readonly isAppreciationModalOpen = signal<boolean>(false);
  readonly selectedReferralForAppreciation = signal<ReferralDTO | null>(null);
  readonly appreciationCost = signal<number | null>(null);
  readonly appreciationMessage = signal<string>('');
  readonly submittingAppreciation = signal<boolean>(false);

  // Pagination state
  readonly hasMore = signal<boolean>(false);
  private currentPage = 1;
  private readonly pageSize = 15;
  private isLoadingMore = false;

  // Segment State (GIVEN / RECEIVED)
  readonly activeSegment = signal<'GIVEN' | 'RECEIVED'>('GIVEN');

  readonly filteredReferrals = computed(() => {
    const type = this.activeSegment();
    const currentUserId = this.profileService.profile()?.id;
    if (!currentUserId) return [];
    
    const refs = this.referrals();
    if (!Array.isArray(refs)) return [];

    if (type === 'GIVEN') {
      return refs.filter(r => r.referrer_id === currentUserId);
    } else {
      return refs.filter(r => r.to_member_id === currentUserId);
    }
  });

  readonly getInitials = getInitials;
  readonly getAvatarColor = getAvatarColor;

  constructor() {
    addIcons({
      add,
      peopleOutline,
      personOutline,
      walletOutline,
      giftOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeOutline,
      alertCircleOutline,
      star,
      starOutline,
      callOutline,
      mailOutline,
      locationOutline,
      chatbubbleEllipsesOutline,
      calendarOutline,
      cardOutline,
      chevronForwardOutline,
      heart,
      heartOutline,
      paperPlaneOutline,
      checkmarkCircle,
      businessOutline,
      documentTextOutline,
      cashOutline,
      informationCircleOutline,
      shareSocialOutline
    });
  }

  ngOnInit(): void {
    if (this.initialSegment) {
      this.activeSegment.set(this.initialSegment);
    }
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

    this.referralsService.getReferralSlips({
      type: this.activeSegment(),
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (res) => {
        this.referrals.update(prev => isInitial ? res.data : [...prev, ...res.data]);
        this.hasMore.set(res.meta.page < res.meta.totalPages);
        this.loading.set(false);
        this.isLoadingMore = false;
        event?.target?.complete();
      },
      error: (err) => {
        if (isInitial) {
          this.error.set(extractFriendlyErrorMessage(err, 'Failed to retrieve referrals list.'));
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

  segmentChanged(event: any) {
    this.activeSegment.set(event.detail.value);
    this.currentPage = 1;
    this.hasMore.set(false);
    this.isLoadingMore = false;
    this.referrals.set([]);
    this.fetchReferrals();
  }

  openCreatePage(): void {
    if (this.profileService.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create referrals');
      return;
    }
    this.ngZone.run(() => {
      this.navCtrl.navigateForward('/referrals/new');
    });
  }

  openDetailModal(ref: ReferralDTO): void {
    this.selectedReferralForView.set(ref);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedReferralForView.set(null);
  }

  // --- Appreciation Logic ---

  openAppreciationModal(ref: ReferralDTO, event: Event): void {
    event.stopPropagation();
    if (ref.is_appreciated) return;
    this.selectedReferralForAppreciation.set(ref);
    this.appreciationCost.set(null);
    this.appreciationMessage.set(`Thank you for referring ${ref.contact_name}! We successfully completed business. I truly appreciate your support!`);
    this.isAppreciationModalOpen.set(true);
  }

  closeAppreciationModal(): void {
    this.isAppreciationModalOpen.set(false);
    this.selectedReferralForAppreciation.set(null);
    this.appreciationCost.set(null);
    this.appreciationMessage.set('');
  }

  onCostChange(event: any): void {
    const cost = event.detail.value;
    this.appreciationCost.set(cost);
    const ref = this.selectedReferralForAppreciation();
    
    if (ref && cost !== null && cost !== '') {
      this.appreciationMessage.set(`Thank you for referring ${ref.contact_name}! We successfully completed business worth ₹${cost}. I truly appreciate your support!`);
    } else if (ref) {
      this.appreciationMessage.set(`Thank you for referring ${ref.contact_name}! We successfully completed business. I truly appreciate your support!`);
    }
  }

  submitAppreciation(): void {
    const ref = this.selectedReferralForAppreciation();
    const cost = this.appreciationCost();
    const msg = this.appreciationMessage();
    
    if (!ref) return;
    if (cost === null || cost < 0 || isNaN(Number(cost)) || cost.toString().trim() === '') {
      this.toastService.showError('Please enter a valid cost of business.');
      return;
    }
    if (!msg.trim()) {
      this.toastService.showError('Appreciation message is required.');
      return;
    }

    this.submittingAppreciation.set(true);
    this.referralsService.appreciateReferral(ref.id, {
      cost_of_business: Number(cost),
      appreciation_message: msg.trim()
    }).subscribe({
      next: () => {
        this.fetchReferrals();
        this.submittingAppreciation.set(false);
        this.closeAppreciationModal();
        this.toastService.showSuccess('Appreciation sent successfully!');
      },
      error: (err) => {
        this.toastService.showError(extractFriendlyErrorMessage(err, 'Failed to send appreciation.'));
        this.submittingAppreciation.set(false);
      }
    });
  }
}
