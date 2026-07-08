import { inject, Injectable, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MemberOnboardingService, MemberRegistrationPayload } from '../../services/member-onboarding.service';

@Injectable()
export class MemberRegistrationService {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly onboardingService = inject(MemberOnboardingService);

  readonly photoPreview = signal<string | null>(null);
  private photoFile: File | null = null;
  readonly isSubmitting = signal<boolean>(false);

  readonly regForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    loginPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
    whatsappNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    businessName: ['', [Validators.required, Validators.minLength(2)]],
    businessCategory: ['', [Validators.required]],
    businessDescription: ['', [Validators.required, Validators.minLength(5)]],
    website: ['', [Validators.required, Validators.minLength(3)]],
    gstNumber: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor() {
    this.onboardingService.fetchCategories();
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
        business_name: val.businessName,
        category_id: val.businessCategory,
        business_description: val.businessDescription,
        website: val.website,
        gst_number: val.gstNumber,
        firebaseToken: 'mock_firebase_token_for_dev',
      };

      this.onboardingService.setRegistrationData(payload, this.photoFile);
      await this.onboardingService.submitMemberRegistration();
      alert('Welcome to BizzDeal! Your member registration has been submitted successfully.');
      this.router.navigate(['/auth/login']);
    } catch (err: any) {
      console.error('Failed to submit member registration:', err);
      alert(err.message || 'Registration submission failed. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  backStep(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/auth/member-payment']);
  }
}
