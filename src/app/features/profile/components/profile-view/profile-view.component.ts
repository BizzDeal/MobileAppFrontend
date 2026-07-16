import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import {
  IonAlert,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonToast
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  callOutline,
  cameraOutline,
  caretDownOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  locationOutline,
  logOutOutline,
  logoWhatsapp,
  mailOutline,
  mapOutline,
  personOutline,
  businessOutline,
  globeOutline,
  documentTextOutline
} from 'ionicons/icons';
import { ProfileService } from '../../services/profile.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    ReactiveFormsModule,
    IonAlert,
    IonSpinner,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonToast,
    CachedImgDirective
  ],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileViewComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);
  readonly profileService = inject(ProfileService);

  readonly profile = this.profileService.profile;
  readonly userRole = this.profileService.userRole;
  readonly loading = this.profileService.loading;
  readonly error = this.profileService.error;
  readonly updating = this.profileService.updating;

  readonly toastMessage = signal<string | null>(null);
  readonly selectedPhotoUrl = signal<string | null>(null);
  readonly selectedPhotoFile = signal<File | null>(null);
  readonly selectedBusinessLogoUrl = signal<string | null>(null);
  readonly selectedBusinessLogoFile = signal<File | null>(null);
  readonly isCompleteProfileModalOpen = signal<boolean>(false);
  readonly picLoadError = signal<boolean>(false);
  readonly logoLoadError = signal<boolean>(false);

  readonly isIncompleteProfile = computed(() => {
    const p = this.profile();
    if (!p) return false;
    const isMissingName = !p.full_name || p.full_name === 'Customer';
    const isMissingEmail = !p.email || p.email.includes('@bizzdeal.com');
    const isMissingAddress = !p.address || p.address === 'Not Provided';
    const isMissingLocation = !p.state_id || !p.district_id;
    return isMissingName || isMissingEmail || isMissingAddress || isMissingLocation;
  });

  readonly profileForm: FormGroup = this.fb.group({
    full_name: ['', [Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    whatsapp: ['', [Validators.minLength(10)]],
    email: ['', [Validators.email]],
    state_id: [''],
    district_id: [''],
    address: [''],
    business_name: [''],
    business_description: [''],
    website: [''],
    gst_number: ['']
  });

  constructor() {
    addIcons({
      personOutline,
      callOutline,
      logoWhatsapp,
      mailOutline,
      locationOutline,
      mapOutline,
      cameraOutline,
      caretDownOutline,
      chevronDownOutline,
      logOutOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      businessOutline,
      globeOutline,
      documentTextOutline
    });

    this.profileService.fetchStates();

    this.profileForm.controls['state_id'].valueChanges.subscribe((stateId) => {
      this.profileForm.controls['district_id'].setValue('', { emitEvent: false });
      if (stateId) {
        this.profileService.fetchDistrictsByState(stateId);
      } else {
        this.profileService.clearDistricts();
      }
    });

    // Synchronize form controls when profile signal updates
    effect(() => {
      const p = this.profile();
      if (p) {
        if (p.role === 'CUSTOMER') {
          this.profileForm.controls['full_name'].setValidators([Validators.minLength(2)]);
          this.profileForm.controls['whatsapp'].setValidators([Validators.minLength(10)]);
          this.profileForm.controls['email'].setValidators([Validators.email]);
          this.profileForm.controls['state_id'].clearValidators();
          this.profileForm.controls['district_id'].clearValidators();
          this.profileForm.controls['address'].clearValidators();
          this.profileForm.controls['business_name'].clearValidators();
          this.profileForm.controls['business_description'].clearValidators();
          this.profileForm.controls['website'].clearValidators();
          this.profileForm.controls['gst_number'].clearValidators();
        } else {
          this.profileForm.controls['full_name'].setValidators([Validators.required, Validators.minLength(2)]);
          this.profileForm.controls['whatsapp'].setValidators([Validators.required, Validators.minLength(10)]);
          this.profileForm.controls['email'].setValidators([Validators.required, Validators.email]);
          this.profileForm.controls['state_id'].setValidators([Validators.required]);
          this.profileForm.controls['district_id'].setValidators([Validators.required]);
          this.profileForm.controls['address'].setValidators([Validators.required]);
          this.profileForm.controls['business_name'].setValidators([Validators.required, Validators.minLength(2)]);
          this.profileForm.controls['business_description'].setValidators([Validators.required, Validators.minLength(5)]);
          this.profileForm.controls['website'].clearValidators();
          this.profileForm.controls['gst_number'].clearValidators();
        }
        Object.keys(this.profileForm.controls).forEach(key => {
          this.profileForm.controls[key].updateValueAndValidity({ emitEvent: false });
        });

        this.profileForm.patchValue({
          full_name: p.full_name || '',
          phone: p.phone || '',
          whatsapp: p.whatsapp || '',
          email: p.email || '',
          state_id: p.state_id || '',
          district_id: p.district_id || '',
          address: p.address || '',
          business_name: p.business_name || '',
          business_description: p.business_description || '',
          website: p.website || '',
          gst_number: p.gst_number || ''
        }, { emitEvent: false });

        if (p.state_id) {
          this.profileService.fetchDistrictsByState(p.state_id);
        } else {
          this.profileService.clearDistricts();
        }

        if (p.profile_pic_url && !this.selectedPhotoUrl()) {
          this.selectedPhotoUrl.set(p.profile_pic_url);
        }
        if (p.business_logo_url && !this.selectedBusinessLogoUrl()) {
          this.selectedBusinessLogoUrl.set(p.business_logo_url);
        }

        untracked(() => {
          if (this.isIncompleteProfile() && !this.isCompleteProfileModalOpen()) {
            this.isCompleteProfileModalOpen.set(true);
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.profileService.loadProfile().subscribe();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedPhotoFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        const resultUrl = reader.result as string;
        this.selectedPhotoUrl.set(resultUrl);
        this.picLoadError.set(false);
        // Inform the service to update local signal picture URL
        this.profileService.updateProfilePic(resultUrl);
        this.showToast('📸 Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  }

  onBusinessLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedBusinessLogoFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        const resultUrl = reader.result as string;
        this.selectedBusinessLogoUrl.set(resultUrl);
        this.logoLoadError.set(false);
        this.showToast('📸 Brand image updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  }

  getInitials(name?: string | null): string {
    if (!name || !name.trim()) return 'U';
    return name.trim().charAt(0).toUpperCase();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.showToast('⚠️ Please fix the errors in the form.');
      return;
    }

    const formVal = this.profileForm.value;
    let payload: any;
    const photoFile = this.selectedPhotoFile();
    const logoFile = this.selectedBusinessLogoFile();

    if (photoFile || logoFile) {
      const formData = new FormData();
      formData.append('full_name', formVal.full_name);
      formData.append('phone', formVal.phone || this.profile()?.phone || '');
      if (formVal.whatsapp) formData.append('whatsapp', formVal.whatsapp);
      if (formVal.email) formData.append('email', formVal.email);
      if (formVal.state_id) formData.append('state_id', formVal.state_id);
      if (formVal.district_id) formData.append('district_id', formVal.district_id);
      if (formVal.address) formData.append('address', formVal.address);
      if (this.userRole() !== 'CUSTOMER') {
        if (formVal.business_name) formData.append('business_name', formVal.business_name);
        if (formVal.business_description) formData.append('business_description', formVal.business_description);
        if (formVal.website) formData.append('website', formVal.website);
        if (formVal.gst_number) formData.append('gst_number', formVal.gst_number);
      }
      if (photoFile) formData.append('profile_pic', photoFile);
      if (logoFile) formData.append('business_logo', logoFile);
      payload = formData;
    } else {
      payload = {
        full_name: formVal.full_name,
        phone: formVal.phone || this.profile()?.phone || '',
        whatsapp: formVal.whatsapp,
        email: formVal.email,
        state_id: formVal.state_id || null,
        district_id: formVal.district_id || null,
        address: formVal.address
      };
      if (this.userRole() !== 'CUSTOMER') {
        if (formVal.business_name) payload.business_name = formVal.business_name;
        if (formVal.business_description) payload.business_description = formVal.business_description;
        if (formVal.website) payload.website = formVal.website;
        if (formVal.gst_number) payload.gst_number = formVal.gst_number;
      }
    }

    this.profileService.updateProfile(payload).subscribe({
      next: () => {
        this.selectedPhotoFile.set(null);
        this.selectedBusinessLogoFile.set(null);
        this.showToast('✅ Profile saved successfully!');
      },
      error: (err) => {
        this.showToast(`❌ Error: ${err.message || 'Could not save profile'}`);
      }
    });
  }

  async onLogout(): Promise<void> {
    this.showToast('👋 Logging out...');
    await Preferences.remove({ key: 'mockRole' });
    this.profileService.clearProfile();
    await this.authSession.logout(true);
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
  }

  closeCompleteProfileModal(): void {
    this.isCompleteProfileModalOpen.set(false);
  }

  retryLoad(): void {
    this.profileService.loadProfile().subscribe();
  }
}
