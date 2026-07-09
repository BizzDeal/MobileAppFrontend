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
import { VouchersService, MockVoucher } from '../../services/vouchers.service';

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

  voucherDetails: MockVoucher | null = null;
  redemptionResult: any = null;

  // Real-time calculation variables
  discountAmount = 0;
  remainingBill = 0;
  finalPayment = 0;
  newWalletBalance = 0;

  // Mock list of QR codes to let users click to simulate scanning
  mockQRCodes = [
    { label: 'Jane Doe (50% Off)', code: 'VOU-ACTIVE-PCT', phone: '9876543210' },
    { label: 'Jane Doe ($30 Off Flat)', code: 'VOU-ACTIVE-FLAT', phone: '9876543210' },
    { label: 'Jane Doe (Already Redeemed)', code: 'VOU-REDEEMED', phone: '9876543210' },
    { label: 'Jane Doe (Expired Voucher)', code: 'VOU-EXPIRED', phone: '9876543210' },
    { label: 'Alex Mercer (50% Off Gaming)', code: 'VOU-ALEX-50', phone: '9999999999' }
  ];

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

  openScanner() {
    this.isScannerOpen = true;
    this.errorMessage = null;
  }

  closeScanner() {
    this.isScannerOpen = false;
  }

  simulateScan(code: string, phone: string) {
    this.verificationForm.patchValue({
      customer_phone: phone,
      voucher_code: code
    });
    this.closeScanner();
    this.onVerify();
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
        if (details.discount_type === 'PERCENTAGE') {
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
    let remainingWalletCredit = 0;

    if (this.voucherDetails.discount_type === 'PERCENTAGE') {
      if (billAmount > 0) {
        calculatedDiscount = (billAmount * this.voucherDetails.discount_value) / 100;
      }
    } else {
      // FIXED discount
      if (billAmount > 0 && billAmount < this.voucherDetails.discount_value) {
        calculatedDiscount = billAmount;
        remainingWalletCredit = this.voucherDetails.discount_value - billAmount;
      } else {
        calculatedDiscount = this.voucherDetails.discount_value;
      }
    }

    this.discountAmount = Number(calculatedDiscount.toFixed(2));
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
      (this.voucherDetails.wallet_balance - walletToUse + remainingWalletCredit).toFixed(2)
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
        this.redemptionResult = res.data;
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
