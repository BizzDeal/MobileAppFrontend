import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  refreshOutline,
  pencilOutline,
  storefrontOutline,
  peopleOutline,
  ticketOutline,
  cashOutline,
  chevronForwardOutline
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
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
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
  private readonly destroyRef = inject(DestroyRef);


  readonly getAvatarColor = getAvatarColor;

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
  readonly activeEditSection = signal<'personal' | 'business' | 'all' | null>(null);
  readonly isPersonalEditing = computed(() => this.activeEditSection() === 'personal' || this.activeEditSection() === 'all');
  readonly isBusinessEditing = computed(() => this.activeEditSection() === 'business' || this.activeEditSection() === 'all');
  readonly isEditMode = computed(() => this.activeEditSection() !== null);
  readonly hasPendingImage = computed(() => !!this.selectedPhotoFile() || !!this.selectedBusinessLogoFile());
    
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
  readonly userStats = computed(() => this.profile()?.stats || {
    stores_visited: 0,
    customers_dealt: 0,
    profit_gained: 0,
  });

  readonly profileForm: FormGroup = this.fb.group({
    full_name: ['', [Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    whatsapp: ['', [Validators.minLength(10)]],
    email: ['', [Validators.email]],
    state_id: [''],
    district_id: ['', [Validators.required]],
    pincode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
    address: [''],
    business_name: [''],
    business_description: [''],
    website: [''],
    gst_number: [''],
    category_id: [''],
    business_state_id: [''],
    business_district_id: ['', [Validators.required]],
    business_pincode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
    business_address: [''],
    video_url: ['']
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
      refreshOutline,
      pencilOutline,
      storefrontOutline,
      peopleOutline,
      ticketOutline,
      cashOutline,
      chevronForwardOutline
    });

    this.profileService.fetchStates();

    effect(() => {
      const states = this.profileService.states();
      if (states.length > 0) {
        const apState = states.find((s) => s.name.toLowerCase().includes('andhra pradesh'));
        if (apState) {
          if (this.profileForm.controls['state_id'].value !== apState.id) {
            this.profileForm.controls['state_id'].setValue(apState.id, { emitEvent: false });
            this.profileService.fetchDistrictsByState(apState.id);
          }
          if (this.profileForm.controls['business_state_id'].value !== apState.id) {
            this.profileForm.controls['business_state_id'].setValue(apState.id, { emitEvent: false });
          }
          this.profileForm.controls['state_id'].disable({ emitEvent: false });
          this.profileForm.controls['business_state_id'].disable({ emitEvent: false });
        }
      }
    });

    this.profileForm.controls['state_id'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stateId) => {
      if (stateId) {
        this.profileService.fetchDistrictsByState(stateId);
      } else {
        this.profileService.clearDistricts();
      }
    });

    this.profileForm.controls['business_state_id'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stateId) => {
      if (stateId) {
        this.profileService.fetchDistrictsByState(stateId);
      } else {
        this.profileService.clearDistricts();
      }
    });

    this.profileForm.controls['category_id'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((categoryId) => {
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
          this.profileForm.controls['district_id'].setValidators([Validators.required]);
          this.profileForm.controls['pincode'].setValidators([Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]);
          this.profileForm.controls['address'].clearValidators();
          this.profileForm.controls['business_name'].clearValidators();
          this.profileForm.controls['business_description'].clearValidators();
          this.profileForm.controls['website'].clearValidators();
          this.profileForm.controls['gst_number'].clearValidators();
          this.profileForm.controls['category_id'].clearValidators();
          this.profileForm.controls['business_state_id'].clearValidators();
          this.profileForm.controls['business_district_id'].clearValidators();
          this.profileForm.controls['business_pincode'].clearValidators();
          this.profileForm.controls['business_address'].clearValidators();
          this.profileForm.controls['video_url'].clearValidators();
        } else {
          this.profileForm.controls['full_name'].setValidators([Validators.required, Validators.minLength(2)]);
          this.profileForm.controls['whatsapp'].setValidators([Validators.minLength(10)]);
          this.profileForm.controls['email'].setValidators([Validators.required, Validators.email]);
          this.profileForm.controls['state_id'].setValidators([Validators.required]);
          this.profileForm.controls['district_id'].setValidators([Validators.required]);
          this.profileForm.controls['pincode'].setValidators([Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]);
          this.profileForm.controls['address'].clearValidators();
          this.profileForm.controls['business_name'].setValidators([Validators.required, Validators.minLength(2)]);
          this.profileForm.controls['business_description'].setValidators([Validators.required, Validators.minLength(5)]);
          this.profileForm.controls['category_id'].setValidators([Validators.required]);
          this.profileForm.controls['business_state_id'].setValidators([Validators.required]);
          this.profileForm.controls['business_district_id'].setValidators([Validators.required]);
          this.profileForm.controls['business_pincode'].setValidators([Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]);
          this.profileForm.controls['business_address'].clearValidators();
          this.profileForm.controls['website'].clearValidators();
          this.profileForm.controls['video_url'].clearValidators();
          this.profileForm.controls['gst_number'].clearValidators();
        }
        Object.keys(this.profileForm.controls).forEach(key => {
          this.profileForm.controls[key].updateValueAndValidity({ emitEvent: false });
        });

        const states = this.profileService.states();
        const apState = states.find((s) => s.name.toLowerCase().includes('andhra pradesh'));
        const targetStateId = apState?.id || p.state_id || p.business_state_id || '';
        const targetBusinessStateId = apState?.id || p.business_state_id || p.state_id || '';

        this.profileForm.patchValue({
          full_name: p.full_name || '',
          phone: p.phone || '',
          whatsapp: p.whatsapp || '',
          email: p.email || '',
          state_id: targetStateId,
          district_id: p.district_id || p.business_district_id || '',
          pincode: p.pincode || '',
          address: p.address || '',
          business_name: p.business_name || '',
          business_description: p.business_description || '',
          website: p.website || '',
          gst_number: p.gst_number || '',
          category_id: p.category_id || '',
          business_state_id: targetBusinessStateId,
          business_district_id: p.business_district_id || p.district_id || '',
          business_pincode: p.business_pincode || p.pincode || '',
          business_address: p.business_address || '',
          video_url: p.video_url || ''
        }, { emitEvent: false });

        this.profileForm.controls['state_id'].disable({ emitEvent: false });
        this.profileForm.controls['business_state_id'].disable({ emitEvent: false });

        if (targetStateId) {
          this.profileService.fetchDistrictsByState(targetStateId);
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
        this.selectedBusinessLogoFile.set(data.file);
        this.selectedBusinessLogoUrl.set(data.base64);
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

    const formVal = this.profileForm.getRawValue();
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
      if (formVal.pincode) formData.append('pincode', formVal.pincode);
      if (formVal.address) formData.append('address', formVal.address);
      if (this.userRole() !== 'CUSTOMER') {
        if (formVal.business_name) formData.append('business_name', formVal.business_name);
        if (formVal.business_description) formData.append('business_description', formVal.business_description);
        if (formVal.website) formData.append('website', formVal.website);
        if (formVal.gst_number) formData.append('gst_number', formVal.gst_number);
        if (formVal.category_id) formData.append('category_id', formVal.category_id);
        if (formVal.business_state_id) formData.append('business_state_id', formVal.business_state_id);
        if (formVal.business_district_id) formData.append('business_district_id', formVal.business_district_id);
        if (formVal.business_pincode) formData.append('business_pincode', formVal.business_pincode);
        if (formVal.business_address) formData.append('business_address', formVal.business_address);
        formData.append('video_url', formVal.video_url || '');
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
        pincode: formVal.pincode || null,
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
          business_pincode: formVal.business_pincode || null,
          business_address: formVal.business_address,
          video_url: formVal.video_url
        });
      }
    }


    this.profileService.updateProfile(payload).subscribe({
      next: () => {
        this.selectedPhotoFile.set(null);
        this.selectedBusinessLogoFile.set(null);
        this.activeEditSection.set(null);
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

  toggleEditSection(section: 'personal' | 'business' | null): void {
    if (section === null) {
      this.revertFormValues();
      this.activeEditSection.set(null);
    } else {
      this.activeEditSection.set(section);
    }
  }

  toggleEditMode(mode: boolean): void {
    if (!mode) {
      this.revertFormValues();
      this.activeEditSection.set(null);
    } else {
      this.activeEditSection.set('all');
    }
  }

  private revertFormValues(): void {
    const p = this.profile();
    if (p) {
      const states = this.profileService.states();
      const apState = states.find((s) => s.name.toLowerCase().includes('andhra pradesh'));
      const targetStateId = apState?.id || p.state_id || p.business_state_id || '';
      const targetBusinessStateId = apState?.id || p.business_state_id || p.state_id || '';

      this.profileForm.patchValue({
        full_name: p.full_name || '',
        phone: p.phone || '',
        whatsapp: p.whatsapp || '',
        email: p.email || '',
        state_id: targetStateId,
        district_id: p.district_id || p.business_district_id || '',
        address: p.address || '',
        business_name: p.business_name || '',
        business_description: p.business_description || '',
        website: p.website || '',
        gst_number: p.gst_number || '',
        category_id: p.category_id || '',
        business_state_id: targetBusinessStateId,
        business_district_id: p.business_district_id || p.district_id || '',
        business_address: p.business_address || '',
        video_url: p.video_url || ''
      }, { emitEvent: false });
      
      this.selectedPhotoFile.set(null);
      this.selectedPhotoUrl.set(p.profile_pic_url || null);
      this.selectedBusinessLogoFile.set(null);
      this.selectedBusinessLogoUrl.set(p.business_logo_url || null);
    }
  }

  getStateName(stateId: string | null | undefined): string {
    if (!stateId) return this.profile()?.state_name || 'N/A';
    const state = this.profileService.states().find(s => s.id === stateId);
    return state ? state.name : (this.profile()?.state_name || 'N/A');
  }

  getDistrictName(districtId: string | null | undefined): string {
    if (!districtId) return this.profile()?.district_name || 'N/A';
    const district = this.profileService.districts().find(d => d.id === districtId);
    return district ? district.name : (this.profile()?.district_name || 'N/A');
  }

  getCategoryName(categoryId: string | null | undefined): string {
    if (!categoryId) return this.profile()?.primary_business_category_name || 'N/A';
    const cat = this.onboardingService.categories().find(c => c.id === categoryId);
    return cat ? cat.name : (this.profile()?.primary_business_category_name || 'N/A');
  }
}
