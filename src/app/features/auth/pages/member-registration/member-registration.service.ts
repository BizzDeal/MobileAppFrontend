import { inject, Injectable, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationResult } from '@angular/fire/auth';
import { MemberOnboardingService, MemberRegistrationPayload } from '../../services/member-onboarding.service';
import { FirebasePhoneAuthService } from '../../../../core/services/firebase-phone-auth.service';
import { AuthApiService } from '../../services/auth-api.service';

@Injectable()
export class MemberRegistrationService {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly onboardingService = inject(MemberOnboardingService);
  readonly firebasePhoneAuth = inject(FirebasePhoneAuthService);
  readonly authApi = inject(AuthApiService);

  readonly photoPreview = signal<string | null>(null);
  private photoFile: File | null = null;
  readonly logoPreview = signal<string | null>(null);
  private logoFile: File | null = null;
  readonly isSubmitting = signal<boolean>(false);

  readonly isOtpModalOpen = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly otpControl = new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]);

  private _confirmationResult?: ConfirmationResult;
  private _verifiedOtp?: string;

  readonly regForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    loginPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
    whatsappNumber: ['', [Validators.pattern(/^[0-9]{10}$/)]],
    email: ['', [Validators.required, Validators.email]],
    stateId: ['', [Validators.required]],
    districtId: ['', [Validators.required]],
    address: ['', [Validators.minLength(5)]],
    businessName: ['', [Validators.required, Validators.minLength(2)]],
    businessCategory: ['', [Validators.required]],
    businessDescription: ['', [Validators.required, Validators.minLength(5)]],
    website: ['', [Validators.minLength(3)]],
    gstNumber: ['', [Validators.minLength(5)]],
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

    this.regForm.controls.businessCategory.valueChanges.subscribe((categoryId) => {
      if (categoryId) {
        const categories = this.onboardingService.categories();
        const selected = categories.find((c) => c.id === categoryId);
        if (selected && selected.description) {
          this.regForm.controls.businessDescription.setValue(selected.description);
        }
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

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.logoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(this.logoFile);
    }
  }

  async submitRegistration(): Promise<void> {
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      return;
    }

    if (!this._verifiedOtp) {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);
      
      const email = this.regForm.controls.email.value;
      
      this.authApi.sendOtp(email, 'register').subscribe({
        next: () => {
          this.isOtpModalOpen.set(true);
          this.isSubmitting.set(false);
        },
        error: (err: any) => {
          console.error('sendOtp error in member registration:', err);
          this.errorMessage.set(err?.error?.message || 'Failed to send Email OTP code. Check your email address.');
          this.isSubmitting.set(false);
        }
      });
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
        otp: this._verifiedOtp,
        reference_code: val.referenceCode || undefined,
      };

      this.onboardingService.setRegistrationData(payload, this.photoFile, this.logoFile);
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

    // Since verification happens on the backend now, we just save the OTP and proceed.
    // If the OTP is invalid, the backend will return a 400 Bad Request which will be caught below.
    this._verifiedOtp = this.otpControl.value;
    this.isOtpModalOpen.set(false);
    await this.submitRegistration();
  }

  closeOtpModal(): void {
    this.isOtpModalOpen.set(false);
  }

  backStep(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/auth/member-payment']);
  }
}
