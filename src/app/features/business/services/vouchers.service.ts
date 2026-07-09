import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface IssueVoucherRequest {
  offer_id: string;
  customer_phone: string;
}

export interface MockVoucher {
  id: string;
  voucher_code: string;
  offer_id: string;
  customer_phone: string;
  customer_name: string;
  customer_id: string;
  status: 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
  offerTitle: string;
  discountText: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  wallet_balance: number;
  expires_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class VouchersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // In-memory mock database for vouchers
  private mockVouchers: MockVoucher[] = [
    {
      id: 'v-1',
      voucher_code: 'VOU-ACTIVE-PCT',
      offer_id: 'off-1',
      customer_phone: '9876543210',
      customer_name: 'Jane Doe',
      customer_id: 'cust-1',
      status: 'ISSUED',
      offerTitle: '50% Off Special at TechHub',
      discountText: '50% Off',
      discount_type: 'PERCENTAGE',
      discount_value: 50,
      wallet_balance: 150.00,
      expires_at: '2026-12-31T23:59:59.000Z'
    },
    {
      id: 'v-2',
      voucher_code: 'VOU-ACTIVE-FLAT',
      offer_id: 'off-2',
      customer_phone: '9876543210',
      customer_name: 'Jane Doe',
      customer_id: 'cust-1',
      status: 'ISSUED',
      offerTitle: '$30 Off Premium Spa Treatment',
      discountText: '$30 Off',
      discount_type: 'FIXED',
      discount_value: 30,
      wallet_balance: 75.00,
      expires_at: '2026-12-31T23:59:59.000Z'
    },
    {
      id: 'v-3',
      voucher_code: 'VOU-REDEEMED',
      offer_id: 'off-3',
      customer_phone: '9876543210',
      customer_name: 'Jane Doe',
      customer_id: 'cust-1',
      status: 'REDEEMED',
      offerTitle: '10% Off Coffee at Starbucks',
      discountText: '10% Off',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      wallet_balance: 0.00,
      expires_at: '2026-12-31T23:59:59.000Z'
    },
    {
      id: 'v-4',
      voucher_code: 'VOU-EXPIRED',
      offer_id: 'off-4',
      customer_phone: '9876543210',
      customer_name: 'Jane Doe',
      customer_id: 'cust-1',
      status: 'EXPIRED',
      offerTitle: 'Free Donut at Dunkin',
      discountText: '100% Off',
      discount_type: 'PERCENTAGE',
      discount_value: 100,
      wallet_balance: 10.00,
      expires_at: '2026-06-01T23:59:59.000Z'
    },
    {
      id: 'v-5',
      voucher_code: 'VOU-CANCELLED',
      offer_id: 'off-5',
      customer_phone: '9876543210',
      customer_name: 'Jane Doe',
      customer_id: 'cust-1',
      status: 'CANCELLED',
      offerTitle: '15% Off Gym Membership',
      discountText: '15% Off',
      discount_type: 'PERCENTAGE',
      discount_value: 15,
      wallet_balance: 20.00,
      expires_at: '2026-12-31T23:59:59.000Z'
    },
    {
      id: 'v-6',
      voucher_code: 'VOU-ALEX-50',
      offer_id: 'off-6',
      customer_phone: '9999999999',
      customer_name: 'Alex Mercer',
      customer_id: 'cust-2',
      status: 'ISSUED',
      offerTitle: '50% Off Gaming Gear',
      discountText: '50% Off',
      discount_type: 'PERCENTAGE',
      discount_value: 50,
      wallet_balance: 300.00,
      expires_at: '2026-12-31T23:59:59.000Z'
    }
  ];

