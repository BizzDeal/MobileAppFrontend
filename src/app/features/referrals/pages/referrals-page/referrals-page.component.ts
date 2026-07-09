import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonButtons,
  IonButton,
  IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  peopleOutline,
  walletOutline,
  giftOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeOutline,
  alertCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { ReferralsService } from '../../services/referrals.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { ReferralDTO, ReferralStatus } from '../../models/referral.model';

@Component({
  selector: 'app-referrals-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSpinner,
    IonIcon,
    IonFab,
    IonFabButton,
    IonModal,
    IonButtons,
    IonButton,
    IonInput
  ],
  templateUrl: './referrals-page.component.html',
  styleUrl: './referrals-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReferralsPageComponent implements OnInit {
  private readonly referralsService = inject(ReferralsService);
  private readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);

  readonly referrals = signal<ReferralDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);
  readonly isModalOpen = signal<boolean>(false);

  readonly phoneForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
  });

  // Derived Analytics using computed signals
  readonly totalReferrals = computed(() => this.referrals().length);
  readonly joinedReferrals = computed(() => 
    this.referrals().filter(r => r.status === 'JOINED').length
  );
  readonly pendingReferrals = computed(() => 
    this.referrals().filter(r => r.status === 'PENDING').length
  );

  constructor() {
    addIcons({
      add,
      peopleOutline,
      walletOutline,
      giftOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeOutline,
      alertCircleOutline,
      closeCircleOutline
    });
  }

  ngOnInit(): void {
    this.fetchReferrals();
  }

  fetchReferrals(): void {
    this.loading.set(true);
    this.error.set(null);
    this.referralsService.findAll().subscribe({
      next: (data) => {
        this.referrals.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to retrieve referrals list');
        this.loading.set(false);
      }
    });
  }

  get phoneControl() {
    return this.phoneForm.get('phone');
  }

  openModal(): void {
    this.phoneForm.reset();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  submitReferral(): void {
    if (this.phoneForm.invalid || this.submitting()) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const phoneVal = this.phoneForm.value.phone;
    
    // Generate referral code based on referrer's profile name and phone last 4 digits
    const profile = this.profileService.profile();
    const cleanName = profile?.full_name
      ? profile.full_name.trim().replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5)
      : 'BIZZ';
    const lastDigits = profile?.phone 
      ? profile.phone.replace(/\D/g, '').slice(-4) 
      : '9999';
    const generatedCode = `BD-${cleanName}-${lastDigits}`;

    this.referralsService.create(phoneVal, generatedCode).subscribe({
      next: (newReferral) => {
        this.fetchReferrals();
        this.submitting.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to create referral. Phone number might already be referred.');
        this.submitting.set(false);
      }
    });
  }

  getStatusBadgeClass(status: ReferralStatus): string {
    switch (status) {
      case 'REWARDED': return 'status-rewarded';
      case 'JOINED': return 'status-joined';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: ReferralStatus): string {
    switch (status) {
      case 'REWARDED': return 'Rewarded';
      case 'JOINED': return 'Joined';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Invited';
    }
  }

  getStatusIcon(status: ReferralStatus): string {
    switch (status) {
      case 'REWARDED': return 'checkmark-circle-outline';
      case 'JOINED': return 'people-outline';
      case 'CANCELLED': return 'close-circle-outline';
      default: return 'time-outline';
    }
  }
}
