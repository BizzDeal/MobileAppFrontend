import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CustomerVoucher } from '../models/voucher.model';

const MOCK_CUSTOMER_VOUCHERS: CustomerVoucher[] = [
  {
    id: 'vouch-1',
    voucher_code: 'BIZZ-ART-50',
    offer_id: 'deal-1',
    customer_id: 'cust-101',
    business_id: 'biz-1',
    status: 'ISSUED',
    issued_at: '2026-07-07T14:30:00Z',
    redeemed_at: null,
    expires_at: '2026-07-31T23:59:59Z',
    redeemed_by_id: null,
    created_at: '2026-07-07T14:30:00Z',
    updated_at: '2026-07-07T14:30:00Z',
    offerTitle: '50% OFF on All Specialty Coffees & Pastries',
    businessName: 'The Artisan Roast Café',
    discountText: '50% OFF',
    discount_type: 'PERCENTAGE',
    discount_value: 50,
  },
  {
    id: 'vouch-2',
    voucher_code: 'BIZZ-SPA-35',
    offer_id: 'off-2',
    customer_id: 'cust-101',
    business_id: 'biz-3',
    status: 'ISSUED',
    issued_at: '2026-07-06T11:15:00Z',
    redeemed_at: null,
    expires_at: '2026-07-25T23:59:59Z',
    redeemed_by_id: null,
    created_at: '2026-07-06T11:15:00Z',
    updated_at: '2026-07-06T11:15:00Z',
    offerTitle: '35% Cashback on Royal Aromatherapy & Spa Day Pass',
    businessName: 'Zenith Spa & Sanctuary',
    discountText: '35% Cashback',
    discount_type: 'PERCENTAGE',
    discount_value: 35,
  },
  {
    id: 'vouch-3',
    voucher_code: 'BIZZ-COFFEE-10',
    offer_id: 'off-3',
    customer_id: 'cust-101',
    business_id: 'biz-1',
    status: 'REDEEMED',
    issued_at: '2026-07-05T09:00:00Z',
    redeemed_at: '2026-07-05T12:30:00Z',
    expires_at: '2026-07-20T23:59:59Z',
    redeemed_by_id: 'owner-1',
    created_at: '2026-07-05T09:00:00Z',
    updated_at: '2026-07-05T12:30:00Z',
    offerTitle: '10% Off Coffee at The Artisan Roast Café',
    businessName: 'The Artisan Roast Café',
    discountText: '10% OFF',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
  },
  {
    id: 'vouch-4',
    voucher_code: 'BIZZ-DONUT-100',
    offer_id: 'off-4',
    customer_id: 'cust-101',
    business_id: 'biz-6',
    status: 'EXPIRED',
    issued_at: '2026-06-01T10:00:00Z',
    redeemed_at: null,
    expires_at: '2026-06-15T23:59:59Z',
    redeemed_by_id: null,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-15T23:59:59Z',
    offerTitle: 'Free Donut at Bistro 57 Gourmet & Bar',
    businessName: 'Bistro 57 Gourmet & Bar',
    discountText: 'Free Donut',
    discount_type: 'PERCENTAGE',
    discount_value: 100,
  },
  {
    id: 'vouch-5',
    voucher_code: 'BIZZ-GYM-15',
    offer_id: 'off-5',
    customer_id: 'cust-101',
    business_id: 'biz-2',
    status: 'CANCELLED',
    issued_at: '2026-06-10T11:00:00Z',
    redeemed_at: null,
    expires_at: '2026-06-30T23:59:59Z',
    redeemed_by_id: null,
    created_at: '2026-06-10T11:00:00Z',
    updated_at: '2026-06-30T23:59:59Z',
    offerTitle: '15% Off Gym Membership at Vogue Avenue Boutique',
    businessName: 'Vogue Avenue Boutique',
    discountText: '15% OFF',
    discount_type: 'PERCENTAGE',
    discount_value: 15,
  }
];

@Injectable({
  providedIn: 'root'
})
export class CustomerVouchersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _vouchers = signal<CustomerVoucher[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  readonly vouchers = this._vouchers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.loadVouchers().subscribe();
  }

  loadVouchers(): Observable<CustomerVoucher[]> {
    this._loading.set(true);
    this._error.set(null);

    return of(MOCK_CUSTOMER_VOUCHERS).pipe(
      delay(400),
      tap({
        next: (data) => {
          const current = this._vouchers();
          if (current.length > 0) {
            const merged = [...current];
            data.forEach(v => {
              if (!merged.find(item => item.id === v.id)) {
                merged.push(v);
              }
            });
            this._vouchers.set(merged);
          } else {
            this._vouchers.set(data);
          }
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.message || 'Failed to retrieve vouchers';
          this._error.set(errMsg);
          this._loading.set(false);
        }
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  addVoucher(voucher: CustomerVoucher): void {
    const current = this._vouchers();
    if (!current.find(v => v.id === voucher.id)) {
      this._vouchers.set([voucher, ...current]);
    }
  }
}
