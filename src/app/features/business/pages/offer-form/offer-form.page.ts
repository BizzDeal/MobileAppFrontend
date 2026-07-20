import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../../core/interceptors/interceptor.tokens';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonInput, IonTextarea, IonSelect, IonSelectOption, IonIcon, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { imageOutline, saveOutline, arrowBackOutline, calendarOutline, pricetagOutline, documentTextOutline, optionsOutline, cashOutline, calculatorOutline, closeCircleOutline } from 'ionicons/icons';
import { MemberDashboardService } from '../../../home/services/member-dashboard.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { environment } from '../../../../../environments/environment';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

@Component({
  selector: 'app-offer-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonInput, IonTextarea, IonSelect, IonSelectOption, IonIcon, IonDatetime, IonDatetimeButton, IonModal,
    CachedImgDirective
  ],
  templateUrl: './offer-form.page.html',
  styleUrls: ['./offer-form.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly dashboardService = inject(MemberDashboardService);
  private readonly profileService = inject(ProfileService);

  readonly isEditMode = signal(false);
  readonly offerId = signal<string | null>(null);
  readonly selectedImageName = signal<string | null>(null);
  readonly selectedImagePreview = signal<string | null>(null);
  readonly selectedImageFile = signal<File | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  offerForm: FormGroup;

  constructor() {
    addIcons({ imageOutline, saveOutline, arrowBackOutline, calendarOutline, pricetagOutline, documentTextOutline, optionsOutline, cashOutline, calculatorOutline, closeCircleOutline });
    
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.offerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      offer_category: ['', Validators.required],
      discount_value: [null, [Validators.required, Validators.min(0)]],
      start_date: [now.toISOString(), Validators.required],
      end_date: [nextMonth.toISOString(), Validators.required],
    }, { validators: this.dateValidator });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.offerId.set(id);
      this.loadOfferDetails(id);
    } else {
      if (!this.profileService.profile()?.business_id) {
        this.profileService.loadProfile().subscribe();
      }
    }
  }

  loadOfferDetails(id: string) {
    const data = this.dashboardService.dashboardData();
    const cachedOffer = data?.myOffers?.find(o => o.id === id);
    if (cachedOffer) {
      this.patchOfferValues(cachedOffer);
    }
    
    this.http.get<any>(`${environment.apiUrl}/offers/${id}`).subscribe({
      next: (res) => {
        const o = res?.data || res;
        if (o) {
          this.patchOfferValues(o);
        }
      },
      error: (err) => {
        console.error('Failed to load offer details from API, trying dashboard data:', err);
        if (!cachedOffer) {
          this.dashboardService.loadDashboardData().subscribe({
            next: (dashboardData) => {
              const offer = dashboardData?.myOffers?.find(o => o.id === id);
              if (offer) this.patchOfferValues(offer);
            }
          });
        }
      }
    });
  }

  private patchOfferValues(offer: any) {
    let category = '';
    if (offer.offer_type === 'DISCOUNT') {
      category = offer.discount_type === 'PERCENTAGE' ? 'PERCENTAGE_DEAL' : 'FLAT_OFFER';
    } else if (offer.offer_type === 'CASHBACK') {
      category = 'CASHBACK';
    }

    this.offerForm.patchValue({
      title: offer.title || '',
      description: offer.description || '',
      offer_category: category,
      discount_value: offer.discount_value ?? null,
      start_date: offer.start_date || new Date().toISOString(),
      end_date: offer.end_date || new Date().toISOString(),
    });
    const previewUrl = offer.imageUrl || offer.image_url || offer.image?.file_url;
    if (previewUrl) {
      this.selectedImagePreview.set(previewUrl);
    } else if (offer.image_id) {
      this.http.get<any>(`${environment.apiUrl}/media/${offer.image_id}`).subscribe({
        next: (res) => {
          const m = res?.data || res;
          if (m?.file_url) {
            this.selectedImagePreview.set(m.file_url);
          }
        },
        error: (err) => console.error('Failed to load media preview for image_id:', err)
      });
    }
  }

  dateValidator(group: FormGroup) {
    const start = group.get('start_date')?.value;
    const end = group.get('end_date')?.value;
    if (start && end && new Date(end) < new Date(start)) {
      return { dateMismatch: true };
    }
    return null;
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImageName.set(file.name);
      this.selectedImageFile.set(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImagePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  clearSelectedImage(event: Event) {
    event.stopPropagation();
    this.selectedImageName.set(null);
    this.selectedImageFile.set(null);
    this.selectedImagePreview.set(null);
  }

  onStartDateChange(event: CustomEvent): void {
    const value = event.detail.value as string;
    if (value) {
      this.offerForm.get('start_date')?.setValue(value);
      this.offerForm.get('start_date')?.markAsDirty();
    }
  }

  onEndDateChange(event: CustomEvent): void {
    const value = event.detail.value as string;
    if (value) {
      this.offerForm.get('end_date')?.setValue(value);
      this.offerForm.get('end_date')?.markAsDirty();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.offerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.offerForm.invalid) {
      this.offerForm.markAllAsTouched();
      return;
    }
    
    this.submitting.set(true);
    this.errorMessage.set(null);

    const formValues = this.offerForm.value;
    const formData = new FormData();
    formData.append('title', formValues.title);
    formData.append('description', formValues.description);

    let offerType = '';
    let discountType = '';
    if (formValues.offer_category === 'PERCENTAGE_DEAL') {
      offerType = 'DISCOUNT';
      discountType = 'PERCENTAGE';
    } else if (formValues.offer_category === 'FLAT_OFFER') {
      offerType = 'DISCOUNT';
      discountType = 'FIXED_AMOUNT';
    } else if (formValues.offer_category === 'CASHBACK') {
      offerType = 'CASHBACK';
      discountType = 'FIXED_AMOUNT';
    }

    formData.append('offer_type', offerType);
    if (discountType) {
      formData.append('discount_type', discountType);
    }

    if (formValues.discount_value !== null && formValues.discount_value !== undefined && formValues.discount_value !== '') {
      formData.append('discount_value', String(formValues.discount_value));
    }
    formData.append('start_date', new Date(formValues.start_date).toISOString());
    formData.append('end_date', new Date(formValues.end_date).toISOString());

    if (this.selectedImageFile()) {
      formData.append('offer_image', this.selectedImageFile()!);
    }

    if (this.isEditMode() && this.offerId()) {
      this.http.put<any>(`${environment.apiUrl}/offers/${this.offerId()}`, formData, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.dashboardService.loadDashboardData().subscribe();
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('Update offer failed:', err);
          this.errorMessage.set(err?.error?.message || 'Failed to update offer. Please try again.');
        }
      });
    } else {
      const profile = this.profileService.profile();
      if (!profile?.business_id) {
        this.profileService.loadProfile().subscribe({
          next: (loadedProfile) => {
            if (!loadedProfile?.business_id) {
              this.submitting.set(false);
              this.errorMessage.set('Could not find your business listing. Please complete your business profile before creating an offer.');
              return;
            }
            formData.append('business_id', loadedProfile.business_id);
            this.sendCreateRequest(formData);
          },
          error: (err) => {
            this.submitting.set(false);
            this.errorMessage.set('Failed to verify business ID. Please try again.');
          }
        });
        return;
      }

      formData.append('business_id', profile.business_id);
      this.sendCreateRequest(formData);
    }
  }

  private sendCreateRequest(formData: FormData) {
    this.http.post<any>(`${environment.apiUrl}/offers`, formData, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.dashboardService.loadDashboardData().subscribe();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Create offer failed:', err);
        this.errorMessage.set(err?.error?.message || 'Failed to create offer. Please check your inputs and try again.');
      }
    });
  }
}
