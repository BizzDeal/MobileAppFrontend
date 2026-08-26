import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonIcon,
  IonModal,
  IonButtons,
  IonButton,
  IonSearchbar,
  IonCheckbox,
  IonList,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonInput,
  IonTextarea,
  IonFooter,
  IonInfiniteScroll,
  IonInfiniteScrollContent
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
  closeCircleOutline,
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
  heartOutline
} from 'ionicons/icons';
import { ReferralsService } from '../../services/referrals.service';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { ProfileService } from '../../../profile/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ReferralDTO, ReferralType, CreateReferralSlipDto, MemberBusinessDTO } from '../../models/referral.model';
import { ListSkeletonComponent } from '../../../../shared/components/skeletons/list-skeleton/list-skeleton.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-referrals-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSpinner,
    IonIcon,
    IonModal,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonCheckbox,
    IonList,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonInput,
    IonTextarea,
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
  private readonly referralsService = inject(ReferralsService);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);

  readonly referrals = signal<ReferralDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);
  readonly isModalOpen = signal<boolean>(false);
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

  // Search Members variables
  readonly searchInput = signal<string>('');
  readonly isMembersLoading = signal<boolean>(false);
  readonly membersList = signal<MemberBusinessDTO[]>([]);
  readonly selectedMember = signal<MemberBusinessDTO | null>(null);
  readonly isSearchFocused = signal<boolean>(false);

  private searchSubject = new Subject<string>();

  // Form State
  readonly referralType = signal<ReferralType>('INHOUSE');
  readonly contactName = signal<string>('');
  readonly contactPhone = signal<string>('');
  readonly contactEmail = signal<string>('');
  readonly contactAddress = signal<string>('');
  readonly comments = signal<string>('');
  readonly rating = signal<number>(0);
  readonly toldToCall = signal<boolean>(false);
  readonly cardGiven = signal<boolean>(false);

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
      closeCircleOutline,
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
      heartOutline
    });

    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.fetchMembers(query);
    });
  }

  ngOnInit(): void {
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

  openModal(): void {
    if (this.profileService.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create referrals');
      return;
    }
    this.resetForm();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  openDetailModal(ref: ReferralDTO): void {
    this.selectedReferralForView.set(ref);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedReferralForView.set(null);
  }

  resetForm(): void {
    this.referralType.set('INHOUSE');
    this.searchInput.set('');
    this.selectedMember.set(null);
    this.membersList.set([]);
    this.isSearchFocused.set(false);
    this.contactName.set('');
    this.contactPhone.set('');
    this.contactEmail.set('');
    this.contactAddress.set('');
    this.comments.set('');
    this.rating.set(0);
    this.toldToCall.set(false);
    this.cardGiven.set(false);
  }

  onSearchFocus(): void {
    this.isSearchFocused.set(true);
    if (!this.selectedMember() && this.membersList().length === 0) {
      this.fetchMembers(this.searchInput());
    }
  }

  onSearchChange(event: any): void {
    const query = event.detail.value || '';
    this.searchInput.set(query);
    this.isSearchFocused.set(true);
    
    if (this.selectedMember()) {
      this.selectedMember.set(null);
    }

    this.searchSubject.next(query);
  }

  referralTypeChanged(event: any): void {
    this.referralType.set(event.detail.value);
    this.selectedMember.set(null);
    if (this.isSearchFocused()) {
      this.fetchMembers(this.searchInput());
    }
  }

  fetchMembers(query: string = ''): void {
    this.isMembersLoading.set(true);
    const profile = this.profileService.profile();
    let districtId: string | undefined = undefined;
    let excludeDistricts: string | undefined = undefined;

    if (this.referralType() === 'INHOUSE' && profile?.district_id) {
      districtId = profile.district_id;
    } else if (this.referralType() === 'OUTHOUSE' && profile?.district_id) {
      excludeDistricts = profile.district_id;
    }
    
    this.referralsService.searchMembers(query, districtId, excludeDistricts).subscribe({
      next: (data) => {
        // filter out self
        const filtered = data.filter(m => m.id !== profile?.id);
        
        // Filter additionally on FE for INHOUSE type (must be in same district)
        let finalData = filtered;
        if (this.referralType() === 'INHOUSE' && profile?.district_id) {
          finalData = filtered.filter(m => m.profile?.district_id === profile.district_id || m.profile?.district_id === profile.business_district_id);
        }

        this.membersList.set(finalData);
        this.isMembersLoading.set(false);
      },
      error: () => {
        this.isMembersLoading.set(false);
      }
    });
  }

  selectMember(member: MemberBusinessDTO): void {
    this.selectedMember.set(member);
    this.searchInput.set(`${member.full_name} (${member.businessProfile?.business_name || 'No Business'})`);
    this.membersList.set([]);
    this.isSearchFocused.set(false);
  }

  setRating(val: number): void {
    this.rating.set(val);
  }

  submitReferral(): void {
    const member = this.selectedMember();
    if (!member) {
      this.toastService.showError('Please select a member to refer to.');
      return;
    }

    if (!this.contactName().trim() || !this.contactPhone().trim()) {
      this.toastService.showError('Contact name and phone are required.');
      return;
    }

    if (!/^\d{10}$/.test(this.contactPhone().trim())) {
      this.toastService.showError('Valid 10-digit phone number is required.');
      return;
    }

    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const dto: CreateReferralSlipDto = {
      to_member_id: member.id,
      referral_type: this.referralType(),
      told_to_call: this.toldToCall(),
      card_given: this.cardGiven(),
      contact_name: this.contactName(),
      contact_phone: this.contactPhone(),
      contact_email: this.contactEmail(),
      contact_address: this.contactAddress(),
      comments: this.comments(),
      rating: this.rating() > 0 ? this.rating() : undefined,
    };

    this.referralsService.createReferralSlip(dto).subscribe({
      next: () => {
        this.fetchReferrals();
        this.submitting.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.error.set(extractFriendlyErrorMessage(err, 'Failed to create referral slip.'));
        this.submitting.set(false);
      }
    });
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
        // Optimistically update or fetch list
        this.fetchReferrals();
        this.submittingAppreciation.set(false);
        this.closeAppreciationModal();
      },
      error: (err) => {
        this.toastService.showError(extractFriendlyErrorMessage(err, 'Failed to send appreciation.'));
        this.submittingAppreciation.set(false);
      }
    });
  }
}
