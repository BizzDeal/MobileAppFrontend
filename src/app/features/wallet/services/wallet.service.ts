import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, effect, untracked } from '@angular/core';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { WalletDTO, WalletTransactionDTO } from '../models/wallet.model';
import { AuthSessionService } from '../../../core/services/auth-session.service';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _wallet = signal<WalletDTO | null>(null);
  private readonly _transactions = signal<WalletTransactionDTO[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  readonly wallet = this._wallet.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    effect(() => {
      const isAuth = this.authSession.isAuthenticated();
      if (isAuth) {
        untracked(() => {
          this.loadWalletData().subscribe({
            error: (err) => console.error('Initial wallet data load encountered error:', err),
          });
        });
      } else {
        untracked(() => {
          this._wallet.set(null);
          this._transactions.set([]);
        });
      }
    });
  }

  refreshWallet(): Observable<{ wallet: WalletDTO; transactions: WalletTransactionDTO[] }> {
    return this.loadWalletData();
  }

  loadWalletData(): Observable<{ wallet: WalletDTO; transactions: WalletTransactionDTO[] }> {
    this._loading.set(true);
    this._error.set(null);

    return forkJoin({
      balanceRes: this.http.get<any>(`${this.apiUrl}/wallet/balance`),
      historyRes: this.http.get<any>(`${this.apiUrl}/wallet/history`)
    }).pipe(
      map(({ balanceRes, historyRes }) => {
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

        return { wallet, transactions };
      }),
      tap({
        next: (data) => {
          this._wallet.set(data.wallet);
          this._transactions.set(data.transactions);
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to retrieve wallet information from server';
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
