import { Injectable, inject, signal, effect, untracked } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  private readonly _page = signal<number>(1);
  private readonly _limit = signal<number>(20);
  private readonly _hasMore = signal<boolean>(true);

  readonly vouchers = this._vouchers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();

  constructor() {
    effect(() => {
      const isAuth = this.authSession.isAuthenticated();
      const role = this.authSession.userRole();
      if (isAuth && (role === 'CUSTOMER' || !role)) {
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

  loadVouchers(page = 1, limit = 20, append = false, search = ''): Observable<CustomerVoucher[]> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);

    return this.http.get<any>(`${this.apiUrl}/vouchers/customer`, { params }).pipe(
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
          redeemed_by_id: v.redeemed_by_id || null,
          created_at: v.created_at || new Date().toISOString(),
          updated_at: v.updated_at || new Date().toISOString(),
          offerTitle: v.offerTitle || v.offer?.title || 'Promotional Offer',
          businessName: v.businessName || v.business?.name || 'BizzDeal Partner',
          discountText: v.discountText || (v.offer_type === 'CASHBACK' || v.offer?.offer_type === 'CASHBACK'
            ? `₹${v.discount_value ?? v.offer?.discount_value} Cashback`
            : v.discount_type === 'PERCENTAGE' || v.offer?.discount_type === 'PERCENTAGE' 
              ? `${v.discount_value ?? v.offer?.discount_value}% OFF` 
              : `₹${v.discount_value ?? v.offer?.discount_value} Flat OFF`),
          discount_type: v.discount_type || v.offer?.discount_type || undefined,
          discount_value: v.discount_value ?? v.offer?.discount_value ?? undefined,
          offer_type: v.offer_type || v.offer?.offer_type || undefined,
          imageUrl: v.imageUrl || v.offer?.image_url || v.offer?.imageUrl || undefined,
          customer_phone: v.customer_phone || undefined,
        }));
        return { list, meta: res?.meta };
      }),
      tap({
        next: ({ list, meta }) => {
          if (append) {
            this._vouchers.update(prev => [...prev, ...list]);
          } else {
            this._vouchers.set(list);
          }
          
          if (meta) {
            this._page.set(meta.currentPage);
            this._limit.set(meta.itemsPerPage);
            this._hasMore.set(meta.currentPage < meta.totalPages);
          } else {
            this._page.set(page);
            this._hasMore.set(list.length === limit);
          }
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to retrieve vouchers from server';
          this._error.set(errMsg);
          this._loading.set(false);
        }
      }),
      map(({ list }) => list),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  loadMoreVouchers(search = ''): Observable<CustomerVoucher[]> | null {
    if (!this._hasMore() || this._loading()) return null;
    return this.loadVouchers(this._page() + 1, this._limit(), true, search);
  }

  addVoucher(voucher: CustomerVoucher): void {
    const current = this._vouchers();
    if (!current.find(v => v.id === voucher.id)) {
      this._vouchers.set([voucher, ...current]);
    }
  }

  updateVoucherStatus(voucherId: string, status: 'ISSUED' | 'REDEEMED' | 'CANCELLED'): void {
    this._vouchers.update(vouchers =>
      vouchers.map(v => (v.id === voucherId ? { ...v, status, redeemed_at: status === 'REDEEMED' ? new Date().toISOString() : v.redeemed_at } : v))
    );
  }
}
