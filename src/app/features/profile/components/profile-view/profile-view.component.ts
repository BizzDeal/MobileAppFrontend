import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import {
  AlertController,
  IonAlert,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  ModalController
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
  documentTextOutline,
  powerOutline,
  banOutline,
  trashOutline,
  phonePortraitOutline,
  desktopOutline,
  refreshOutline
} from 'ionicons/icons';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { MemberOnboardingService } from '../../../auth/services/member-onboarding.service';
import { NotificationService } from '../../../notifications/services/notification.service';
import { ProfileSkeletonComponent } from '../../../../shared/components/skeletons/profile-skeleton/profile-skeleton.component';
import { compressImageClientSide } from '../../../../shared/utils/image-compressor.util';
import { validateFileSize } from '../../../../shared/utils/file-validator.util';
import { ImageCropperModalComponent, ImageCropResult } from '../../../../shared/components/image-cropper-modal/image-cropper-modal.component';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    ReactiveFormsModule,
    IonIcon,
    IonSpinner,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonAlert,
    CachedImgDirective,
    ProfileSkeletonComponent
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
  private readonly toastService = inject(ToastService);
  public readonly onboardingService = inject(MemberOnboardingService);
  private readonly notificationService = inject(NotificationService);
  private readonly alertController = inject(AlertController);
  private readonly modalCtrl = inject(ModalController);


  readonly profile = this.profileService.profile;
  readonly userRole = this.profileService.userRole;
  readonly loading = this.profileService.loading;
  readonly error = this.profileService.error;
  readonly updating = this.profileService.updating;

  readonly selectedPhotoUrl = signal<string | null>(null);
  readonly selectedPhotoFile = signal<File | null>(null);
  readonly selectedBusinessLogoUrl = signal<string | null>(null);
  readonly selectedBusinessLogoFile = signal<File | null>(null);
  readonly isCompleteProfileModalOpen = signal<boolean>(false);
  readonly picLoadError = signal<boolean>(false);
  readonly logoLoadError = signal<boolean>(false);

  readonly registeredDevices = signal<any[]>([]);
  readonly loadingDevices = signal<boolean>(false);
  readonly togglingDeviceId = signal<string | null>(null);
  readonly deletingDeviceId = signal<string | null>(null);


  readonly isIncompleteProfile = computed(() => {
    const p = this.profile();
    if (!p) return false;
    return p.grade === 'INCOMPLETE';
  });
  
  readonly completionScore = computed(() => this.profile()?.completion_score || 0);
  readonly missingFields = computed(() => this.profile()?.missing_fields || []);

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
    gst_number: [''],
    category_id: [''],
    business_state_id: [''],
    business_district_id: [''],
    business_address: ['']
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
      documentTextOutline,
      powerOutline,
      banOutline,
      trashOutline,
      phonePortraitOutline,
      desktopOutline,
      refreshOutline
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

    this.profileForm.controls['business_state_id'].valueChanges.subscribe((stateId) => {
      this.profileForm.controls['business_district_id'].setValue('', { emitEvent: false });
      if (stateId) {
        this.profileService.fetchDistrictsByState(stateId);
      } else {
        this.profileService.clearDistricts();
      }
    });

    this.profileForm.controls['category_id'].valueChanges.subscribe((categoryId) => {
      if (categoryId) {
        const categories = this.onboardingService.categories();
        const selected = categories.find((c) => c.id === categoryId);
        if (selected && selected.description) {
          this.profileForm.controls['business_description'].setValue(selected.description);
        }
      }
    });

    // Synchronize form controls when profile signal updates
    effect(() => {
      const p = this.profile();
      if (p) {
        if (p.role === 'CUSTOMER') {
          this.profileForm.controls['full_name'].setValidators([Validators.required, Validators.minLength(2)]);
          this.profileForm.controls['whatsapp'].setValidators([Validators.minLength(10)]);
          this.profileForm.controls['email'].setValidators([Validators.required, Validators.email]);
          this.profileForm.controls['state_id'].setValidators([Validators.required]);
          this.profileForm.controls['district_id'].clearValidators();
          this.profileForm.controls['address'].clearValidators();
          this.profileForm.controls['business_name'].clearValidators();
          this.profileForm.controls['business_description'].clearValidators();
          this.profileForm.controls['website'].clearValidators();
          this.profileForm.controls['gst_number'].clearValidators();
          this.profileForm.controls['category_id'].clearValidators();
          this.profileForm.controls['business_state_id'].clearValidators();
          this.profileForm.controls['business_district_id'].clearValidators();
          this.profileForm.controls['business_address'].clearValidators();
        } else {
          this.profileForm.controls['full_name'].setValidators([Validators.required, Validators.minLength(2)]);
          this.profileForm.controls['whatsapp'].setValidators([Validators.minLength(10)]);
          this.profileForm.controls['email'].setValidators([Validators.required, Validators.email]);
          this.profileForm.controls['state_id'].setValidators([Validators.required]);
          this.profileForm.controls['district_id'].clearValidators();
          this.profileForm.controls['address'].clearValidators();
          this.profileForm.controls['business_name'].setValidators([Validators.required, Validators.minLength(2)]);
          this.profileForm.controls['business_description'].setValidators([Validators.required, Validators.minLength(5)]);
          this.profileForm.controls['category_id'].setValidators([Validators.required]);
          this.profileForm.controls['business_state_id'].setValidators([Validators.required]);
          this.profileForm.controls['business_district_id'].clearValidators();
          this.profileForm.controls['business_address'].clearValidators();
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
          state_id: p.state_id || p.business_state_id || '',
          district_id: p.district_id || p.business_district_id || '',
          address: p.address || '',
          business_name: p.business_name || '',
          business_description: p.business_description || '',
          website: p.website || '',
          gst_number: p.gst_number || '',
          category_id: p.category_id || '',
          business_state_id: p.business_state_id || p.state_id || '',
          business_district_id: p.business_district_id || p.district_id || '',
          business_address: p.business_address || ''
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
    this.onboardingService.fetchCategories();
    this.loadDevices();
  }

  loadDevices(): void {
    this.loadingDevices.set(true);
    this.notificationService.getUserDevices().subscribe({
      next: (devices) => {
        this.registeredDevices.set(devices || []);
        this.loadingDevices.set(false);
      },
      error: (err) => {
        console.error('Failed to load registered devices:', err);
        this.loadingDevices.set(false);
      }
    });
  }

  private async confirmAction(header: string, message: string, confirmText: string = 'Confirm'): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => resolve(false) },
          { text: confirmText, role: 'confirm', handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }

  async onToggleDeviceStatus(device: any): Promise<void> {
    if (!device || !device.id || this.togglingDeviceId()) return;
    const currentActive = device.is_active === true || device.is_active === 'true';
    const targetStatus = !currentActive;
    const actionName = targetStatus ? 'activate' : 'deactivate';
    const devName = device.device_name || device.device_model || (device.device_type ? `${device.device_type} Device` : 'this device');

    const confirmed = await this.confirmAction(
      `${targetStatus ? 'Activate' : 'Deactivate'} Device`,
      `Are you sure you want to ${actionName} "${devName}"?`,
      targetStatus ? 'Activate' : 'Deactivate'
    );

    if (!confirmed) return;

    this.togglingDeviceId.set(device.id);
    this.notificationService.toggleDeviceStatus(device.id, targetStatus).subscribe({
      next: (res) => {
        this.togglingDeviceId.set(null);
        const updatedStatus = (res && res.is_active !== undefined)
          ? (res.is_active === true || res.is_active === 'true')
          : targetStatus;

        this.registeredDevices.update(list =>
          list.map(d => d.id === device.id ? { ...d, is_active: updatedStatus } : d)
        );
        this.toastService.showSuccess(
          updatedStatus ? '🟢 Device activated successfully' : '🟠 Device deactivated successfully'
        );
      },
      error: (err) => {
        this.togglingDeviceId.set(null);
        console.error('Failed to update device status:', err);
        this.toastService.showError(err?.error?.message || 'Failed to update device status');
      }
    });
  }

  async onDeleteDevice(device: any): Promise<void> {
    if (!device || !device.id || this.deletingDeviceId()) return;
    const devName = device.device_name || device.device_model || (device.device_type ? `${device.device_type} Device` : 'this device');

    const confirmed = await this.confirmAction(
      'Delete Device',
      `Are you sure you want to delete "${devName}"? This action cannot be undone.`,
      'Delete'
    );

    if (!confirmed) return;

    this.deletingDeviceId.set(device.id);
    this.notificationService.deleteDevice(device.id).subscribe({
      next: () => {
        this.deletingDeviceId.set(null);
        this.registeredDevices.update(list => list.filter(d => d.id !== device.id));
        this.toastService.showSuccess('🗑️ Device deleted successfully');
      },
      error: (err) => {
        this.deletingDeviceId.set(null);
        console.error('Failed to delete device:', err);
        this.toastService.showError(err?.error?.message || 'Failed to delete device');
      }
    });
  }



  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
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
        this.selectedPhotoFile.set(data.file);
        this.selectedPhotoUrl.set(data.base64);
        this.picLoadError.set(false);
        this.profileService.updateProfilePic(data.base64);
        this.toastService.showSuccess('📸 Profile picture adjusted & cropped successfully!');
      }

      input.value = '';
    }
  }

  async onBusinessLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
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
          title: 'Crop Brand Image',
          roundCropper: false,
          outputFileName: 'brand-logo.jpg'
        }
      });

      await modal.present();
      const { data, role } = await modal.onDidDismiss<ImageCropResult>();

      if (role === 'confirm' && data) {
        this.selectedBusinessLogoFile.set(data.file);
        this.selectedBusinessLogoUrl.set(data.base64);
        this.logoLoadError.set(false);
        this.toastService.showSuccess('📸 Brand image adjusted & cropped successfully!');
      }

      input.value = '';
    }
  }

  getInitials(name?: string | null): string {
    if (!name || !name.trim()) return 'U';
    return name.trim().charAt(0).toUpperCase();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.showError('⚠️ Please fix the errors in the form.');
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
      formData.append('whatsapp', formVal.whatsapp || '');
      if (formVal.email) formData.append('email', formVal.email);
      if (formVal.state_id) formData.append('state_id', formVal.state_id);
      if (formVal.district_id) formData.append('district_id', formVal.district_id);
      if (formVal.address) formData.append('address', formVal.address);
      if (this.userRole() !== 'CUSTOMER') {
        if (formVal.business_name) formData.append('business_name', formVal.business_name);
        if (formVal.business_description) formData.append('business_description', formVal.business_description);
        if (formVal.website) formData.append('website', formVal.website);
        if (formVal.gst_number) formData.append('gst_number', formVal.gst_number);
        if (formVal.category_id) formData.append('category_id', formVal.category_id);
        if (formVal.business_state_id) formData.append('business_state_id', formVal.business_state_id);
        if (formVal.business_district_id) formData.append('business_district_id', formVal.business_district_id);
        if (formVal.business_address) formData.append('business_address', formVal.business_address);
      }
      if (photoFile) formData.append('profile_pic', photoFile, photoFile.name || 'profile.jpg');
      if (logoFile) formData.append('business_logo', logoFile, logoFile.name || 'logo.jpg');
      payload = formData;
    } else {
      payload = {
        full_name: formVal.full_name,
        phone: formVal.phone || this.profile()?.phone || '',
        whatsapp: formVal.whatsapp || '',
        email: formVal.email,
        state_id: formVal.state_id || null,
        district_id: formVal.district_id || null,
        address: formVal.address
      };
      if (this.userRole() !== 'CUSTOMER') {
        Object.assign(payload, {
          business_name: formVal.business_name,
          business_description: formVal.business_description,
          website: formVal.website,
          gst_number: formVal.gst_number,
          category_id: formVal.category_id,
          business_state_id: formVal.business_state_id || null,
          business_district_id: formVal.business_district_id || null,
          business_address: formVal.business_address
        });
      }
    }


    this.profileService.updateProfile(payload).subscribe({
      next: () => {
        this.selectedPhotoFile.set(null);
        this.selectedBusinessLogoFile.set(null);
      },
      error: (err) => {
        // Interceptor handles the error toast
      }
    });
  }

  async onLogout(): Promise<void> {
    this.toastService.showSuccess('👋 Logging out...');
    await Preferences.remove({ key: 'mockRole' });
    this.profileService.clearProfile();
    await this.authSession.logout(true);
  }

  closeCompleteProfileModal(): void {
    this.isCompleteProfileModalOpen.set(false);
  }

  retryLoad(): void {
    this.profileService.loadProfile().subscribe();
  }
}
