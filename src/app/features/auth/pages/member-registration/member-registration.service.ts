import { inject, Injectable, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationResult } from '@angular/fire/auth';
import { MemberOnboardingService, MemberRegistrationPayload } from '../../services/member-onboarding.service';
import { FirebasePhoneAuthService } from '../../../../core/services/firebase-phone-auth.service';

@Injectable()
export class MemberRegistrationService {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly onboardingService = inject(MemberOnboardingService);
  readonly firebasePhoneAuth = inject(FirebasePhoneAuthService);

  readonly photoPreview = signal<string | null>(null);
  private photoFile: File | null = null;
  readonly isSubmitting = signal<boolean>(false);

  readonly isOtpModalOpen = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly otpControl = new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]);

  private _confirmationResult?: ConfirmationResult;
  private _verifiedFirebaseToken?: string;

  readonly regForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    loginPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
    whatsappNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    email: ['', [Validators.required, Validators.email]],
    stateId: ['', [Validators.required]],
    districtId: ['', [Validators.required]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    businessName: ['', [Validators.required, Validators.minLength(2)]],
    businessCategory: ['', [Validators.required]],
    businessDescription: ['', [Validators.required, Validators.minLength(5)]],
    website: ['', [Validators.required, Validators.minLength(3)]],
    gstNumber: ['', [Validators.required, Validators.minLength(5)]],
    referenceCode: [''],
  });

  constructor() {
    this.onboardingService.fetchCategories();
    this.onboardingService.fetchStates();

    this.regForm.controls.stateId.valueChanges.subscribe((stateId) => {
      this.regForm.controls.districtId.setValue('');
      if (stateId) {
        this.onboardingService.fetchDistrictsByState(stateId);
      } else {
        this.onboardingService.districts.set([]);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.photoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(this.photoFile);
    }
  }

  async submitRegistration(): Promise<void> {
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      return;
    }

    if (!this._verifiedFirebaseToken) {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);
      try {
        const phoneNumber = this.regForm.controls.phoneNumber.value;
        this.firebasePhoneAuth.initRecaptcha('recaptcha-container-member');
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        this._confirmationResult = await this.firebasePhoneAuth.sendOtp(formattedPhone);
        this.isOtpModalOpen.set(true);
      } catch (err: any) {
        console.error('sendOtp error in member registration:', err);
        this.errorMessage.set(err?.message || 'Failed to send SMS OTP code. Check phone number.');
      } finally {
        this.isSubmitting.set(false);
      }
      return;
    }

    this.isSubmitting.set(true);
    try {
      const val = this.regForm.getRawValue();
      const payload: MemberRegistrationPayload = {
        full_name: val.fullName,
        phone: val.phoneNumber,
        pin: val.loginPin,
        whatsapp: val.whatsappNumber,
        email: val.email,
        address: val.address,
        state_id: val.stateId,
        district_id: val.districtId,
        business_name: val.businessName,
        category_id: val.businessCategory,
        business_description: val.businessDescription,
        website: val.website,
        gst_number: val.gstNumber,
        firebaseToken: this._verifiedFirebaseToken,
        reference_code: val.referenceCode || undefined,
      };

      this.onboardingService.setRegistrationData(payload, this.photoFile);
      await this.onboardingService.submitMemberRegistration();
      alert('Welcome to BizzDeal! Your member registration has been submitted successfully.');
      this.router.navigate(['/home']);
    } catch (err: any) {
      console.error('Failed to submit member registration:', err);
      alert(err.message || 'Registration submission failed. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async verifyOtpAndProceed(): Promise<void> {
    this.errorMessage.set(null);
    if (!this.otpControl.value || this.otpControl.invalid) {
      this.otpControl.markAsTouched();
      return;
    }
    if (!this._confirmationResult) {
      this.errorMessage.set('OTP session expired. Please submit registration again.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const token = await this.firebasePhoneAuth.verifyOtp(
        this._confirmationResult!,
        this.otpControl.value
      );
      this._verifiedFirebaseToken = token;
      this.isOtpModalOpen.set(false);
      await this.submitRegistration();
    } catch (err: any) {
      console.error('verifyOtp error in member registration:', err);
      this.errorMessage.set(err?.message || 'Invalid or expired OTP code.');
      this.isSubmitting.set(false);
    }
  }

  closeOtpModal(): void {
    this.isOtpModalOpen.set(false);
  }

  backStep(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/auth/member-payment']);
  }
}
