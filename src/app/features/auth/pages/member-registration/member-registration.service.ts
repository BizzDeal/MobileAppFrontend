import { inject, Injectable, signal, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationResult } from '@angular/fire/auth';
import { MemberOnboardingService, MemberRegistrationPayload } from '../../services/member-onboarding.service';
import { FirebasePhoneAuthService } from '../../../../core/services/firebase-phone-auth.service';
import { AuthApiService } from '../../services/auth-api.service';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { ToastService } from '../../../../core/services/toast.service';
import { compressImageClientSide } from '../../../../shared/utils/image-compressor.util';
import { validateFileSize } from '../../../../shared/utils/file-validator.util';
import { ModalController } from '@ionic/angular/standalone';
import { ImageCropperModalComponent, ImageCropResult } from '../../../../shared/components/image-cropper-modal/image-cropper-modal.component';

@Injectable()
export class MemberRegistrationService {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly onboardingService = inject(MemberOnboardingService);
  readonly firebasePhoneAuth = inject(FirebasePhoneAuthService);
  readonly authApi = inject(AuthApiService);
  private readonly toastService = inject(ToastService);
  private readonly modalCtrl = inject(ModalController);
  private readonly destroyRef = inject(DestroyRef);

  readonly photoPreview = signal<string | null>(null);
  private photoFile: File | null = null;
  readonly logoPreview = signal<string | null>(null);
  private logoFile: File | null = null;
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  private _confirmationResult?: ConfirmationResult;

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
    businessStateId: ['', [Validators.required]],
    businessDistrictId: ['', [Validators.required]],
    businessAddress: ['', [Validators.minLength(5)]],
    referenceCode: [''],
  });

  constructor() {
    this.onboardingService.fetchCategories();
    this.onboardingService.fetchStates();

    effect(() => {
      const states = this.onboardingService.states();
      if (states.length > 0) {
        const apState = states.find((s) => s.name.toLowerCase().includes('andhra pradesh'));
        if (apState) {
          if (this.regForm.controls.stateId.value !== apState.id) {
            this.regForm.controls.stateId.setValue(apState.id);
            this.onboardingService.fetchDistrictsByState(apState.id);
          }
          if (this.regForm.controls.businessStateId.value !== apState.id) {
            this.regForm.controls.businessStateId.setValue(apState.id);
            this.onboardingService.fetchBusinessDistrictsByState(apState.id);
          }
          this.regForm.controls.stateId.disable();
          this.regForm.controls.businessStateId.disable();
        }
      }
    });

    this.regForm.controls.stateId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stateId) => {
      if (stateId) {
        this.onboardingService.fetchDistrictsByState(stateId);
      } else {
        this.onboardingService.districts.set([]);
      }
    });

    this.regForm.controls.businessStateId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stateId) => {
      if (stateId) {
        this.onboardingService.fetchBusinessDistrictsByState(stateId);
      } else {
        this.onboardingService.businessDistricts.set([]);
      }
    });

    this.regForm.controls.businessCategory.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((categoryId) => {
      if (categoryId) {
        const categories = this.onboardingService.categories();
        const selected = categories.find((c) => c.id === categoryId);
        if (selected && selected.description) {
          this.regForm.controls.businessDescription.setValue(selected.description);
        }
      }
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const rawFile = input.files[0];
      const validation = validateFileSize(rawFile, 10);
      if (!validation.valid) {
        this.toastService.showError(validation.error || 'File size exceeds limit');
        input.value = '';
        return;
      }

      const modal = await this.modalCtrl.create({
        component: ImageCropperModalComponent,
        componentProps: {
          imageSource: rawFile,
          title: 'Crop Profile Photo',
          roundCropper: true,
          outputFileName: 'profile-photo.jpg'
        }
      });

      await modal.present();
      const { data, role } = await modal.onDidDismiss<ImageCropResult>();

      if (role === 'confirm' && data) {
        this.photoFile = data.file;
        this.photoPreview.set(data.base64);
        this.toastService.showSuccess('📸 Profile picture cropped successfully!');
      }

      input.value = '';
    }
  }

  allowNumbersOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const rawFile = input.files[0];
      const validation = validateFileSize(rawFile, 10);
      if (!validation.valid) {
        this.toastService.showError(validation.error || 'File size exceeds limit');
        input.value = '';
        return;
      }

      const modal = await this.modalCtrl.create({
        component: ImageCropperModalComponent,
        componentProps: {
          imageSource: rawFile,
          title: 'Crop Brand Banner Image',
          roundCropper: false,
          aspectRatio: 16 / 9,
          targetWidth: 800,
          targetHeight: 450,
          outputFileName: 'brand-banner.jpg'
        }
      });

      await modal.present();
      const { data, role } = await modal.onDidDismiss<ImageCropResult>();

      if (role === 'confirm' && data) {
        this.logoFile = data.file;
        this.logoPreview.set(data.base64);
        this.toastService.showSuccess('📸 Brand image cropped successfully!');
      }

      input.value = '';
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
        state_id: val.stateId,
        district_id: val.districtId,
        business_name: val.businessName,
        category_id: val.businessCategory,
        business_description: val.businessDescription,
        website: val.website,
        gst_number: val.gstNumber,
        business_address: val.businessAddress || undefined,
        business_state_id: val.businessStateId || undefined,
        business_district_id: val.businessDistrictId || undefined,
        reference_code: val.referenceCode || undefined,
      };

      this.onboardingService.setRegistrationData(payload, this.photoFile, this.logoFile);
      await this.onboardingService.submitMemberRegistration();
      this.toastService.showSuccess('Welcome to BizzDeal! Your member registration has been submitted successfully. Please check your email to verify your account.');
      this.router.navigate(['/auth/login']).catch(() => {});
    } catch (err: any) {
      console.error('Failed to submit member registration:', err);
      this.toastService.showError(extractFriendlyErrorMessage(err, 'Registration submission failed. Please try again.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

}
