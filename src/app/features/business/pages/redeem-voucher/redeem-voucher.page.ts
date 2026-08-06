import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  scanOutline, 
  checkmarkCircleOutline, 
  closeOutline, 
  cashOutline, 
  walletOutline, 
  receiptOutline, 
  alertCircleOutline,
  ticketOutline
} from 'ionicons/icons';
import { VouchersService } from '../../services/vouchers.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { PermissionsService } from '../../../../core/platform/permissions.service';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';

@Component({
  selector: 'app-redeem-voucher',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './redeem-voucher.page.html',
  styleUrls: ['./redeem-voucher.page.scss']
})
export class RedeemVoucherPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly vouchersService = inject(VouchersService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly destroyRef = inject(DestroyRef);

  step: 'VERIFY' | 'REDEEM' | 'SUCCESS' = 'VERIFY';
  isScannerOpen = false;

  verificationForm!: FormGroup;
  redemptionForm!: FormGroup;

  isVerifying = false;
  isRedeeming = false;

  errorMessage: string | null = null;
  successMessage: string | null = null;

  voucherDetails: any = null;
  redemptionResult: any = null;

  // Real-time calculation variables
  discountAmount = 0;
  cashbackAmount = 0;
  remainingBill = 0;
  finalPayment = 0;
  newWalletBalance = 0;

  constructor() {
    addIcons({ 
      arrowBackOutline, 
      scanOutline, 
      checkmarkCircleOutline, 
      closeOutline, 
      cashOutline, 
      walletOutline, 
      receiptOutline, 
      alertCircleOutline,
      ticketOutline
    });
  }

  ngOnInit() {
    this.verificationForm = this.fb.group({
      voucher_code: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.redemptionForm = this.fb.group({
      bill_amount: ['', [Validators.min(0)]],
      wallet_amount_to_use: ['0', [Validators.min(0)]]
    });

    // Watch values on redemption form for real-time calculations
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

  resetPage() {
    this.step = 'VERIFY';
    this.voucherDetails = null;
    this.redemptionResult = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.verificationForm.reset();
    this.redemptionForm.reset({ bill_amount: '', wallet_amount_to_use: '0' });
  }

  async openScanner() {
    this.errorMessage = null;

    const hasPermission = await this.permissionsService.ensurePermission(
      'camera',
      'BizzDeal needs camera access to scan merchant QR codes for voucher redemption.'
    );

    if (!hasPermission) {
      return;
    }

    this.isScannerOpen = true;

    // Delay initialization to ensure the modal and its content are rendered
    setTimeout(() => {
      this.startScanner();
    }, 500);
  }

  async closeScanner() {
    this.isScannerOpen = false;
    document.body.classList.remove('barcode-scanner-active');
    try {
      await BarcodeScanner.stopScan();
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  }

  private async startScanner() {
    try {
      document.body.classList.add('barcode-scanner-active');

      const result = await BarcodeScanner.scan();

      
      if (result && result.barcodes && result.barcodes.length > 0) {
        let decodedText = result.barcodes[0].displayValue;
        
        // Sometimes QR codes contain double-encoded data, try decoding
        if (decodedText.includes('%7C') || decodedText.includes('%7c')) {
          try {
            decodedText = decodeURIComponent(decodedText);
          } catch (e) {}
        }

        console.log(`Scan result: ${decodedText}`);
        
        let voucherCode = decodedText;
        
        // Try JSON format as fallback
        try {
          const parsed = JSON.parse(decodedText);
          if (parsed.code) voucherCode = parsed.code;
        } catch (e) {
          // Plain voucher code string — check for pipe delimited format: CODE|PHONE
          if (voucherCode.includes('|')) {
            voucherCode = voucherCode.split('|')[0];
          }
        }

        console.log(`Parsed voucher code: ${voucherCode}`);

        this.verificationForm.patchValue({
          voucher_code: voucherCode
        });

        // Stop scanning and close modal
        await this.closeScanner();
        
        // If voucher code is filled, auto-verify
        if (this.verificationForm.value.voucher_code) {
          this.onVerify();
        }
      } else {
        await this.closeScanner();
      }
    } catch (error) {
      console.error('Scanner error:', error);
      this.errorMessage = 'Failed to start camera.';
      await this.closeScanner();
    }
  }

  onVerify() {
    if (this.verificationForm.invalid) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.isVerifying = true;
    this.errorMessage = null;
    const { voucher_code } = this.verificationForm.value;

    this.vouchersService.getVoucherDetails(voucher_code).subscribe({
      next: (details) => {
        this.isVerifying = false;
        
        // Ensure wallet_balance is always a number to prevent template errors
        details.wallet_balance = Number(details.wallet_balance || 0);
        
        this.voucherDetails = details;
        this.step = 'REDEEM';
        
        // Apply conditional validations
        const billControl = this.redemptionForm.get('bill_amount');
        const discountType = details.discount_type || details.offer?.discount_type;
        if (discountType === 'PERCENTAGE') {
          // Bill amount is mandatory for percentage discount
          billControl?.setValidators([Validators.required, Validators.min(0.01)]);
        } else {
          billControl?.setValidators([Validators.min(0)]);
        }
        billControl?.updateValueAndValidity();
        
        this.calculateLiveValues();
      },
      error: (err) => {
        this.isVerifying = false;
        this.errorMessage = extractFriendlyErrorMessage(err, 'Verification failed.');
      }
    });
  }

  calculateLiveValues() {
    if (!this.voucherDetails) return;

    const billAmount = Number(this.redemptionForm.value.bill_amount || 0);
    const walletToUse = Number(this.redemptionForm.value.wallet_amount_to_use || 0);

    let calculatedDiscount = 0;
    let cashbackEarned = 0;
    let remainingWalletCredit = 0;

    const offerType = this.voucherDetails.offer_type || this.voucherDetails.offer?.offer_type;
    const discountType = this.voucherDetails.discount_type || this.voucherDetails.offer?.discount_type;
    const rawDiscountVal = this.voucherDetails.discount_value !== undefined && this.voucherDetails.discount_value !== null
      ? this.voucherDetails.discount_value
      : this.voucherDetails.offer?.discount_value || 0;
      
    const discountVal = Number(rawDiscountVal);

    const isCashback = offerType === 'CASHBACK';

    if (discountType === 'PERCENTAGE') {
      if (billAmount > 0) {
        const amt = (billAmount * discountVal) / 100;
        if (isCashback) {
          cashbackEarned = amt;
        } else {
          calculatedDiscount = amt;
        }
      }
    } else {
      // FIXED discount
      if (isCashback) {
        cashbackEarned = discountVal;
      } else {
        if (billAmount > 0 && billAmount < discountVal) {
          calculatedDiscount = billAmount;
          remainingWalletCredit = discountVal - billAmount;
        } else {
          calculatedDiscount = discountVal;
        }
      }
    }

    this.discountAmount = Number(calculatedDiscount.toFixed(2));
    this.cashbackAmount = Number(cashbackEarned.toFixed(2));
    this.remainingBill = Number(Math.max(0, billAmount - calculatedDiscount).toFixed(2));

    // Validation for wallet amount to use
    const walletControl = this.redemptionForm.get('wallet_amount_to_use');
    if (walletToUse > this.voucherDetails.wallet_balance) {
      walletControl?.setErrors({ exceedBalance: true });
    } else if (walletToUse > this.remainingBill) {
      walletControl?.setErrors({ exceedBill: true });
    } else {
      walletControl?.setErrors(null);
    }

    this.finalPayment = Number(Math.max(0, this.remainingBill - walletToUse).toFixed(2));
    this.newWalletBalance = Number(
      (this.voucherDetails.wallet_balance - walletToUse + remainingWalletCredit + cashbackEarned).toFixed(2)
    );
  }

  onSubmitRedeem() {
    if (this.redemptionForm.invalid) {
      this.redemptionForm.markAllAsTouched();
      return;
    }

    this.isRedeeming = true;
    this.errorMessage = null;

    const payload = {
      voucher_code: this.voucherDetails!.voucher_code,
      bill_amount: this.redemptionForm.value.bill_amount ? Number(this.redemptionForm.value.bill_amount) : null,
      wallet_amount_to_use: Number(this.redemptionForm.value.wallet_amount_to_use || 0)
    };

    this.vouchersService.redeemVoucher(payload).subscribe({
      next: (res) => {
        this.isRedeeming = false;
        
        // Enhance the result from the backend with the values we just calculated
        this.redemptionResult = {
          ...res.data,
          discount_amount: this.discountAmount,
          cashback_earned: this.cashbackAmount,
          wallet_amount_used: payload.wallet_amount_to_use,
          final_bill_amount: this.finalPayment,
          new_wallet_balance: this.newWalletBalance
        };
        
        this.step = 'SUCCESS';
        
        // Redirect back home after 3 seconds
        setTimeout(() => {
          this.goBack();
        }, 3000);
      },
      error: (err) => {
        this.isRedeeming = false;
        this.errorMessage = extractFriendlyErrorMessage(err, 'Failed to redeem voucher.');
      }
    });
  }
}
