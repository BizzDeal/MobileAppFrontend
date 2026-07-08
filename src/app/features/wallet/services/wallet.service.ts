import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { WalletDTO, WalletTransactionDTO } from '../models/wallet.model';

const MOCK_WALLET: WalletDTO = {
  id: 'wallet-101',
  user_id: 'cust-101',
  balance: 2450.00,
  total_savings: 8920.50,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-07-08T10:00:00Z',
};

const MOCK_TRANSACTIONS: WalletTransactionDTO[] = [
  {
    id: 'tx-201',
    wallet_id: 'wallet-101',
    user_id: 'cust-101',
    type: 'SAVING',
    amount: 150.00,
    description: 'Cashback from The Artisan Roast Café',
    reference_type: 'VOUCHER',
    reference_id: 'vouch-1',
    created_at: '2026-07-08T09:30:00Z',
    updated_at: '2026-07-08T09:30:00Z',
  },
  {
    id: 'tx-202',
    wallet_id: 'wallet-101',
    user_id: 'cust-101',
    type: 'DEBIT',
    amount: 500.00,
    description: 'Redeemed voucher at Vogue Avenue Boutique',
    reference_type: 'VOUCHER',
    reference_id: 'vouch-2',
    created_at: '2026-07-07T18:15:00Z',
    updated_at: '2026-07-07T18:15:00Z',
  },
  {
    id: 'tx-203',
    wallet_id: 'wallet-101',
    user_id: 'cust-101',
    type: 'SAVING',
    amount: 350.00,
    description: 'Cashback from Zenith Spa & Sanctuary',
    reference_type: 'VOUCHER',
    reference_id: 'vouch-3',
    created_at: '2026-07-06T14:20:00Z',
    updated_at: '2026-07-06T14:20:00Z',
  },
  {
    id: 'tx-204',
    wallet_id: 'wallet-101',
    user_id: 'cust-101',
    type: 'CREDIT',
    amount: 1000.00,
    description: 'Refund processed by Admin',
    reference_type: 'MANUAL',
    reference_id: null,
    created_at: '2026-07-05T10:00:00Z',
    updated_at: '2026-07-05T10:00:00Z',
  },
  {
    id: 'tx-205',
    wallet_id: 'wallet-101',
    user_id: 'cust-101',
    type: 'SAVING',
    amount: 120.00,
    description: 'Referral reward for inviting Rohan Sharma',
    reference_type: 'REFERRAL',
    reference_id: 'ref-301',
    created_at: '2026-07-02T11:45:00Z',
    updated_at: '2026-07-02T11:45:00Z',
  },
  {
    id: 'tx-206',
    wallet_id: 'wallet-101',
    user_id: 'cust-101',
    type: 'DEBIT',
    amount: 250.00,
    description: 'Purchase at Bistro 57 Gourmet & Bar',
    reference_type: 'VOUCHER',
    reference_id: 'vouch-4',
    created_at: '2026-06-30T20:30:00Z',
    updated_at: '2026-06-30T20:30:00Z',
  }
];

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private readonly http = inject(HttpClient);

  private readonly _wallet = signal<WalletDTO | null>(null);
  private readonly _transactions = signal<WalletTransactionDTO[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  readonly wallet = this._wallet.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.loadWalletData().subscribe();
  }

  loadWalletData(): Observable<{ wallet: WalletDTO; transactions: WalletTransactionDTO[] }> {
    this._loading.set(true);
    this._error.set(null);

    // Mimic API delay and return the mock data structures
    return of({ wallet: MOCK_WALLET, transactions: MOCK_TRANSACTIONS }).pipe(
      delay(400),
      tap({
        next: (data) => {
          this._wallet.set(data.wallet);
          this._transactions.set(data.transactions);
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.message || 'Failed to retrieve wallet information';
          this._error.set(errMsg);
          this._loading.set(false);
        },
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }
}