  issueVoucher(payload: IssueVoucherRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/vouchers/issue`, payload).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getVoucherDetails(code: string, phone: string): Observable<MockVoucher> {
    return new Observable<MockVoucher>(subscriber => {
      setTimeout(() => {
        const voucher = this.mockVouchers.find(
          v => v.voucher_code.trim().toUpperCase() === code.trim().toUpperCase()
        );

        if (!voucher) {
          subscriber.error({
            error: { message: 'Voucher code not found' }
          });
          return;
        }

        if (voucher.customer_phone !== phone) {
          subscriber.error({
            error: { message: 'Voucher does not belong to this customer phone number' }
          });
          return;
        }

        if (voucher.status === 'REDEEMED') {
          subscriber.error({
            error: { message: 'Voucher has already been redeemed' }
          });
          return;
        }

        if (voucher.status === 'CANCELLED') {
          subscriber.error({
            error: { message: 'Voucher is cancelled' }
          });
          return;
        }

        const now = new Date();
        const expiry = new Date(voucher.expires_at);
        if (voucher.status === 'EXPIRED' || now > expiry) {
          subscriber.error({
            error: { message: 'Voucher has expired' }
          });
          return;
        }

        subscriber.next(JSON.parse(JSON.stringify(voucher))); // return copy
        subscriber.complete();
      }, 800);
    });
  }

  redeemVoucher(payload: {
    voucher_code: string;
    bill_amount?: number | null;
    wallet_amount_to_use?: number;
  }): Observable<any> {
    return new Observable<any>(subscriber => {
      setTimeout(() => {
        const voucher = this.mockVouchers.find(
          v => v.voucher_code.trim().toUpperCase() === payload.voucher_code.trim().toUpperCase()
        );

        if (!voucher) {
          subscriber.error({ error: { message: 'Voucher not found' } });
          return;
        }

        if (voucher.status === 'REDEEMED') {
          subscriber.error({ error: { message: 'Voucher has already been redeemed' } });
          return;
        }

        const billAmount = Number(payload.bill_amount || 0);
        const walletAmountToUse = Number(payload.wallet_amount_to_use || 0);

        let calculatedDiscount = 0;
        let remainingWalletCredit = 0;

        if (voucher.discount_type === 'PERCENTAGE') {
          if (billAmount > 0) {
            calculatedDiscount = (billAmount * voucher.discount_value) / 100;
          } else if (voucher.discount_value > 0) {
            subscriber.error({
              error: { message: 'Bill amount is required to calculate percentage discount' }
            });
            return;
          }
        } else {
          // FIXED discount
          if (billAmount > 0 && billAmount < voucher.discount_value) {
            calculatedDiscount = billAmount;
            remainingWalletCredit = voucher.discount_value - billAmount;
          } else {
            calculatedDiscount = voucher.discount_value;
          }
        }

        if (walletAmountToUse > 0) {
          if (voucher.wallet_balance < walletAmountToUse) {
            subscriber.error({
              error: { message: 'Insufficient wallet balance' }
            });
            return;
          }

          const remainingBill = billAmount - calculatedDiscount;
          if (walletAmountToUse > remainingBill) {
            subscriber.error({
              error: { message: 'Wallet amount cannot exceed remaining bill after discount' }
            });
            return;
          }
        }

        // Apply changes to mock db
        voucher.status = 'REDEEMED';
        voucher.wallet_balance = Number((voucher.wallet_balance - walletAmountToUse + remainingWalletCredit).toFixed(2));

        subscriber.next({
          success: true,
          message: 'Voucher redeemed successfully',
          data: {
            voucher_code: voucher.voucher_code,
            discount_amount: Number(calculatedDiscount.toFixed(2)),
            remaining_wallet_credit: Number(remainingWalletCredit.toFixed(2)),
            wallet_amount_used: Number(walletAmountToUse.toFixed(2)),
            final_bill_amount: Number(Math.max(0, billAmount - calculatedDiscount - walletAmountToUse).toFixed(2)),
            new_wallet_balance: voucher.wallet_balance
          }
        });
        subscriber.complete();
      }, 1000);
    });
  }
}

