import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
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
  IonBackButton,
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
  saveOutline,
  imageOutline,
  closeCircleOutline,
  alertCircleOutline,
  lockClosedOutline,
  timeOutline,
  trashOutline,
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
import {
  FeaturedBusinessRequestDTO,
  CategoryLiveStatusDTO,
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
    IonBackButton,
    IonIcon,
    IonSpinner,
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

  readonly submitting = signal(false);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly existingRequest = signal<FeaturedBusinessRequestDTO | null>(null);
  readonly categoryLiveInfo = signal<CategoryLiveStatusDTO | null>(null);
  readonly isCategoryLocked = signal(false);

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
      saveOutline,
      imageOutline,
      closeCircleOutline,
      alertCircleOutline,
      lockClosedOutline,
      timeOutline,
      trashOutline,
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
            this.fetchRequestsAndCategoryStatus(p.category_id);
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
      this.fetchRequestsAndCategoryStatus(profile.category_id);
    }
  }

  private fetchRequestsAndCategoryStatus(categoryId?: string) {
    this.featuredService.getMyRequests().subscribe({
      next: (requests) => {
        if (requests && requests.length > 0) {
          const latest = requests[0];
          this.existingRequest.set(latest);
          this.patchFormWithRequest(latest);
        }

        const catId =
          categoryId ||
          this.existingRequest()?.category_id ||
          this.profileService.profile()?.category_id;

        if (catId) {
          this.checkCategoryStatus(catId);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load my featured requests:', err);
        this.loading.set(false);
      },
    });
  }

  private checkCategoryStatus(categoryId: string) {
    this.featuredService.getCategoryLiveStatus(categoryId).subscribe({
      next: (status) => {
        this.categoryLiveInfo.set(status);
        const myBizId = this.profileService.profile()?.business_id;

        // If another business is currently live in this category, lock request submission
        if (
          status.is_live &&
          status.live_request &&
          status.live_request.business_id !== myBizId
        ) {
          this.isCategoryLocked.set(true);
        } else {
          this.isCategoryLocked.set(false);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to check category status:', err);
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

    const bannerUrl = req.banner?.file_url;
    if (bannerUrl) {
      this.selectedBannerPreview.set(bannerUrl);
    }
  }

  dateValidator(group: AbstractControl) {
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
    this.selectedBannerPreview.set(null);
  }

  onSubmit() {
    if (this.isCategoryLocked()) {
      this.toastService.showError(
        'A featured business is currently active in your category. New requests cannot be submitted while one is live.',
      );
      return;
    }

    if (this.featuredForm.invalid) {
      this.featuredForm.markAllAsTouched();
      return;
    }

    if (!this.selectedBannerFile() && !this.selectedBannerPreview()) {
      this.toastService.showError('Please upload a promotional banner image for your featured request.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const fv = this.featuredForm.value;
    const formData = new FormData();
    formData.append('title', fv.title.trim());
    formData.append('description', fv.description.trim());
    formData.append('start_date', new Date(fv.start_date).toISOString());
    formData.append('end_date', new Date(fv.end_date).toISOString());

    if (this.selectedBannerFile()) {
      formData.append('banner', this.selectedBannerFile()!);
    }

    const profile = this.profileService.profile();
    if (profile?.business_id) {
      formData.append('business_id', profile.business_id);
    }

    this.featuredService.submitRequest(formData).subscribe({
      next: (req) => {
        this.submitting.set(false);
        this.existingRequest.set(req);
        this.dashboardService.loadDashboardData().subscribe();
        this.toastService.showSuccess('🎉 Featured Business request submitted for Admin review!');
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

    const alert = await this.alertCtrl.create({
      header: 'Cancel Request',
      message: 'Are you sure you want to cancel your pending featured business request?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes, Cancel',
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
      next: () => {
        this.submitting.set(false);
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
