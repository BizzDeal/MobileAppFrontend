import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdminBusiness, BusinessStatus, ApiResponse, AdminOffer, AdminVoucher, OfferStatus } from '../models/admin-business.model';

@Injectable({
  providedIn: 'root'
})
export class AdminBusinessesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  constructor() {}

  getBusinesses(query?: any): Observable<ApiResponse<AdminBusiness[]>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key] !== null && query[key] !== undefined) {
          params = params.set(key, query[key]);
        }
      });
    }
    return this.http.get<ApiResponse<AdminBusiness[]>>(`${this.apiUrl}/businesses`, { params }).pipe(
      catchError(err => {
        throw new Error(err.error?.message || 'Failed to fetch businesses');
      })
    );
  }

  updateBusinessStatus(id: string, status: BusinessStatus): Observable<ApiResponse<AdminBusiness>> {
    return this.http.patch<ApiResponse<AdminBusiness>>(`${this.apiUrl}/businesses/${id}/status`, { status }).pipe(
      catchError(err => {
        throw new Error(err.error?.message || 'Failed to update business status');
      })
    );
  }

  featureBusiness(id: string, isFeatured: boolean): Observable<ApiResponse<AdminBusiness>> {
    return this.http.put<ApiResponse<AdminBusiness>>(`${this.apiUrl}/businesses/feature`, { businessId: id, is_featured: isFeatured }).pipe(
      catchError(err => {
        throw new Error(err.error?.message || 'Failed to feature business');
      })
    );
  }

  getBusinessById(id: string): Observable<ApiResponse<AdminBusiness>> {
    return this.http.get<ApiResponse<AdminBusiness>>(`${this.apiUrl}/businesses/${id}`).pipe(
      catchError(err => {
        throw new Error(err.error?.message || 'Business not found');
      })
    );
  }

  getAllOffers(query?: any): Observable<ApiResponse<AdminOffer[]>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key] !== null && query[key] !== undefined) {
          params = params.set(key, query[key]);
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/offers`, { params }).pipe(
      map(res => ({
        success: res && res.success !== undefined ? res.success : true,
        message: res && res.message ? res.message : 'Offers fetched successfully',
        data: res && res.success !== undefined ? res.data : res
      })),
      catchError(err => {
        throw new Error(err.error?.message || 'Failed to fetch offers');
      })
    );
  }

  getBusinessOffers(businessId: string): Observable<ApiResponse<AdminOffer[]>> {
    return this.http.get<any>(`${this.apiUrl}/offers/business/${businessId}`).pipe(
      map(res => ({
        success: res && res.success !== undefined ? res.success : true,
        message: res && res.message ? res.message : 'Business offers fetched successfully',
        data: res && res.success !== undefined ? res.data : res
      })),
      catchError(err => {
        throw new Error(err.error?.message || 'Failed to fetch business offers');
      })
    );
  }

  getBusinessVouchers(businessId: string): Observable<ApiResponse<AdminVoucher[]>> {
    const params = new HttpParams().set('business_id', businessId);
    return this.http.get<any>(`${this.apiUrl}/vouchers/history`, { params }).pipe(
      map(res => ({
        success: res && res.success !== undefined ? res.success : true,
        message: res && res.message ? res.message : 'Business vouchers fetched successfully',
        data: res && res.success !== undefined ? res.data : res
      })),
      catchError(err => {
        throw new Error(err.error?.message || 'Failed to fetch business vouchers');
      })
    );
  }

  updateOfferStatus(offerId: string, status: OfferStatus, reason?: string): Observable<ApiResponse<AdminOffer>> {
    if (status === OfferStatus.APPROVED) {
      return this.http.put<any>(`${this.apiUrl}/offers/approve`, { offer_id: offerId }).pipe(
        map(res => ({
          success: res && res.success !== undefined ? res.success : true,
          message: res && res.message ? res.message : 'Offer approved successfully',
          data: res && res.success !== undefined ? res.data : res
        })),
        catchError(err => {
          throw new Error(err.error?.message || 'Failed to approve offer');
        })
      );
    } else if (status === OfferStatus.REJECTED) {
      return this.http.put<any>(`${this.apiUrl}/offers/reject`, { offer_id: offerId, reason }).pipe(
        map(res => ({
          success: res && res.success !== undefined ? res.success : true,
          message: res && res.message ? res.message : 'Offer rejected successfully',
          data: res && res.success !== undefined ? res.data : res
        })),
        catchError(err => {
          throw new Error(err.error?.message || 'Failed to reject offer');
        })
      );
    } else {
      throw new Error(`Unsupported status update from admin panel: ${status}`);
    }
  }
}
