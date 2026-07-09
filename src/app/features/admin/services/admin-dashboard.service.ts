import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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
  FLAT_DISCOUNT = 'FLAT_DISCOUNT',
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  BOGO = 'BOGO',
  FREE_GIFT = 'FREE_GIFT',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

// Interfaces matching BE Models
export interface User {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
}

export interface Business {
  id: string;
  name: string;
  owner_id: string;
}

export interface Offer {
  id: string;
  title: string;
  business: Business;
  offer_type: OfferType;
  discount_value: number;
  discount_type: DiscountType;
  status: OfferStatus;
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
  constructor() {}

  getPendingMembers(): Observable<User[]> {
    // Fake data mimicking API
    const mockMembers: User[] = [
      {
        id: '1',
        full_name: 'John Doe',
        phone: '+919876543210',
        role: UserRole.MEMBER,
        status: UserStatus.PENDING,
        created_at: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: '2',
        full_name: 'Jane Smith',
        phone: '+919876543211',
        role: UserRole.MEMBER,
        status: UserStatus.PENDING,
        created_at: new Date(Date.now() - 86400000),
      }
    ];
    return of(mockMembers).pipe(delay(800)); // Simulate network latency
  }

  getPendingOffers(): Observable<Offer[]> {
    const mockOffers: Offer[] = [
      {
        id: '101',
        title: '50% off on all pizzas',
        offer_type: OfferType.PERCENTAGE_DISCOUNT,
        discount_value: 50,
        discount_type: DiscountType.PERCENTAGE,
        status: OfferStatus.PENDING,
        created_at: new Date(),
        business: {
          id: 'b1',
          name: 'Domino\'s Pizza',
          owner_id: 'u1'
        }
      },
      {
        id: '102',
        title: 'Flat $10 off on orders above $50',
        offer_type: OfferType.FLAT_DISCOUNT,
        discount_value: 10,
        discount_type: DiscountType.FIXED_AMOUNT,
        status: OfferStatus.PENDING,
        created_at: new Date(Date.now() - 3600000 * 5),
        business: {
          id: 'b2',
          name: 'Subway',
          owner_id: 'u2'
        }
      }
    ];
    return of(mockOffers).pipe(delay(1000));
  }

  getPlatformAnalytics(): Observable<AdminAnalyticsDto> {
    const mockAnalytics: AdminAnalyticsDto = {
      totalMembers: 1250,
      activeMembers: 1100,
      totalCustomers: 50000,
      totalVouchers: 85420,
      revenue: 45000.50,
      revenueHistory: {
        dates: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        amounts: [12000, 15000, 14000, 22000, 31000, 28000, 45000]
      }
    };
    return of(mockAnalytics).pipe(delay(600));
  }

  approveMember(id: string): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(500));
  }

  rejectMember(id: string): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(500));
  }

  approveOffer(id: string): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(500));
  }

  rejectOffer(id: string): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(500));
  }
}
