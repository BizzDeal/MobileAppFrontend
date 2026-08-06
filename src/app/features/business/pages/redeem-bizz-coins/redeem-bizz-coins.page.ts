import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  callOutline,
  alertCircleOutline,
  personOutline,
  walletOutline,
  closeOutline,
  sparklesOutline,
  receiptOutline,
  warningOutline,
  addCircleOutline
} from 'ionicons/icons';
import { environment } from '../../../../../environments/environment';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

export interface CustomerCoinDetails {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  profile_pic_url: string | null;
  coins_balance: number;
  has_active_bizz_coin_offer: boolean;
}

@Component({
  selector: 'app-redeem-bizz-coins',
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CachedImgDirective],
  templateUrl: './redeem-bizz-coins.page.html',
  styleUrls: ['./redeem-bizz-coins.page.scss']
})
export class RedeemBizzCoinsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly getInitials = getInitials;
  readonly getAvatarColor = getAvatarColor;

  step: 'VERIFY' | 'REDEEM' | 'SUCCESS' = 'VERIFY';

  verificationForm!: FormGroup;
  redemptionForm!: FormGroup;

  isSearchingCustomer = false;
  customerNotFound = false;
  searchedCustomer: CustomerCoinDetails | null = null;
  

  hasActiveOffer = true;
  isCheckingActiveOffer = true;

  isRedeeming = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  redemptionResult: {
    coins_redeemed: number;
    new_balance: number;
    customer_name: string;
    message: string;
  } | null = null;

  // Real-time calculation state
  remainingCoins = 0;
  remainingBillToPay = 0;

  constructor() {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      callOutline,
      alertCircleOutline,
      personOutline,
      walletOutline,
      closeOutline,
      sparklesOutline,
      receiptOutline,
      warningOutline,
      addCircleOutline
    });
  }

  ngOnInit() {
    this.verificationForm = this.fb.group({
      customer_phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });

    this.redemptionForm = this.fb.group({
      coins: ['', [Validators.required, Validators.min(1)]],
      bill_amount: ['', [Validators.required, Validators.min(1)]]
    });

    // Check member's active Bizz Coin offer status
    this.checkActiveOfferStatus();

    // Listen to phone number changes for auto customer lookup
    this.verificationForm.get('customer_phone')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      const cleanPhone = (val || '').toString().trim().replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        this.lookupCustomer(cleanPhone);
      } else {
        this.searchedCustomer = null;
        this.customerNotFound = false;
        this.isSearchingCustomer = false;
      }
    });

    // Listen to form value changes for live calculation
    this.redemptionForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.calculateLiveValues();
    });
  }

  get vf() {
    return this.verificationForm.controls;
  }

  get rf() {
    return this.redemptionForm.controls;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToCreateBizzCoinOffer() {
    this.router.navigate(['/offers/bizz-coins']);
  }

  resetPage() {
    this.step = 'VERIFY';
    this.searchedCustomer = null;
    this.customerNotFound = false;
    this.redemptionResult = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.verificationForm.reset();
    this.redemptionForm.reset();
    this.checkActiveOfferStatus();
  }

  private checkActiveOfferStatus() {
    this.isCheckingActiveOffer = true;
    this.http.get<{ has_active_offer: boolean }>(`${environment.apiUrl}/bizz-coins/active-offer-status`).subscribe({
      next: (res) => {
        this.isCheckingActiveOffer = false;
        this.hasActiveOffer = res?.has_active_offer ?? true;
      },
      error: () => {
        this.isCheckingActiveOffer = false;
        this.hasActiveOffer = true;
      }
    });
  }

  private lookupCustomer(phone: string) {
    this.isSearchingCustomer = true;
    this.customerNotFound = false;
    this.searchedCustomer = null;
    this.errorMessage = null;

    this.http.get<CustomerCoinDetails>(`${environment.apiUrl}/bizz-coins/customer-by-phone/${phone}`).subscribe({
      next: (res) => {
        this.isSearchingCustomer = false;
        if (res && res.id) {
          this.searchedCustomer = {
            id: res.id,
            name: res.name,
            phone: res.phone,
            email: res.email,
            profile_pic_url: res.profile_pic_url,
            coins_balance: Number(res.coins_balance || 0),
            has_active_bizz_coin_offer: res.has_active_bizz_coin_offer
          };
          this.hasActiveOffer = res.has_active_bizz_coin_offer;
        } else {
          this.customerNotFound = true;
        }
      },
      error: (err) => {
        this.isSearchingCustomer = false;
        this.customerNotFound = true;
        this.searchedCustomer = null;
        if (err?.status === 400 && err?.error?.message?.includes('active Bizz Coins offer')) {
          this.hasActiveOffer = false;
        }
      }
    });
  }

  onVerifySubmit() {
    if (this.verificationForm.invalid) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    if (!this.hasActiveOffer) {
      this.errorMessage = 'You must have an active Bizz Coins offer to redeem Bizz Coins.';
      return;
    }

    if (!this.searchedCustomer) {
      this.errorMessage = 'Customer not found. Please enter a valid customer phone number.';
      return;
    }

    if (this.searchedCustomer.coins_balance <= 0) {
      this.errorMessage = `${this.searchedCustomer.name} has 0 Bizz Coins available in their wallet.`;
      return;
    }

    // Set max coins validator
    const coinsControl = this.redemptionForm.get('coins');
    coinsControl?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(this.searchedCustomer.coins_balance)
    ]);
    coinsControl?.updateValueAndValidity();

    this.step = 'REDEEM';
    this.calculateLiveValues();
  }

  calculateLiveValues() {
    if (!this.searchedCustomer) return;
    const coinsToRedeem = Number(this.redemptionForm.getRawValue().coins || 0);
    const billAmount = Number(this.redemptionForm.getRawValue().bill_amount || 0);
    const balance = this.searchedCustomer.coins_balance;
    
    this.remainingCoins = Math.max(0, balance - coinsToRedeem);
    this.remainingBillToPay = Math.max(0, billAmount - coinsToRedeem);
  }

  onSubmitRedeem() {
    if (this.redemptionForm.invalid) {
      this.redemptionForm.markAllAsTouched();
      return;
    }

    if (!this.searchedCustomer) return;

    const coinsToRedeem = Number(this.redemptionForm.value.coins);
    if (coinsToRedeem > this.searchedCustomer.coins_balance) {
      this.errorMessage = `Cannot redeem ${coinsToRedeem} coins. Customer only has ${this.searchedCustomer.coins_balance} coins.`;
      return;
    }

    this.isRedeeming = true;
    this.errorMessage = null;

    const payload = {
      customer_phone: this.searchedCustomer.phone,
      coins: coinsToRedeem,
      bill_amount: Number(this.redemptionForm.value.bill_amount)
    };

    this.http.post<any>(`${environment.apiUrl}/bizz-coins/redeem`, payload).subscribe({
      next: (res) => {
        this.isRedeeming = false;
        this.redemptionResult = {
          coins_redeemed: coinsToRedeem,
          new_balance: Number(res.new_balance ?? (this.searchedCustomer!.coins_balance - coinsToRedeem)),
          customer_name: this.searchedCustomer!.name,
          message: res.message || `${coinsToRedeem} Bizz Coins successfully redeemed!`
        };
        this.step = 'SUCCESS';

        setTimeout(() => {
          this.goBack();
        }, 3500);
      },
      error: (err) => {
        this.isRedeeming = false;
        this.errorMessage = extractFriendlyErrorMessage(err, 'Failed to redeem Bizz Coins.');
      }
    });
  }
}
