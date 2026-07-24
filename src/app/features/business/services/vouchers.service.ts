import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  status: 'ISSUED' | 'REDEEMED' | 'CANCELLED';
  offerTitle: string;
}

@Injectable({
  providedIn: 'root'
})
export class VouchersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  issueVoucher(payload: IssueVoucherRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/vouchers/issue`, payload, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getVoucherDetails(code: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/vouchers/${code}`).pipe(
      map((voucher: any) => {
        // backend should return { data: ... } or just voucher object
        const v = voucher.data || voucher;

        if (v.status === 'REDEEMED') {
          throw new Error('Voucher has already been redeemed');
        }

        if (v.status === 'CANCELLED') {
          throw new Error('Voucher is cancelled');
        }
        
        return v;
      }),
      catchError(err => throwError(() => err))
    );
  }

  redeemVoucher(payload: {
    voucher_code: string;
    bill_amount?: number | null;
    wallet_amount_to_use?: number;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/vouchers/redeem`, payload, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).pipe(
      catchError(err => throwError(() => err))
    );
  }
}

