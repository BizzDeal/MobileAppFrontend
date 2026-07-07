import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Injectable()
export class ForgotPinService implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly _step = signal<'phone' | 'otp' | 'reset'>('phone');
  private readonly _isSubmitting = signal(false);
  private readonly _resendTimer = signal(30);
  private readonly _canResend = signal(false);
  private readonly _pinMismatchError = signal(false);

  private readonly _isPhoneFocused = signal(false);
  private readonly _isOtpFocused = signal(false);
  private readonly _isNewPinFocused = signal(false);
  private readonly _isConfirmPinFocused = signal(false);

  readonly step = this._step.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly resendTimer = this._resendTimer.asReadonly();
  readonly canResend = this._canResend.asReadonly();
  readonly pinMismatchError = this._pinMismatchError.asReadonly();

  readonly isPhoneFocused = this._isPhoneFocused.asReadonly();
  readonly isOtpFocused = this._isOtpFocused.asReadonly();
  readonly isNewPinFocused = this._isNewPinFocused.asReadonly();
  readonly isConfirmPinFocused = this._isConfirmPinFocused.asReadonly();

  readonly forgotForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
    newPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
    confirmPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
  });

  private timerSubscription?: Subscription;

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
    const phoneControl = this.forgotForm.controls.phoneNumber;
    if (phoneControl.invalid) {
      phoneControl.markAsTouched();
      return;
    }
    this._step.set('otp');
    this.startResendTimer();
  }

  verifyOtp(): void {
    const otpControl = this.forgotForm.controls.otp;
    if (otpControl.invalid) {
      otpControl.markAsTouched();
      return;
    }
    this._step.set('reset');
    this.stopTimer();
  }

  resetPin(): void {
    const { newPin, confirmPin } = this.forgotForm.controls;
    if (newPin.invalid || confirmPin.invalid) {
      newPin.markAsTouched();
      confirmPin.markAsTouched();
      return;
    }
    if (newPin.value !== confirmPin.value) {
      this._pinMismatchError.set(true);
      return;
    }
    this._pinMismatchError.set(false);
    this._isSubmitting.set(true);
    setTimeout(() => {
      this._isSubmitting.set(false);
      console.info('PIN reset successfully for:', this.forgotForm.controls.phoneNumber.value);
      this.router.navigate(['/auth/login']);
    }, 1000);
  }

  resendOtp(): void {
    if (!this._canResend()) return;
    console.info('Resending OTP...');
    this.startResendTimer();
  }

  backStep(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const current = this._step();
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
