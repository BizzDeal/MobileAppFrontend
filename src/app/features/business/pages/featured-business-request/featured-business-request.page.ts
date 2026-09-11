import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonInput,
  IonTextarea,
  IonIcon,
  IonSpinner,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  starOutline,
  star,
  pricetagOutline,
  documentTextOutline,
  calendarOutline,
  imageOutline,
  closeCircleOutline,
  alertCircleOutline,
  lockClosedOutline,
  timeOutline,
  trashOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { FeaturedBusinessService } from '../../services/featured-business.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MemberDashboardService } from '../../../home/services/member-dashboard.service';
import { ImageCropperModalComponent, ImageCropResult } from '../../../../shared/components/image-cropper-modal/image-cropper-modal.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { validateFileSize } from '../../../../shared/utils/file-validator.util';
import { compressImageClientSide } from '../../../../shared/utils/image-compressor.util';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { AppBackButtonService } from '../../../../core/platform/app-back-button.service';
import {
  FeaturedBusinessRequestDTO,
} from '../../models/featured-business.model';

@Component({
  selector: 'app-featured-business-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonSpinner,
    IonInput,
    IonTextarea,
    CachedImgDirective,
  ],
  templateUrl: './featured-business-request.page.html',
  styleUrls: ['./featured-business-request.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedBusinessRequestPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);
  private readonly featuredService = inject(FeaturedBusinessService);
  private readonly profileService = inject(ProfileService);
  private readonly dashboardService = inject(MemberDashboardService);
  private readonly toastService = inject(ToastService);
  private readonly backButtonService = inject(AppBackButtonService);

  readonly submitting = signal(false);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly existingRequest = signal<FeaturedBusinessRequestDTO | null>(null);
  readonly isApproved = computed(() => this.existingRequest()?.status === 'APPROVED');

  readonly selectedBannerName = signal<string | null>(null);
  readonly selectedBannerPreview = signal<string | null>(null);
  readonly selectedBannerFile = signal<File | null>(null);

  featuredForm: FormGroup;
  minStartDateString = '';

  constructor() {
    addIcons({
      starOutline,
      star,
      pricetagOutline,
      documentTextOutline,
      calendarOutline,
      imageOutline,
      closeCircleOutline,
      alertCircleOutline,
      lockClosedOutline,
      timeOutline,
      trashOutline,
      arrowBackOutline,
    });

    const now = new Date();
    this.minStartDateString = this.formatDateForInput(now.toISOString());

    const startDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours in future
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    this.featuredForm = this.fb.group(
      {
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
        start_date: [
          this.formatDateForInput(startDate.toISOString()),
          [Validators.required],
        ],
        end_date: [
          this.formatDateForInput(endDate.toISOString()),
          [Validators.required],
        ],
      },
      { validators: this.dateValidator.bind(this) },
    );
  }

  goBack(): void {
    this.backButtonService.back('/home');
  }

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.loading.set(true);
    this.errorMessage.set(null);

    const profile = this.profileService.profile();
    if (!profile?.business_id) {
      this.profileService.loadProfile().subscribe({
        next: (p) => {
          if (p?.business_id) {
            this.fetchRequests(p.business_id);
          } else {
            this.loading.set(false);
            this.errorMessage.set(
              'Could not find your business profile. Please complete your business profile first.',
            );
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            extractFriendlyErrorMessage(
              err,
              'Failed to load your business details.',
            ),
          );
        },
      });
    } else {
      this.fetchRequests(profile.business_id);
    }
  }

  private fetchRequests(businessId: string) {
    this.featuredService.getMyRequests().subscribe({
      next: (requests) => {
        const businessRequests = requests.filter((req) => req.business_id === businessId);
        const latest = businessRequests.find((req) => req.status === 'APPROVED')
          || businessRequests.find((req) => req.status === 'PENDING')
          || businessRequests[0];
        if (latest) {
          this.existingRequest.set(latest);
          this.patchFormWithRequest(latest);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to load your featured request.'));
        this.loading.set(false);
      },
    });
  }

  private patchFormWithRequest(req: FeaturedBusinessRequestDTO) {
    this.featuredForm.patchValue({
      title: req.title || '',
      description: req.description || '',
      start_date: this.formatDateForInput(req.start_date),
      end_date: this.formatDateForInput(req.end_date),
    });

    if (req.status === 'APPROVED') {
      this.featuredForm.get('start_date')?.disable();
      this.featuredForm.get('end_date')?.disable();
    } else {
      this.featuredForm.get('start_date')?.enable();
      this.featuredForm.get('end_date')?.enable();
    }

    this.selectedBannerPreview.set(req.banner?.file_url || null);
  }

  dateValidator(group: AbstractControl) {
    // If request is already approved, dates are locked and cannot be edited
    if (this.isApproved()) return null;

    const startVal = group.get('start_date')?.value;
    const endVal = group.get('end_date')?.value;

    if (!startVal || !endVal) return null;

    const start = new Date(startVal);
    const end = new Date(endVal);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const errors: Record<string, boolean> = {};

    if (start < fiveMinutesAgo) {
      errors['pastDate'] = true;
    }

    if (end <= start) {
      errors['dateMismatch'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.featuredForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private formatDateForInput(isoDate?: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  async onBannerSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const rawFile = input.files?.[0];
    if (rawFile) {
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
          title: 'Crop Featured Store Banner',
          roundCropper: false,
          aspectRatio: 16 / 9,
          targetWidth: 900,
          targetHeight: 506,
          outputFileName: 'featured-banner.jpg',
        },
      });

      await modal.present();
      const { data, role } = await modal.onDidDismiss<ImageCropResult>();

      if (role === 'confirm' && data) {
        const file = await compressImageClientSide(data.file);
        this.selectedBannerName.set(file.name);
        this.selectedBannerFile.set(file);
        this.selectedBannerPreview.set(data.base64);
        this.toastService.showSuccess('📸 Banner cropped and attached!');
      }

      input.value = '';
    }
  }

  clearSelectedBanner(event: Event) {
    event.stopPropagation();
    this.selectedBannerName.set(null);
    this.selectedBannerFile.set(null);
    this.selectedBannerPreview.set(this.existingRequest()?.banner?.file_url || null);
  }

  onSubmit() {
    if (this.submitting() || this.loading()) return;

    if (this.featuredForm.invalid) {
      this.featuredForm.markAllAsTouched();
      return;
    }

    if (!this.isApproved() && !this.selectedBannerFile() && !this.selectedBannerPreview()) {
      this.toastService.showError('Please upload a promotional banner image for your featured request.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const fv = this.featuredForm.getRawValue();
    const formData = new FormData();
    formData.append('title', fv.title.trim());
    formData.append('description', fv.description.trim());
    const preservedStartDate = fv.start_date || this.existingRequest()?.start_date;
    const preservedEndDate = fv.end_date || this.existingRequest()?.end_date;
    if (preservedStartDate && preservedEndDate) {
      formData.append('start_date', new Date(preservedStartDate).toISOString());
      formData.append('end_date', new Date(preservedEndDate).toISOString());
    }

    const bannerFile = this.selectedBannerFile();
    if (bannerFile) {
      formData.append('banner', bannerFile);
    }

    const wasApproved = this.isApproved();

    this.featuredService.submitRequest(formData).subscribe({
      next: (req) => {
        this.submitting.set(false);
        this.existingRequest.set(req);
        this.dashboardService.updateFeaturedRequest(req);
        const successMsg = wasApproved
          ? '✨ Featured showcase details updated successfully!'
          : '🎉 Featured Business request submitted for Admin review!';
        this.toastService.showSuccess(successMsg);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Submit featured request failed:', err);
        this.errorMessage.set(
          extractFriendlyErrorMessage(
            err,
            'Failed to submit featured business request. Please check inputs and try again.',
          ),
        );
      },
    });
  }

  async confirmCancelRequest() {
    const req = this.existingRequest();
    if (!req) return;

    const isApproved = req.status === 'APPROVED';
    const alert = await this.alertCtrl.create({
      header: isApproved ? 'Cancel Featured Business' : 'Cancel Request',
      message: isApproved
        ? 'Are you sure you want to cancel your approved featured business showcase? This will immediately revoke your featured spotlight status and free up the spot in your category.'
        : 'Are you sure you want to cancel your pending featured business request?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: isApproved ? 'Yes, Revoke Spotlight' : 'Yes, Cancel',
          role: 'destructive',
          handler: () => {
            this.cancelRequest(req.id);
          },
        },
      ],
    });

    await alert.present();
  }

  private cancelRequest(id: string) {
    this.submitting.set(true);
    this.featuredService.cancelRequest(id).subscribe({
      next: (cancelled) => {
        this.submitting.set(false);
        this.existingRequest.set(cancelled);
        this.featuredForm.get('start_date')?.enable();
        this.featuredForm.get('end_date')?.enable();
        this.dashboardService.loadDashboardData().subscribe();
        this.toastService.showSuccess('Featured request cancelled successfully.');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          extractFriendlyErrorMessage(err, 'Failed to cancel request.'),
        );
      },
    });
  }
}
