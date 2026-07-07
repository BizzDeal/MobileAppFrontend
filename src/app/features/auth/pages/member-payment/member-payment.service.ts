import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MemberOnboardingService } from '../../services/member-onboarding.service';

@Injectable()
export class MemberPaymentService {
  private readonly router = inject(Router);
  readonly onboardingService = inject(MemberOnboardingService);

  readonly receiptPreview = signal<string | null>(null);
  readonly receiptFileName = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isSuccess = signal<boolean>(false);
  private receiptFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.receiptFile = input.files[0];
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
    if (!this.receiptFile) {
      this.errorMessage.set('Please upload your payment screenshot to proceed.');
      return;
    }

    this.errorMessage.set(null);
    this.onboardingService.setPaymentReceipt(this.receiptFile);
    this.router.navigate(['/auth/member-registration']);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    alert(`Copied "${text}" to clipboard!`);
  }

  backStep(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/auth/login']);
  }
}
