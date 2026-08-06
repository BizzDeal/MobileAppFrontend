import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, effect, untracked } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, shareReplay, finalize } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { WalletDTO, WalletTransactionDTO } from '../models/wallet.model';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { AppSocketService } from '../../../core/services/app-socket.service';
import { extractFriendlyErrorMessage } from '../../../core/utils/error.utils';

export interface BizzCoinTransactionItem {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  business_name?: string;
  created_at: string;
  isBizzCoin: true;
}

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly appSocket = inject(AppSocketService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _wallet = signal<WalletDTO | null>(null);
  private readonly _transactions = signal<WalletTransactionDTO[]>([]);
  private readonly _bizzCoinsBalance = signal<number>(0);
  private readonly _bizzCoinsTransactions = signal<BizzCoinTransactionItem[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  
  private readonly _page = signal<number>(1);
  private readonly _limit = signal<number>(20);
  private readonly _hasMore = signal<boolean>(true);
  private inFlightWallet$: Observable<{ wallet: WalletDTO; transactions: WalletTransactionDTO[] }> | null = null;

  readonly wallet = this._wallet.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly bizzCoinsBalance = this._bizzCoinsBalance.asReadonly();
  readonly bizzCoinsTransactions = this._bizzCoinsTransactions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();

  constructor() {
    effect(() => {
      const isAuth = this.authSession.isAuthenticated();
      if (isAuth) {
        untracked(() => {
          if (!this._wallet()) {
            this.loadWalletData().subscribe({
              error: (err) => console.error('Initial wallet data load encountered error:', err),
            });
          }
        });
      } else {
        untracked(() => {
          this._wallet.set(null);
          this._transactions.set([]);
          this._bizzCoinsBalance.set(0);
          this._bizzCoinsTransactions.set([]);
        });
      }
    });

    this.appSocket.onEvent('VOUCHER_REDEEMED').subscribe(() => {
      if (this.authSession.isAuthenticated()) {
        this.refreshWallet().subscribe({
          error: (err) => console.error('Failed to refresh wallet on voucher redemption:', err)
        });
      }
    });

    this.appSocket.onEvent('BIZZ_COINS_ISSUED').subscribe(() => {
      if (this.authSession.isAuthenticated()) {
        this.refreshWallet().subscribe({
          error: (err) => console.error('Failed to refresh wallet on Bizz Coins issue:', err)
        });
      }
    });

    this.appSocket.onEvent('app_event').subscribe((evt: any) => {
      if (this.authSession.isAuthenticated() && (evt?.type === 'BIZZ_COINS_ISSUED' || evt?.type === 'VOUCHER_REDEEMED')) {
        this.refreshWallet().subscribe({
          error: (err) => console.error('Failed to refresh wallet on app event:', err)
        });
      }
    });
  }

  refreshWallet(): Observable<{ wallet: WalletDTO; transactions: WalletTransactionDTO[] }> {
    return this.loadWalletData(true);
  }

  loadWalletData(forceRefresh = false): Observable<{ wallet: WalletDTO; transactions: WalletTransactionDTO[] }> {
    if (!forceRefresh && this._wallet() && !this._loading()) {
      return of({ wallet: this._wallet()!, transactions: this._transactions() });
    }

    if (this.inFlightWallet$) {
      return this.inFlightWallet$;
    }

    this._loading.set(true);
    this._error.set(null);

    const request$ = forkJoin({
      balanceRes: this.http.get<any>(`${this.apiUrl}/wallet/balance`),
      historyRes: this.http.get<any>(`${this.apiUrl}/wallet/history`, {
        params: new HttpParams().set('page', '1').set('limit', this._limit().toString())
      }),
      bizzCoinsRes: this.http.get<any>(`${this.apiUrl}/bizz-coins/my-wallet`).pipe(
        catchError(() => of({ coins_balance: 0, transactions: [] }))
      )
    }).pipe(
      map(({ balanceRes, historyRes, bizzCoinsRes }) => {
        const w = balanceRes?.data || balanceRes || {};
        const wallet: WalletDTO = {
          id: w.id || 'wallet',
          user_id: w.user_id || 'user',
          balance: Number(w.balance || 0),
          total_savings: Number(w.total_savings || 0),
          created_at: w.created_at || new Date().toISOString(),
          updated_at: w.updated_at || new Date().toISOString()
        };

        const rawTx: any[] = Array.isArray(historyRes) ? historyRes : historyRes?.data || historyRes?.items || [];
        const transactions: WalletTransactionDTO[] = rawTx.map((t) => ({
          id: t.id,
          wallet_id: t.wallet_id || wallet.id,
          user_id: t.user_id || wallet.user_id,
          type: t.type || 'SAVING',
          amount: Number(t.amount || 0),
          description: t.description || null,
          reference_type: t.reference_type || null,
          reference_id: t.reference_id || null,
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || new Date().toISOString()
        }));

        const rawCoinsBalance = Number(bizzCoinsRes?.coins_balance || 0);
        const rawCoinsTx: any[] = bizzCoinsRes?.transactions || [];
        const bizzCoinsTransactions: BizzCoinTransactionItem[] = rawCoinsTx.map((t) => ({
          id: t.id,
          type: t.type || 'CREDIT',
          amount: Number(t.amount || 0),
          description: t.description || `Received ${t.amount} Bizz Coins`,
          business_name: t.business_name || 'BizzDeal Partner',
          created_at: t.created_at || new Date().toISOString(),
          isBizzCoin: true
        }));

        return { wallet, transactions, bizzCoinsBalance: rawCoinsBalance, bizzCoinsTransactions, meta: historyRes?.meta };
      }),
      tap({
        next: (data) => {
          this._wallet.set(data.wallet);
          this._transactions.set(data.transactions);
          this._bizzCoinsBalance.set(data.bizzCoinsBalance);
          this._bizzCoinsTransactions.set(data.bizzCoinsTransactions);
          
          if (data.meta) {
            this._page.set(data.meta.currentPage);
            this._limit.set(data.meta.itemsPerPage);
            this._hasMore.set(data.meta.currentPage < data.meta.totalPages);
          } else {
            this._page.set(1);
            this._hasMore.set(data.transactions.length === this._limit());
          }
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = extractFriendlyErrorMessage(err, 'Failed to retrieve wallet information.');
          this._error.set(errMsg);
          this._loading.set(false);
        },
      }),
      map(({ wallet, transactions }) => ({ wallet, transactions })),
      catchError((err) => {
        return throwError(() => err);
      }),
      finalize(() => {
        this.inFlightWallet$ = null;
      }),
      shareReplay(1)
    );

    this.inFlightWallet$ = request$;
    return this.inFlightWallet$;
  }

  loadMoreHistory(search = ''): Observable<WalletTransactionDTO[]> | null {
    if (!this._hasMore() || this._loading()) return null;

    let params = new HttpParams()
      .set('page', (this._page() + 1).toString())
      .set('limit', this._limit().toString());
    if (search) params = params.set('search', search);

    return this.http.get<any>(`${this.apiUrl}/wallet/history`, { params }).pipe(
      map((res) => {
        const rawTx: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const wallet = this._wallet();
        const transactions: WalletTransactionDTO[] = rawTx.map((t) => ({
          id: t.id,
          wallet_id: t.wallet_id || wallet?.id,
          user_id: t.user_id || wallet?.user_id,
          type: t.type || 'SAVING',
          amount: Number(t.amount || 0),
          description: t.description || null,
          reference_type: t.reference_type || null,
          reference_id: t.reference_id || null,
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || new Date().toISOString()
        }));
        return { transactions, meta: res?.meta };
      }),
      tap({
        next: ({ transactions, meta }) => {
          this._transactions.update(prev => [...prev, ...transactions]);
          if (meta) {
            this._page.set(meta.currentPage);
            this._limit.set(meta.itemsPerPage);
            this._hasMore.set(meta.currentPage < meta.totalPages);
          } else {
            this._page.update(p => p + 1);
            this._hasMore.set(transactions.length === this._limit());
          }
        },
        error: (err) => {
          const errMsg = extractFriendlyErrorMessage(err, 'Failed to load more transactions.');
          this._error.set(errMsg);
        }
      }),
      map(({ transactions }) => transactions)
    );
  }
}
