import { ChangeDetectionStrategy, Component, inject, OnInit, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonIcon,
  IonModal,
  IonButton,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  peopleOutline,
  personOutline,
  callOutline,
  mailOutline,
  locationOutline,
  chatbubbleEllipsesOutline,
  chevronForwardOutline,
  paperPlaneOutline,
  checkmarkCircle,
  businessOutline,
  swapHorizontalOutline,
  flame,
  informationCircleOutline,
  checkmarkOutline,
  searchOutline,
  closeCircleOutline,
  closeOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { ReferralsService } from '../../services/referrals.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CreateReferralSlipDto, MemberBusinessDTO, ReferralType } from '../../models/referral.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-referral-slip',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonIcon,
    IonModal,
    IonButton,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    CachedImgDirective
  ],
  templateUrl: './referral-slip.page.html',
  styleUrl: './referral-slip.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReferralSlipPage implements OnInit {
  private readonly referralsService = inject(ReferralsService);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly ngZone = inject(NgZone);

  // Form State
  readonly referralType = signal<ReferralType>('INHOUSE');
  readonly selectedMember = signal<MemberBusinessDTO | null>(null);
  readonly contactName = signal<string>('');
  readonly contactPhone = signal<string>('');
  readonly contactEmail = signal<string>('');
  readonly contactAddress = signal<string>('');
  readonly comments = signal<string>('');
  readonly rating = signal<number>(0);
  readonly toldToCall = signal<boolean>(false);
  readonly cardGiven = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Member Picker State
  readonly isMemberPickerOpen = signal<boolean>(false);
  readonly searchInput = signal<string>('');
  readonly isMembersLoading = signal<boolean>(false);
  readonly membersList = signal<MemberBusinessDTO[]>([]);

  private readonly searchSubject = new Subject<string>();

  readonly getInitials = getInitials;
  readonly getAvatarColor = getAvatarColor;

  getMemberDisplayName(member: MemberBusinessDTO | null | undefined): string {
    if (!member) return '';
    return member.full_name || 'Member';
  }

  getMemberCategory(member: MemberBusinessDTO | null | undefined): string {
    if (!member) return 'Business Member';
    if (member.businessProfile?.category_name) {
      return member.businessProfile.category_name;
    }
    const categories = [
      'Commercial Services',
      'Retail & Trade',
      'Real Estate & Property',
      'IT & Digital Solutions',
      'Financial & Legal',
      'Health & Wellness',
      'Automotive & Logistics',
      'Manufacturing & Supply',
      'Food & Hospitality',
      'Construction & Interior'
    ];
    let hash = 0;
    const key = member.id || member.full_name || 'member';
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) % categories.length;
    }
    return categories[Math.abs(hash)];
  }

  getMemberBusinessName(member: MemberBusinessDTO | null | undefined): string {
    if (!member) return 'Partner Enterprise';
    if (member.businessProfile?.business_name) {
      return member.businessProfile.business_name;
    }
    const cleanName = (member.full_name || 'Member')
      .replace(/\(.*\)/g, '')
      .trim();
    const suffixes = ['Enterprises', 'Solutions', 'Trading Co.', 'Industries', 'Ventures', 'Associates', 'Hub', 'Services'];
    let hash = 0;
    const key = member.id || member.full_name || 'member';
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 17 + key.charCodeAt(i)) % suffixes.length;
    }
    const suffix = suffixes[Math.abs(hash)];
    return `${cleanName} ${suffix}`;
  }

  constructor() {
    addIcons({
      add,
      peopleOutline,
      personOutline,
      callOutline,
      mailOutline,
      locationOutline,
      chatbubbleEllipsesOutline,
      chevronForwardOutline,
      paperPlaneOutline,
      checkmarkCircle,
      businessOutline,
      swapHorizontalOutline,
      flame,
      informationCircleOutline,
      checkmarkOutline,
      searchOutline,
      closeCircleOutline,
      closeOutline,
      arrowBackOutline
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.fetchMembers(query);
    });
  }

  ngOnInit(): void {
    if (this.profileService.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create referrals');
      this.router.navigate(['/home'], { queryParams: { tab: 'referrals' } });
    }
  }

  goBack(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.ngZone.run(() => {
      this.navCtrl.navigateBack(['/home'], { queryParams: { tab: 'referrals' } });
    });
  }

  openMemberPicker(): void {
    this.isMemberPickerOpen.set(true);
    this.fetchMembers(this.searchInput());
  }

  closeMemberPicker(): void {
    this.isMemberPickerOpen.set(false);
  }

  onClearSearch(): void {
    this.searchInput.set('');
    this.fetchMembers('');
  }

  onSearchChange(event: Event): void {
    const query = (event.target as HTMLInputElement)?.value ?? '';
    this.searchInput.set(query);
    this.searchSubject.next(query);
  }

  referralTypeChanged(event: CustomEvent): void {
    const newType = event.detail.value as ReferralType;
    this.referralType.set(newType);
    this.selectedMember.set(null);
    if (this.isMemberPickerOpen()) {
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
        const filtered = data.filter(m => m.id !== profile?.id);
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
    this.closeMemberPicker();
  }

  clearSelectedMember(): void {
    this.selectedMember.set(null);
    this.searchInput.set('');
  }

  setRating(val: number): void {
    this.rating.set(val);
  }

  getRatingLabel(val: number): string {
    switch (val) {
      case 1: return '❄️ Cold Lead';
      case 2: return '🌤️ Mild Interest';
      case 3: return '🔥 Warm Referral';
      case 4: return '⚡ Very Hot';
      case 5: return '🚀 Ready to Close!';
      default: return '';
    }
  }

  submitReferral(): void {
    const member = this.selectedMember();
    if (!member) {
      this.toastService.showError('Please select a recipient member.');
      return;
    }

    if (!this.contactName().trim() || !this.contactPhone().trim()) {
      this.toastService.showError('Prospect name and telephone are required.');
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
    this.errorMessage.set(null);

    const dto: CreateReferralSlipDto = {
      to_member_id: member.id,
      referral_type: this.referralType(),
      told_to_call: this.toldToCall(),
      card_given: this.cardGiven(),
      contact_name: this.contactName().trim(),
      contact_phone: this.contactPhone().trim(),
      contact_email: this.contactEmail().trim() || undefined,
      contact_address: this.contactAddress().trim() || undefined,
      comments: this.comments().trim() || undefined,
      rating: this.rating() > 0 ? this.rating() : undefined,
    };

    this.referralsService.createReferralSlip(dto).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.submitting.set(false);
          this.toastService.showSuccess('Referral slip submitted successfully!');
          this.navCtrl.navigateBack(['/home'], { queryParams: { tab: 'referrals' } });
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to create referral slip.'));
        this.toastService.showError(this.errorMessage() || 'Failed to submit referral slip');
      }
    });
  }
}
