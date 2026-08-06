import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../../core/interceptors/interceptor.tokens';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ribbonOutline, pricetagOutline, documentTextOutline, calendarOutline, saveOutline, refreshOutline, sparklesOutline } from 'ionicons/icons';
import { MemberDashboardService } from '../../../home/services/member-dashboard.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { environment } from '../../../../../environments/environment';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';

@Component({
  selector: 'app-bizz-coins-offer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonSpinner
],
  templateUrl: './bizz-coins-offer.page.html',
  styleUrls: ['./bizz-coins-offer.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BizzCoinsOfferPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly dashboardService = inject(MemberDashboardService);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly existingOfferId = signal<string | null>(null);
  readonly isEditMode = signal(false);

  bizzCoinsForm: FormGroup;

  constructor() {
    addIcons({ ribbonOutline, pricetagOutline, documentTextOutline, calendarOutline, saveOutline, refreshOutline, sparklesOutline });

    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.bizzCoinsForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      start_date: [this.formatDateForInput(now.toISOString()), [Validators.required]],
      end_date: [this.formatDateForInput(nextMonth.toISOString()), [Validators.required]],
    }, { validators: this.dateValidator });
  }

  ngOnInit() {
    if (!this.profileService.profile()?.business_id) {
      this.profileService.loadProfile().subscribe();
    }
    this.loadExistingBizzCoinsOffer();
  }

  private loadExistingBizzCoinsOffer() {
    const cachedData = this.dashboardService.dashboardData();
    const cachedOffer = cachedData?.myOffers?.find(o => o.offer_type === 'BIZZ_COINS');
    if (cachedOffer) {
      this.patchFormWithOffer(cachedOffer);
    }

    this.http.get<any>(`${environment.apiUrl}/offers/bizz-coins/my`).subscribe({
      next: (res) => {
        const offer = res?.data || res;
        if (offer && offer.id) {
          this.patchFormWithOffer(offer);
        }
      },
      error: (err) => {
        console.log('No existing Bizz Coins offer found or error fetching:', err);
      }
    });
  }

  private patchFormWithOffer(offer: any) {
    this.existingOfferId.set(offer.id);
    this.isEditMode.set(true);
    this.bizzCoinsForm.patchValue({
      title: offer.title || '',
      description: offer.description || '',
      start_date: this.formatDateForInput(offer.start_date || new Date().toISOString()),
      end_date: this.formatDateForInput(offer.end_date || new Date().toISOString()),
    });
  }

  dateValidator(group: FormGroup) {
    const start = group.get('start_date')?.value;
    const end = group.get('end_date')?.value;
    if (start && end && new Date(end) < new Date(start)) {
      return { dateMismatch: true };
    }
    return null;
  }

  private formatDateForInput(isoDate?: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.bizzCoinsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onClearOffer() {
    if (this.existingOfferId()) {
      this.submitting.set(true);
      this.errorMessage.set(null);
      const formData = new FormData();
      formData.append('status', 'INACTIVE');

      this.http.put<any>(`${environment.apiUrl}/offers/${this.existingOfferId()}`, formData, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.existingOfferId.set(null);
          this.isEditMode.set(false);
          this.resetFormFields();
          this.dashboardService.loadDashboardData().subscribe();
          this.toastService.showSuccess('Bizz Coins offer cleared and deactivated');
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('Clear Bizz Coins offer failed:', err);
          this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to deactivate Bizz Coins offer. Please try again.'));
        }
      });
    } else {
      this.resetFormFields();
      this.toastService.showSuccess('Form fields cleared');
    }
  }

  private resetFormFields() {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.bizzCoinsForm.reset({
      title: '',
      description: '',
      start_date: this.formatDateForInput(now.toISOString()),
      end_date: this.formatDateForInput(nextMonth.toISOString())
    });
    this.errorMessage.set(null);
  }

  onApplyOffer() {
    if (this.bizzCoinsForm.invalid) {
      this.bizzCoinsForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const formValues = this.bizzCoinsForm.value;
    const formData = new FormData();
    formData.append('title', formValues.title);
    formData.append('description', formValues.description);
    formData.append('offer_type', 'BIZZ_COINS');
    formData.append('start_date', new Date(formValues.start_date).toISOString());
    formData.append('end_date', new Date(formValues.end_date).toISOString());

    if (this.isEditMode() && this.existingOfferId()) {
      this.http.put<any>(`${environment.apiUrl}/offers/${this.existingOfferId()}`, formData, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.dashboardService.loadDashboardData().subscribe();
          this.toastService.showSuccess('Bizz Coins offer plan saved and activated successfully');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('Update Bizz Coins offer failed:', err);
          this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to update Bizz Coins offer. Please try again.'));
        }
      });
      return;
    }

    const profile = this.profileService.profile();
    if (!profile?.business_id) {
      this.profileService.loadProfile().subscribe({
        next: (loadedProfile) => {
          if (!loadedProfile?.business_id) {
            this.submitting.set(false);
            this.errorMessage.set('Could not find your business listing. Please complete your business profile before applying a Bizz Coins offer.');
            return;
          }
          formData.append('business_id', loadedProfile.business_id);
          this.sendCreateRequest(formData);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to verify business profile. Please try again.'));
        }
      });
      return;
    }

    formData.append('business_id', profile.business_id);
    this.sendCreateRequest(formData);
  }

  private sendCreateRequest(formData: FormData) {
    this.http.post<any>(`${environment.apiUrl}/offers`, formData, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.dashboardService.loadDashboardData().subscribe();
        this.toastService.showSuccess('Bizz Coins offer plan saved and activated successfully');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Apply Bizz Coins offer failed:', err);
        this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to apply Bizz Coins offer. Please check your inputs and try again.'));
      }
    });
  }
}
