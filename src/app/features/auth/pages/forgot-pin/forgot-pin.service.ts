import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthApiService } from '../../services/auth-api.service';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';

@Injectable()
export class ForgotPinService implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);

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
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    newPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
    confirmPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
  });

  private timerSubscription?: Subscription;
  private _verifiedOtp?: string;

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.forgotForm.controls.email.setValue(params['email']);
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
    const emailControl = this.forgotForm.controls.email;
    if (emailControl.invalid) {
      emailControl.markAsTouched();
      return;
    }

    this._isSubmitting.set(true);
    const email = emailControl.value;

    this.authApi.sendOtp(email, 'forgot-pin').subscribe({
      next: (res: any) => {
        if (res.success) {
          this._step.set('otp');
          this.startResendTimer();
        }
        this._isSubmitting.set(false);
      },
      error: (err: any) => {
        console.error('sendOtp error:', err);
        this._errorMessage.set(
          extractFriendlyErrorMessage(err, 'Failed to trigger verification code. Account may not exist.')
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

    this._verifiedOtp = otpControl.value;
    this._step.set('reset');
    this.stopTimer();
  }

  resetPin(): void {
    this._errorMessage.set(null);
    const { newPin, confirmPin, email } = this.forgotForm.controls;
    if (newPin.invalid || confirmPin.invalid) {
      newPin.markAsTouched();
      confirmPin.markAsTouched();
      return;
    }
    if (newPin.value !== confirmPin.value) {
      this._pinMismatchError.set(true);
      return;
    }
    if (!this._verifiedOtp) {
      this._errorMessage.set('OTP missing. Please verify OTP again.');
      return;
    }

    this._pinMismatchError.set(false);
    this._isSubmitting.set(true);

    this.authApi
      .resetPin({
        email: email.value,
        otp: this._verifiedOtp,
        newPin: newPin.value,
      })
      .subscribe({
        next: (res: any) => {
          this._isSubmitting.set(false);
          this.router.navigate(['/auth/login']);
        },
        error: (err: any) => {
          console.error('resetPin error:', err);
          this._errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to reset PIN. Try again.'));
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
