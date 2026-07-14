import { inject, Injectable, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationResult } from '@angular/fire/auth';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { FirebasePhoneAuthService } from '../../../../core/services/firebase-phone-auth.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { UserRole } from '../../models/auth.model';

@Injectable()
export class PhoneLoginService {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly firebasePhoneAuth = inject(FirebasePhoneAuthService);
  private readonly profileService = inject(ProfileService);

  private readonly _authStep = signal<'phone' | 'pin' | 'otp_register'>('phone');
  private readonly _isSubmitting = signal(false);
  private readonly _isPhoneFocused = signal(false);
  private readonly _isPinFocused = signal(false);
  private readonly _isConfirmPinFocused = signal(false);
  private readonly _isOtpFocused = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _isJoinModalOpen = signal(false);

  private _confirmationResult?: ConfirmationResult;

  readonly authStep = this._authStep.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly isPhoneFocused = this._isPhoneFocused.asReadonly();
  readonly isPinFocused = this._isPinFocused.asReadonly();
  readonly isConfirmPinFocused = this._isConfirmPinFocused.asReadonly();
  readonly isOtpFocused = this._isOtpFocused.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isJoinModalOpen = this._isJoinModalOpen.asReadonly();

  readonly loginForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    pin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
    confirmPin: ['', [Validators.pattern(/^[0-9]{4,6}$/)]],
    otp: ['', [Validators.pattern(/^[0-9]{6}$/)]],
  });

  readonly features = [
    {
      icon: 'people-outline',
      title: 'Business Networking',
      description: 'Connect with entrepreneurs near you',
    },
    {
      icon: 'git-network-outline',
      title: 'Referral Exchange',
      description: 'Share leads and grow together',
    },
    {
      icon: 'gift-outline',
      title: 'Offers & Vouchers',
      description: 'Reward customers and boost sales',
    },
  ];

  setPhoneFocused(focused: boolean): void {
    this._isPhoneFocused.set(focused);
  }

  setPinFocused(focused: boolean): void {
    this._isPinFocused.set(focused);
  }

  setConfirmPinFocused(focused: boolean): void {
    this._isConfirmPinFocused.set(focused);
  }

  setOtpFocused(focused: boolean): void {
    this._isOtpFocused.set(focused);
  }

  clearError(): void {
    this._errorMessage.set(null);
  }

  submitForm(): void {
    this._errorMessage.set(null);
    const step = this._authStep();

    if (step === 'phone') {
      const phoneControl = this.loginForm.controls.phoneNumber;
      if (phoneControl.invalid) {
        phoneControl.markAsTouched();
        return;
      }

      this._isSubmitting.set(true);
      const phoneNumber = phoneControl.value;

      this.authApi.checkUserExist(phoneNumber).subscribe({
        next: async (res: any) => {
          if (res.exists) {
            this._authStep.set('pin');
            this._isSubmitting.set(false);
          } else {
            try {
              this.firebasePhoneAuth.initRecaptcha('recaptcha-container');
              const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
              this._confirmationResult = await this.firebasePhoneAuth.sendOtp(formattedPhone);
              this._authStep.set('otp_register');
            } catch (err: any) {
              console.error('sendOtp error:', err);
              this._errorMessage.set(
                err?.message || 'Failed to send OTP. Please ensure the phone number is valid.'
              );
            } finally {
              this._isSubmitting.set(false);
            }
          }
        },
        error: (err: any) => {
          console.error('checkUserExist error:', err);
          this._errorMessage.set(
            err?.error?.message || 'Failed to check user account status. Try again.'
          );
          this._isSubmitting.set(false);
        },
      });
      return;
    }

    if (step === 'pin') {
      const pinControl = this.loginForm.controls.pin;
      if (pinControl.invalid) {
        pinControl.markAsTouched();
        return;
      }

      this._isSubmitting.set(true);
      const { phoneNumber, pin } = this.loginForm.getRawValue();

      this.authApi.login({ phone: phoneNumber, pin }).subscribe({
        next: async (res: any) => {
          try {
            await this.authSession.setSession(res.accessToken, res.refreshToken, res.user);
            this.profileService.loadProfile().subscribe();
            this._isSubmitting.set(false);
            if (res.user.role === UserRole.ADMIN) {
              this.router.navigate(['/admin']);
            } else {
              const u = res.user;
              const isIncomplete = !u.full_name || u.full_name === 'Customer' || !u.email || u.email.includes('@bizzdeal.com') || !u.address || u.address === 'Not Provided';
              if (isIncomplete && u.role === UserRole.CUSTOMER) {
                this.router.navigate(['/home'], { queryParams: { tab: 'profile' } });
              } else {
                this.router.navigate(['/home']);
              }
            }
          } catch (err: any) {
            this._errorMessage.set('Failed to save session locally.');
            this._isSubmitting.set(false);
          }
        },
        error: (err: any) => {
          console.error('login error:', err);
          this._errorMessage.set(
            err?.error?.message || 'Invalid phone number or PIN. Please check and try again.'
          );
          this._isSubmitting.set(false);
        },
      });
      return;
    }

    if (step === 'otp_register') {
      const pinControl = this.loginForm.controls.pin;
      const confirmPinControl = this.loginForm.controls.confirmPin;
      const otpControl = this.loginForm.controls.otp;
      if (pinControl.invalid || confirmPinControl.invalid || !otpControl.value || otpControl.invalid) {
        pinControl.markAsTouched();
        confirmPinControl.markAsTouched();
        otpControl.markAsTouched();
        return;
      }

      if (pinControl.value !== confirmPinControl.value) {
        this._errorMessage.set('Security PINs do not match. Please make sure both PIN fields match exactly.');
        return;
      }

      if (!this._confirmationResult) {
        this._errorMessage.set('OTP session expired. Please switch number and try again.');
        return;
      }

      this._isSubmitting.set(true);
      const { phoneNumber, pin, otp } = this.loginForm.getRawValue();

      (async () => {
        try {
          const firebaseToken = await this.firebasePhoneAuth.verifyOtp(
            this._confirmationResult!,
            otp
          );

          const formData = new FormData();
          formData.append('phone', phoneNumber);
          formData.append('pin', pin);
          formData.append('firebaseToken', firebaseToken);

          this.authApi.registerCustomer(formData).subscribe({
            next: async (res: any) => {
              await this.authSession.setSession(res.accessToken, res.refreshToken, res.user);
              this.profileService.loadProfile().subscribe();
              this._isSubmitting.set(false);
              this.router.navigate(['/home'], { queryParams: { tab: 'profile' } });
            },
            error: (err: any) => {
              console.error('registerCustomer error:', err);
              this._errorMessage.set(
                err?.error?.message || 'Failed to complete registration. Try again.'
              );
              this._isSubmitting.set(false);
            },
          });
        } catch (err: any) {
          console.error('verifyOtp error:', err);
          this._errorMessage.set(err?.message || 'Invalid or expired OTP code.');
          this._isSubmitting.set(false);
        }
      })();
    }
  }

  switchNumber(): void {
    this._authStep.set('phone');
    this.loginForm.controls.pin.reset('');
    this.loginForm.controls.confirmPin.reset('');
    this.loginForm.controls.otp.reset('');
    this._errorMessage.set(null);
  }

  forgotPin(): void {
    const phone = this.loginForm.controls.phoneNumber.value;
    this.router.navigate(['/auth/forgot-pin'], { queryParams: { phone } });
  }

  joinAsMember(): void {
    this._isJoinModalOpen.set(true);
  }

  closeJoinModal(): void {
    this._isJoinModalOpen.set(false);
  }

  proceedToRegistration(): void {
    this._isJoinModalOpen.set(false);
    setTimeout(() => {
      this.router.navigate(['/auth/member-payment']);
    }, 250);
  }
}
