import { Component, inject, OnInit } from '@angular/core';
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
      customer_phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      voucher_code: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.redemptionForm = this.fb.group({
      bill_amount: ['', [Validators.min(0)]],
      wallet_amount_to_use: ['0', [Validators.min(0)]]
    });

    // Watch values on redemption form for real-time calculations
    this.redemptionForm.valueChanges.subscribe(() => {
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
    this.isScannerOpen = true;
    this.errorMessage = null;

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
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        this.errorMessage = 'Camera permission is required to scan QR codes.';
        this.isScannerOpen = false;
        return;
      }

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

        // TEMPORARY DEBUG: Show exactly what the scanner read
        alert(`Scanner read: ${decodedText}`);
        
        console.log(`Scan result: ${decodedText}`);
        
        let voucherCode = decodedText;
        let customerPhone = '';
        
        // Try pipe-delimited format: CODE|PHONE
        if (decodedText.includes('|')) {
          const parts = decodedText.split('|');
          voucherCode = parts[0];
          customerPhone = parts[1] || '';
        } else {
          // Try JSON format as fallback
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.code) voucherCode = parsed.code;
            if (parsed.phone) customerPhone = parsed.phone;
          } catch (e) {
            // Plain voucher code string — use as-is
          }
        }

        console.log(`Parsed voucher code: ${voucherCode}, phone: ${customerPhone}`);

        this.verificationForm.patchValue({
          voucher_code: voucherCode,
          ...(customerPhone ? { customer_phone: customerPhone } : {})
        });

        // Stop scanning and close modal
        await this.closeScanner();
        
        // If both fields are filled, auto-verify
        if (this.verificationForm.value.customer_phone && this.verificationForm.value.voucher_code) {
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
    const { voucher_code, customer_phone } = this.verificationForm.value;

    this.vouchersService.getVoucherDetails(voucher_code, customer_phone).subscribe({
      next: (details) => {
        this.isVerifying = false;
        this.voucherDetails = details;
        this.step = 'REDEEM';
        
        // Apply conditional validations
        const billControl = this.redemptionForm.get('bill_amount');
        if (details.offer?.discount_type === 'PERCENTAGE') {
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
        this.errorMessage = err?.error?.message || err?.message || 'Verification failed';
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

    const isCashback = this.voucherDetails.offer?.offer_type === 'CASHBACK';

    if (this.voucherDetails.offer?.discount_type === 'PERCENTAGE') {
      if (billAmount > 0) {
        const amt = (billAmount * (this.voucherDetails.offer?.discount_value || 0)) / 100;
        if (isCashback) {
          cashbackEarned = amt;
        } else {
          calculatedDiscount = amt;
        }
      }
    } else {
      // FIXED discount
      const discountVal = this.voucherDetails.offer?.discount_value || 0;
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
        this.errorMessage = err?.error?.message || err?.message || 'Failed to redeem voucher';
      }
    });
  }
}
