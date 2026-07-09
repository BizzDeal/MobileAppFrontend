import { inject, Injectable, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Injectable()
export class PhoneLoginService {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  private readonly _authStep = signal<'phone' | 'pin'>('phone');
  private readonly _isSubmitting = signal(false);
  private readonly _isPhoneFocused = signal(false);
  private readonly _isPinFocused = signal(false);

  private readonly _isJoinModalOpen = signal(false);

  readonly authStep = this._authStep.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly isPhoneFocused = this._isPhoneFocused.asReadonly();
  readonly isPinFocused = this._isPinFocused.asReadonly();
  readonly isJoinModalOpen = this._isJoinModalOpen.asReadonly();

  readonly loginForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    pin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
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

  submitForm(): void {
    if (this._authStep() === 'phone') {
      const phoneControl = this.loginForm.controls.phoneNumber;
      if (phoneControl.invalid) {
        phoneControl.markAsTouched();
        return;
      }
      this._authStep.set('pin');
      return;
    }

    if (this.loginForm.invalid || this._isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this._isSubmitting.set(true);
    setTimeout(() => {
      this._isSubmitting.set(false);
      const values = this.loginForm.getRawValue();
      console.info('Logged in successfully with:', values);
      
      // Mock role-based routing for now
      if (values.phoneNumber === '9999999999') {
        console.info('Mocking ADMIN role');
        this.router.navigate(['/admin/dashboard']);
      } else if (values.phoneNumber === '8888888888') {
        console.info('Mocking MEMBER role');
        this.router.navigate(['/home']); 
      } else {
        console.info('Mocking CUSTOMER role (Default)');
        this.router.navigate(['/home']);
      }
    }, 1000);
  }

  switchNumber(): void {
    this._authStep.set('phone');
    this.loginForm.controls.pin.reset('');
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
    // Allow the modal dismiss transition animation to complete cleanly before navigating
    setTimeout(() => {
      this.router.navigate(['/auth/member-payment']);
    }, 250);
  }
}
