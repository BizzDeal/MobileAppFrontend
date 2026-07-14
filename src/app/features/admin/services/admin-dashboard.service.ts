import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Enums from BE
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum OfferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  INACTIVE = 'INACTIVE',
}

export enum OfferType {
  DISCOUNT = 'DISCOUNT',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export interface User {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  email?: string;
  whatsapp?: string;
  address?: string;
  profile_pic_url?: string;
  payment_receipt_url?: string;
  business_id?: string;
  business_name?: string;
  business_description?: string;
}

export interface Business {
  id: string;
  name: string;
  owner_id: string;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  business: Business;
  business_id?: string;
  business_name?: string;
  offer_type: OfferType;
  discount_value: number;
  discount_type: DiscountType;
  status: OfferStatus;
  start_date?: Date | string;
  end_date?: Date | string;
  rejection_reason?: string;
  created_at: Date;
}

export interface AdminAnalyticsDto {
  totalMembers: number;
  activeMembers: number;
  totalCustomers: number;
  totalVouchers: number;
  revenue: number;
  revenueHistory: {
    dates: string[];
    amounts: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  constructor() {}

  getPendingMembers(): Observable<User[]> {
    return this.http
      .get<{ success: boolean; data: User[] }>(`${this.apiUrl}/users/members?status=PENDING`)
      .pipe(map((res) => res?.data || []));
  }

  getPendingOffers(): Observable<Offer[]> {
    return this.http
      .get<Offer[] | { success: boolean; data: Offer[] }>(`${this.apiUrl}/offers?status=PENDING`)
      .pipe(map((res: any) => (Array.isArray(res) ? res : res?.data || [])));
  }

  getPlatformAnalytics(): Observable<AdminAnalyticsDto> {
    return this.http
      .get<AdminAnalyticsDto | { success: boolean; data: AdminAnalyticsDto }>(`${this.apiUrl}/analytics/overview`)
      .pipe(map((res: any) => res?.data || res));
  }

  approveMember(id: string): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/users/approve-member`, { memberId: id });
  }

  rejectMember(id: string): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/users/reject-member`, { memberId: id });
  }

  approveOffer(id: string): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/offers/approve`, { offer_id: id });
  }

  rejectOffer(id: string): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/offers/reject`, { offer_id: id });
  }
}
