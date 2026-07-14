import { inject, Injectable } from '@angular/core';
import {
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from '@angular/fire/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebasePhoneAuthService {
  private readonly auth: Auth = inject(Auth);
  private recaptchaVerifier?: RecaptchaVerifier;

  constructor() {
    if (!environment.production) {
      this.auth.settings.appVerificationDisabledForTesting = true;
    }
  }

  initRecaptcha(containerId: string): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = undefined;
    }

    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    });
  }

  async sendOtp(phoneNumber: string): Promise<ConfirmationResult> {
    if (!this.recaptchaVerifier) {
      throw new Error('RecaptchaVerifier not initialized. Call initRecaptcha first.');
    }
    try {
      return await signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier);
    } catch (error) {
      console.error('FirebasePhoneAuthService.sendOtp error:', error);
      throw error;
    }
  }

  async verifyOtp(confirmationResult: ConfirmationResult, otp: string): Promise<string> {
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();
      return idToken;
    } catch (error) {
      console.error('FirebasePhoneAuthService.verifyOtp error:', error);
      throw error;
    }
  }

  clearRecaptcha(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = undefined;
    }
  }
}
