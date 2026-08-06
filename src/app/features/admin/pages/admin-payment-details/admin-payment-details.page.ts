import { Component, OnInit, inject, signal } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminPaymentSettingsService, PaymentSettings } from '../../services/admin-payment-settings.service';
import { addIcons } from 'ionicons';
import { saveOutline, refreshOutline, cardOutline } from 'ionicons/icons';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';

@Component({
  selector: 'app-admin-payment-details',
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CardSkeletonComponent],
  templateUrl: './admin-payment-details.page.html',
  styleUrls: ['./admin-payment-details.page.scss']
})
export class AdminPaymentDetailsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paymentSettingsService = inject(AdminPaymentSettingsService);

  readonly paymentForm = this.fb.group({
    upi_id: ['', [Validators.required]],
    account_name: ['', [Validators.required]],
    registration_fee: [0, [Validators.required, Validators.min(0)]],
    currency: ['INR', [Validators.required]],
    card_title: ['', [Validators.required]],
    card_subtitle: ['', [Validators.required]],
    benefits: ['', [Validators.required]],
  });

  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  constructor() {
    addIcons({ saveOutline, refreshOutline, cardOutline });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.paymentSettingsService.getSettings().subscribe({
      next: (settings: PaymentSettings) => {
        this.paymentForm.patchValue({
          upi_id: settings.upi_id,
          account_name: settings.account_name,
          registration_fee: settings.registration_fee,
          currency: settings.currency || 'INR',
          card_title: settings.card_title || 'Join BIZZ DEAL as Member',
          card_subtitle: settings.card_subtitle || 'MEMBER ONBOARDING',
          benefits: settings.benefits || '',
        });
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load payment settings:', err);
        this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to load payment settings.'));
        this.isLoading.set(false);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValue = this.paymentForm.value;
    const payload = {
      upi_id: formValue.upi_id!,
      account_name: formValue.account_name!,
      registration_fee: Number(formValue.registration_fee!),
      currency: formValue.currency!,
      card_title: formValue.card_title!,
      card_subtitle: formValue.card_subtitle!,
      benefits: formValue.benefits!,
    };

    this.paymentSettingsService.updateSettings(payload).subscribe({
      next: (res) => {
        this.successMessage.set('Payment details saved successfully!');
        this.isSaving.set(false);
        const data = res.data || res;
        this.paymentForm.patchValue(data);
      },
      error: (err: any) => {
        console.error('Failed to save payment settings:', err);
        this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to save payment settings.'));
        this.isSaving.set(false);
      }
    });
  }
}
