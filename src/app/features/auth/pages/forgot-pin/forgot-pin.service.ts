import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { ConfirmationResult } from '@angular/fire/auth';
import { AuthApiService } from '../../services/auth-api.service';
import { FirebasePhoneAuthService } from '../../../../core/services/firebase-phone-auth.service';

@Injectable()
export class ForgotPinService implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);
  private readonly firebasePhoneAuth = inject(FirebasePhoneAuthService);

  private readonly _step = signal<'phone' | 'otp' | 'reset'>('phone');
  private readonly _isSubmitting = signal(false);
  private readonly _resendTimer = signal(30);
  private readonly _canResend = signal(false);
  private readonly _pinMismatchError = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  private readonly _isPhoneFocused = signal(false);
  private readonly _isOtpFocused = signal(false);
  private readonly _isNewPinFocused = signal(false);
  private readonly _isConfirmPinFocused = signal(false);

  readonly step = this._step.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly resendTimer = this._resendTimer.asReadonly();
  readonly canResend = this._canResend.asReadonly();
  readonly pinMismatchError = this._pinMismatchError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  readonly isPhoneFocused = this._isPhoneFocused.asReadonly();
  readonly isOtpFocused = this._isOtpFocused.asReadonly();
  readonly isNewPinFocused = this._isNewPinFocused.asReadonly();
  readonly isConfirmPinFocused = this._isConfirmPinFocused.asReadonly();

  readonly forgotForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    newPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
    confirmPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
  });

  private timerSubscription?: Subscription;
  private _confirmationResult?: ConfirmationResult;
  private _verifiedFirebaseToken?: string;

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['phone'] && /^[0-9]{10}$/.test(params['phone'])) {
        this.forgotForm.controls.phoneNumber.setValue(params['phone']);
      }
    });
  }

  setPhoneFocused(focused: boolean): void {
    this._isPhoneFocused.set(focused);
  }

  setOtpFocused(focused: boolean): void {
    this._isOtpFocused.set(focused);
  }

  setNewPinFocused(focused: boolean): void {
    this._isNewPinFocused.set(focused);
  }

  setConfirmPinFocused(focused: boolean): void {
    this._isConfirmPinFocused.set(focused);
  }

  sendOtp(): void {
    this._errorMessage.set(null);
    const phoneControl = this.forgotForm.controls.phoneNumber;
    if (phoneControl.invalid) {
      phoneControl.markAsTouched();
      return;
    }

    this._isSubmitting.set(true);
    const phoneNumber = phoneControl.value;

    this.authApi.forgotPin(phoneNumber).subscribe({
      next: async (res: any) => {
        if (res.success) {
          try {
            this.firebasePhoneAuth.initRecaptcha('recaptcha-container-forgot');
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            this._confirmationResult = await this.firebasePhoneAuth.sendOtp(formattedPhone);
            this._step.set('otp');
            this.startResendTimer();
          } catch (err: any) {
            console.error('sendOtp error:', err);
            this._errorMessage.set(
              err?.message || 'Failed to trigger SMS verification code.'
            );
          } finally {
            this._isSubmitting.set(false);
          }
        }
      },
      error: (err: any) => {
        console.error('forgotPin error:', err);
        this._errorMessage.set(
          err?.error?.message || 'Phone number not found or account not active.'
        );
        this._isSubmitting.set(false);
      },
    });
  }

  verifyOtp(): void {
    this._errorMessage.set(null);
    const otpControl = this.forgotForm.controls.otp;
    if (otpControl.invalid || !otpControl.value) {
      otpControl.markAsTouched();
      return;
    }

    if (!this._confirmationResult) {
      this._errorMessage.set('Verification session expired. Please send OTP again.');
      return;
    }

    this._isSubmitting.set(true);
    (async () => {
      try {
        const token = await this.firebasePhoneAuth.verifyOtp(
          this._confirmationResult!,
          otpControl.value
        );
        this._verifiedFirebaseToken = token;
        this._step.set('reset');
        this.stopTimer();
      } catch (err: any) {
        console.error('verifyOtp error:', err);
        this._errorMessage.set(err?.message || 'Invalid or expired OTP code.');
      } finally {
        this._isSubmitting.set(false);
      }
    })();
  }

  resetPin(): void {
    this._errorMessage.set(null);
    const { newPin, confirmPin, phoneNumber } = this.forgotForm.controls;
    if (newPin.invalid || confirmPin.invalid) {
      newPin.markAsTouched();
      confirmPin.markAsTouched();
      return;
    }
    if (newPin.value !== confirmPin.value) {
      this._pinMismatchError.set(true);
      return;
    }
    if (!this._verifiedFirebaseToken) {
      this._errorMessage.set('Firebase token missing. Please verify OTP again.');
      return;
    }

    this._pinMismatchError.set(false);
    this._isSubmitting.set(true);

    this.authApi
      .resetPin({
        phone: phoneNumber.value,
        firebaseToken: this._verifiedFirebaseToken,
        newPin: newPin.value,
      })
      .subscribe({
        next: (res: any) => {
          this._isSubmitting.set(false);
          this.router.navigate(['/auth/login']);
        },
        error: (err: any) => {
          console.error('resetPin error:', err);
          this._errorMessage.set(err?.error?.message || 'Failed to reset PIN. Try again.');
          this._isSubmitting.set(false);
        },
      });
  }

  resendOtp(): void {
    if (!this._canResend()) return;
    this.sendOtp();
  }

  backStep(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const current = this._step();
    this._errorMessage.set(null);
    if (current === 'reset') {
      this._step.set('otp');
    } else if (current === 'otp') {
      this._step.set('phone');
      this.stopTimer();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private startResendTimer(): void {
    this._resendTimer.set(30);
    this._canResend.set(false);
    this.stopTimer();

    this.timerSubscription = interval(1000).subscribe(() => {
      const current = this._resendTimer();
      if (current <= 1) {
        this._resendTimer.set(0);
        this._canResend.set(true);
        this.stopTimer();
      } else {
        this._resendTimer.set(current - 1);
      }
    });
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
