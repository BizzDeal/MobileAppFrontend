import { Injectable, inject, signal, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CustomerVoucher } from '../models/voucher.model';
import { AppSocketService } from '../../../core/services/app-socket.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerVouchersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly appSocket = inject(AppSocketService);
  private readonly authSession = inject(AuthSessionService);

  private readonly _vouchers = signal<CustomerVoucher[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  readonly vouchers = this._vouchers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    effect(() => {
      const role = this.authSession.userRole();
      if (role === 'CUSTOMER') {
        untracked(() => {
          this.loadVouchers().subscribe({
            error: (err) => console.error('Initial customer vouchers load encountered error:', err),
          });
        });
      }
    });

    // Handle WebSocket connection and listen for generic app events
    effect(() => {
      if (this.authSession.isAuthenticated()) {
        untracked(() => this.appSocket.connect());
      }
    });
    
    this.appSocket.onEvent('VOUCHER_REDEEMED').subscribe(event => {
      this.updateVoucherStatus(event.payload.voucher_id, event.payload.status);
    });
  }

  loadVouchers(): Observable<CustomerVoucher[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<any>(`${this.apiUrl}/vouchers/customer`).pipe(
      map((res) => {
        const rawList: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const list: CustomerVoucher[] = rawList.map((v) => ({
          id: v.id,
          voucher_code: v.voucher_code,
          offer_id: v.offer_id,
          customer_id: v.customer_id,
          business_id: v.business_id,
          status: v.status || 'ISSUED',
          issued_at: v.issued_at || new Date().toISOString(),
          redeemed_at: v.redeemed_at || null,
          expires_at: v.expires_at || new Date().toISOString(),
          redeemed_by_id: v.redeemed_by_id || null,
          created_at: v.created_at || new Date().toISOString(),
          updated_at: v.updated_at || new Date().toISOString(),
          offerTitle: v.offerTitle || v.offer?.title || 'Promotional Offer',
          businessName: v.businessName || v.business?.name || 'BizzDeal Partner',
          discountText: v.discountText || (v.offer?.discount_type === 'PERCENTAGE' 
            ? `${v.offer.discount_value}% OFF` 
            : v.offer?.discount_type === 'FIXED_AMOUNT' 
              ? `₹${v.offer.discount_value} OFF` 
              : 'Special Deal'),
          discount_type: v.discount_type || v.offer?.discount_type || undefined,
          discount_value: v.discount_value ?? v.offer?.discount_value ?? undefined,
          offer_type: v.offer_type || v.offer?.offer_type || undefined,
          imageUrl: v.imageUrl || v.offer?.image_url || v.offer?.imageUrl || undefined,
          customer_phone: v.customer_phone || undefined,
        }));
        return list;
      }),
      tap({
        next: (list) => {
          this._vouchers.set(list);
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to retrieve vouchers from server';
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

  updateVoucherStatus(voucherId: string, status: 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED'): void {
    this._vouchers.update(vouchers =>
      vouchers.map(v => (v.id === voucherId ? { ...v, status, redeemed_at: status === 'REDEEMED' ? new Date().toISOString() : v.redeemed_at } : v))
    );
  }
}
