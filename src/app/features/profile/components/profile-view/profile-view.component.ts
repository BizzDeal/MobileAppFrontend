import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonToast
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  callOutline,
  cameraOutline,
  checkmarkCircleOutline,
  locationOutline,
  logOutOutline,
  logoWhatsapp,
  mailOutline,
  personOutline,
  businessOutline,
  globeOutline,
  documentTextOutline
} from 'ionicons/icons';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    ReactiveFormsModule,
    IonSpinner,
    IonIcon,
    IonInput,
    IonTextarea,
    IonToast
  ],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileViewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly profileService = inject(ProfileService);

  readonly profile = this.profileService.profile;
  readonly loading = this.profileService.loading;
  readonly error = this.profileService.error;
  readonly updating = this.profileService.updating;

  readonly toastMessage = signal<string | null>(null);
  readonly selectedPhotoUrl = signal<string | null>(null);
  readonly selectedBusinessLogoUrl = signal<string | null>(null);

  readonly profileForm: FormGroup = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    whatsapp: ['', [Validators.required, Validators.minLength(10)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    business_name: ['', Validators.required],
    business_description: ['', Validators.required],
    website: ['', Validators.required],
    gst_number: ['', Validators.required]
  });

  constructor() {
    addIcons({
      personOutline,
      callOutline,
      logoWhatsapp,
      mailOutline,
      locationOutline,
      cameraOutline,
      logOutOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      businessOutline,
      globeOutline,
      documentTextOutline
    });

    // Synchronize form controls when profile signal updates
    effect(() => {
      const p = this.profile();
      if (p) {
        this.profileForm.patchValue({
          full_name: p.full_name,
          phone: p.phone,
          whatsapp: p.whatsapp,
          email: p.email,
          address: p.address,
          business_name: p.business_name || '',
          business_description: p.business_description || '',
          website: p.website || '',
          gst_number: p.gst_number || ''
        }, { emitEvent: false });
        
        if (p.profile_pic_url && !this.selectedPhotoUrl()) {
          this.selectedPhotoUrl.set(p.profile_pic_url);
        }
        if (p.business_logo_url && !this.selectedBusinessLogoUrl()) {
          this.selectedBusinessLogoUrl.set(p.business_logo_url);
        }
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const resultUrl = reader.result as string;
        this.selectedPhotoUrl.set(resultUrl);
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
      const reader = new FileReader();
      reader.onload = () => {
        const resultUrl = reader.result as string;
        this.selectedBusinessLogoUrl.set(resultUrl);
        this.showToast('📸 Brand image updated successfully!');
        // Note: In real app, we'd also update the profile service/backend
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.showToast('⚠️ Please fix the errors in the form.');
      return;
    }

    const payload = this.profileForm.value;
    this.profileService.updateProfile(payload).subscribe({
      next: () => {
        this.showToast('✅ Profile saved successfully!');
      },
      error: (err) => {
        this.showToast(`❌ Error: ${err.message || 'Could not save profile'}`);
      }
    });
  }

  onLogout(): void {
    this.showToast('👋 Logging out...');
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 800);
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
  }

  retryLoad(): void {
    this.profileService.loadProfile().subscribe();
  }
}
