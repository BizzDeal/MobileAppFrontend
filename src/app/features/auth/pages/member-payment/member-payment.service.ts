import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MemberOnboardingService } from '../../services/member-onboarding.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserStatus } from '../../models/auth.model';

declare var Razorpay: any;

@Injectable()
export class MemberPaymentService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  readonly onboardingService = inject(MemberOnboardingService);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = environment.apiUrl;

  readonly isProcessing = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      await this.onboardingService.fetchPaymentSettings();
    } catch (err) {
      // Error is handled in onboardingService
    }
  }

  async initiateRazorpayPayment(): Promise<void> {
    const user = this.authSession.currentUser();
    const settings = this.onboardingService.paymentSettings();

    if (!user) {
      this.toastService.showError('User not found. Please log in again.');
      return;
    }

    if (!settings || !settings.registration_fee) {
      this.toastService.showError('Payment settings not loaded properly. Please try again.');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    try {
      // 1. Create Order in Backend
      const orderRes = await firstValueFrom(
        this.http.post<{ order_id: string; amount: number; key_id?: string }>(`${this.apiUrl}/payments/create-order`, {
          amount: settings.registration_fee,
          purpose: 'REGISTRATION_FEE'
        })
      );

      // 2. Open Razorpay Checkout
      const options = {
        key: orderRes.key_id || environment.razorpayKeyId,
        amount: Math.round(settings.registration_fee * 100), // convert to paise
        currency: 'INR',
        name: 'BizzDeal',
        description: 'Member Registration Fee',
        order_id: orderRes.order_id,
        handler: async (response: any) => {
          await this.verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: user.full_name,
          email: user.email || '',
          contact: user.phone
        },
        theme: {
          color: '#5b21b6'
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        this.toastService.showError('Payment failed or was cancelled.');
        this.isProcessing.set(false);
      });
      rzp.open();

    } catch (err: any) {
      this.isProcessing.set(false);
      this.toastService.showError('Failed to initiate payment. Please try again.');
      console.error(err);
    }
  }

  private async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/payments/verify`, {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        })
      );

      if (res.success) {
        this.toastService.showSuccess('Payment successful! Your account is now pending admin approval.');
        
        const currentUser = this.authSession.currentUser();
        if (currentUser) {
          this.authSession.updateCurrentUser({ ...currentUser, status: UserStatus.PENDING });
        }
        this.router.navigate(['/auth/pending-approval']);
      }
    } catch (err: any) {
      this.toastService.showError('Payment verification failed.');
      console.error(err);
    } finally {
      this.isProcessing.set(false);
    }
  }

  backStep(event: Event): void {
    event.preventDefault();
    this.authSession.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
