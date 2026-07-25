import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MemberOnboardingService } from '../../services/member-onboarding.service';
import { ToastService } from '../../../../core/services/toast.service';
import { compressImageClientSide } from '../../../../shared/utils/image-compressor.util';
import { validateFileSize } from '../../../../shared/utils/file-validator.util';

@Injectable()
export class MemberPaymentService {
  private readonly router = inject(Router);
  readonly onboardingService = inject(MemberOnboardingService);
  private readonly toastService = inject(ToastService);

  readonly receiptPreview = signal<string | null>(null);
  readonly receiptFileName = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isSuccess = signal<boolean>(false);
  private receiptFile: File | null = null;

  constructor() {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      await this.onboardingService.fetchPaymentSettings();
    } catch (err) {
      // Error is set in onboardingService.paymentSettingsError
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const rawFile = input.files[0];
      const validation = validateFileSize(rawFile, 10);
      if (!validation.valid) {
        this.toastService.showError(validation.error || 'File size exceeds limit');
        input.value = '';
        return;
      }
      this.receiptFile = await compressImageClientSide(rawFile);
      this.receiptFileName.set(this.receiptFile.name);
      this.errorMessage.set(null);

      const reader = new FileReader();
      reader.onload = () => {
        this.receiptPreview.set(reader.result as string);
      };
      reader.readAsDataURL(this.receiptFile);
    }
  }

  completePayment(): void {
    // Payment receipt is no longer mandatory
    // if (!this.receiptFile) {
    //   this.errorMessage.set('Please upload your payment screenshot to proceed.');
    //   return;
    // }

    this.errorMessage.set(null);
    if (this.receiptFile) {
      this.onboardingService.setPaymentReceipt(this.receiptFile);
    }
    this.router.navigate(['/auth/member-registration']);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    this.toastService.showSuccess(`Copied "${text}" to clipboard!`);
  }

  backStep(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/auth/login']);
  }
}
