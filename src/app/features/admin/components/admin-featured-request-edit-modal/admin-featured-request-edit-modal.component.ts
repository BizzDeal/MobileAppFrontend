import {
  Component,
  Input,
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
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  saveOutline,
  imageOutline,
  closeCircleOutline,
  calendarOutline,
  documentTextOutline,
  pricetagOutline,
  starOutline,
} from 'ionicons/icons';

import {
  FeaturedBusinessRequestDTO,
  FeaturedRequestStatus,
} from '../../../business/models/featured-business.model';
import { FeaturedBusinessService } from '../../../business/services/featured-business.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ImageCropperModalComponent, ImageCropResult } from '../../../../shared/components/image-cropper-modal/image-cropper-modal.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { validateFileSize } from '../../../../shared/utils/file-validator.util';
import { compressImageClientSide } from '../../../../shared/utils/image-compressor.util';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';

@Component({
  selector: 'app-admin-featured-request-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    IonSelect,
    IonSelectOption,
    CachedImgDirective,
  ],
  templateUrl: './admin-featured-request-edit-modal.component.html',
  styleUrls: ['./admin-featured-request-edit-modal.component.scss'],
})
export class AdminFeaturedRequestEditModalComponent implements OnInit {
  @Input({ required: true }) request!: FeaturedBusinessRequestDTO;

  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);
  private readonly featuredService = inject(FeaturedBusinessService);
  private readonly toastService = inject(ToastService);

  readonly submitting = signal(false);
  readonly selectedBannerPreview = signal<string | null>(null);
  readonly selectedBannerFile = signal<File | null>(null);

  editForm!: FormGroup;

  readonly statusOptions: FeaturedRequestStatus[] = [
    'APPROVED',
    'PENDING',
    'REJECTED',
    'CANCELLED',
    'EXPIRED',
  ];

  constructor() {
    addIcons({
      closeOutline,
      saveOutline,
      imageOutline,
      closeCircleOutline,
      calendarOutline,
      documentTextOutline,
      pricetagOutline,
      starOutline,
    });
  }

  ngOnInit(): void {
    const startDateFormatted = this.formatDateForInput(this.request.start_date);
    const endDateFormatted = this.formatDateForInput(this.request.end_date);

    this.editForm = this.fb.group(
      {
        title: [
          this.request.title || '',
          [Validators.required, Validators.minLength(3)],
        ],
        description: [
          this.request.description || '',
          [Validators.required, Validators.minLength(10)],
        ],
        start_date: [startDateFormatted, [Validators.required]],
        end_date: [endDateFormatted, [Validators.required]],
        status: [this.request.status || 'APPROVED', [Validators.required]],
        rejection_reason: [this.request.rejection_reason || ''],
      },
      { validators: this.dateValidator.bind(this) },
    );

    if (this.request.banner?.file_url) {
      this.selectedBannerPreview.set(this.request.banner.file_url);
    }
  }

  dismiss(data?: { success?: boolean; updated?: FeaturedBusinessRequestDTO }): void {
    this.modalCtrl.dismiss(data);
  }

  dateValidator(group: AbstractControl) {
    const startVal = group.get('start_date')?.value;
    const endVal = group.get('end_date')?.value;
    if (!startVal || !endVal) return null;

    const start = new Date(startVal);
    const end = new Date(endVal);

    if (end <= start) {
      return { dateMismatch: true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private formatDateForInput(isoDate?: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  async onBannerSelected(event: Event): Promise<void> {
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
        this.selectedBannerFile.set(file);
        this.selectedBannerPreview.set(data.base64);
        this.toastService.showSuccess('📸 Banner updated and cropped!');
      }

      input.value = '';
    }
  }

  clearBanner(): void {
    this.selectedBannerFile.set(null);
    this.selectedBannerPreview.set(this.request.banner?.file_url || null);
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const fv = this.editForm.value;
    const formData = new FormData();

    formData.append('title', fv.title.trim());
    formData.append('description', fv.description.trim());
    formData.append('start_date', new Date(fv.start_date).toISOString());
    formData.append('end_date', new Date(fv.end_date).toISOString());
    formData.append('status', fv.status);

    if (fv.rejection_reason && fv.rejection_reason.trim()) {
      formData.append('rejection_reason', fv.rejection_reason.trim());
    }

    if (this.selectedBannerFile()) {
      formData.append('banner', this.selectedBannerFile()!);
    }

    this.featuredService.adminUpdateRequest(this.request.id, formData).subscribe({
      next: (updated: FeaturedBusinessRequestDTO) => {
        this.submitting.set(false);
        this.toastService.showSuccess('Featured request updated successfully!');
        this.dismiss({ success: true, updated });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toastService.showError(
          extractFriendlyErrorMessage(err, 'Failed to update featured request.'),
        );
      },
    });
  }
}
