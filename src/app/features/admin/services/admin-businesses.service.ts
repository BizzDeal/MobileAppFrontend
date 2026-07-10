import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AdminBusiness, BusinessStatus, ApiResponse, AdminOffer, AdminVoucher, OfferType, DiscountType, OfferStatus, VoucherStatus } from '../models/admin-business.model';

@Injectable({
  providedIn: 'root'
})
export class AdminBusinessesService {
  private mockBusinesses: AdminBusiness[] = [
    {
      id: 'b1',
      name: 'Doe Enterprises',
      description: 'Leading provider of tech solutions and gadgets.',
      website: 'https://doe-enterprises.com',
      gst_number: '29ABCDE1234F1Z5',
      is_featured: true,
      status: BusinessStatus.ACTIVE,
      category_id: 'cat1',
      category_name: 'Technology',
      owner_id: 'm1',
      owner_name: 'John Doe',
      owner_phone: '+919876543210',
      created_at: new Date(Date.now() - 5000000),
      updated_at: new Date(),
      logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&q=80'
    },
    {
      id: 'b2',
      name: 'Smith Consulting',
      description: 'Expert financial and business consulting services.',
      website: 'https://smith-consulting.net',
      gst_number: '27ABCDE5678F1Z6',
      is_featured: false,
      status: BusinessStatus.PENDING,
      category_id: 'cat2',
      category_name: 'Consulting',
      owner_id: 'm2',
      owner_name: 'Jane Smith',
      owner_phone: '+919876543211',
      created_at: new Date(Date.now() - 10000000),
      updated_at: new Date(),
      logo_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&q=80'
    },
    {
      id: 'b3',
      name: 'Wilson Logistics',
      description: 'Reliable freight and transport solutions nationwide.',
      website: null,
      gst_number: '33ABCDE9012F1Z7',
      is_featured: false,
      status: BusinessStatus.SUSPENDED,
      category_id: 'cat3',
      category_name: 'Logistics',
      owner_id: 'm3',
      owner_name: 'Bob Wilson',
      owner_phone: '+919876543212',
      created_at: new Date(Date.now() - 20000000),
      updated_at: new Date(),
      logo_url: null
    }
  ];

  private mockOffers: AdminOffer[] = [
    {
      id: 'o1',
      business_id: 'b1',
      title: '50% Off Electronics',
      description: 'Get half price on all electronics.',
      offer_type: OfferType.DISCOUNT,
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 50,
      start_date: new Date(),
      end_date: new Date(Date.now() + 864000000),
      status: OfferStatus.ACTIVE,
      created_at: new Date()
    },
    {
      id: 'o2',
      business_id: 'b1',
      title: '$200 Off Laptops',
      description: 'Flat $200 off on all laptops this weekend.',
      offer_type: OfferType.FIXED_AMOUNT,
      discount_type: DiscountType.FLAT,
      discount_value: 200,
      start_date: new Date(),
      end_date: new Date(Date.now() + 172800000),
      status: OfferStatus.PENDING,
      created_at: new Date()
    },
    {
      id: 'o3',
      business_id: 'b2',
      title: '$100 Off Consulting',
      description: 'Flat $100 off your first session.',
      offer_type: OfferType.DISCOUNT,
      discount_type: DiscountType.FLAT,
      discount_value: 100,
      start_date: new Date(Date.now() - 864000000),
      end_date: new Date(Date.now() - 86400000),
      status: OfferStatus.EXPIRED,
      created_at: new Date(Date.now() - 100000000)
    }
  ];

  private mockVouchers: AdminVoucher[] = [
    {
      id: 'v1',
      offer_id: 'o1',
      business_id: 'b1',
      customer_id: 'c1',
      customer_name: 'Alice Johnson',
      customer_phone: '+91 9876543210',
      customer_avatar: 'https://i.pravatar.cc/150?u=alice',
      voucher_code: 'ELEC50-ABC12',
      status: VoucherStatus.ISSUED,
      issued_at: new Date()
    },
    {
      id: 'v2',
      offer_id: 'o1',
      business_id: 'b1',
      customer_id: 'c2',
      customer_name: 'Bob Smith',
      customer_phone: '+91 9876543211',
      customer_avatar: 'https://i.pravatar.cc/150?u=bob',
      voucher_code: 'ELEC50-XYZ98',
      status: VoucherStatus.REDEEMED,
      issued_at: new Date(Date.now() - 86400000),
      redeemed_at: new Date(Date.now() - 3600000),
      bill_amount: 500,
      discount_applied: 250
    }
  ];

  constructor() {}

  getBusinesses(query?: any): Observable<ApiResponse<AdminBusiness[]>> {
    // In real implementation, pass query params to API
    return of({
      success: true,
      message: 'Businesses retrieved successfully',
      data: [...this.mockBusinesses]
    }).pipe(delay(500));
  }

  updateBusinessStatus(id: string, status: BusinessStatus): Observable<ApiResponse<AdminBusiness>> {
    const business = this.mockBusinesses.find(b => b.id === id);
    if (!business) {
      throw new Error('Business not found');
    }
    
    business.status = status;
    business.updated_at = new Date();
    
    return of({
      success: true,
      message: `Business status updated to ${status} successfully`,
      data: { ...business }
    }).pipe(delay(500));
  }

  featureBusiness(id: string, isFeatured: boolean): Observable<ApiResponse<AdminBusiness>> {
    const business = this.mockBusinesses.find(b => b.id === id);
    if (!business) {
      throw new Error('Business not found');
    }
    
    business.is_featured = isFeatured;
    business.updated_at = new Date();
    
    return of({
      success: true,
      message: `Business ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: { ...business }
    }).pipe(delay(500));
  }

  getBusinessById(id: string): Observable<ApiResponse<AdminBusiness>> {
    const business = this.mockBusinesses.find(b => b.id === id);
    if (!business) {
      throw new Error('Business not found');
    }
    return of({
      success: true,
      message: 'Business retrieved successfully',
      data: { ...business }
    }).pipe(delay(500));
  }

  getAllOffers(query?: any): Observable<ApiResponse<AdminOffer[]>> {
    const offersWithBusiness = this.mockOffers.map(offer => {
      const business = this.mockBusinesses.find(b => b.id === offer.business_id);
      return {
        ...offer,
        business_name: business ? business.name : 'Unknown Business'
      };
    });
    return of({
      success: true,
      message: 'All offers retrieved successfully',
      data: offersWithBusiness
    }).pipe(delay(500));
  }

  getBusinessOffers(businessId: string): Observable<ApiResponse<AdminOffer[]>> {
    const offers = this.mockOffers.filter(o => o.business_id === businessId);
    return of({
      success: true,
      message: 'Offers retrieved successfully',
      data: [...offers]
    }).pipe(delay(500));
  }

  getBusinessVouchers(businessId: string): Observable<ApiResponse<AdminVoucher[]>> {
    const vouchers = this.mockVouchers.filter(v => v.business_id === businessId);
    return of({
      success: true,
      message: 'Vouchers retrieved successfully',
      data: [...vouchers]
    }).pipe(delay(500));
  }

  updateOfferStatus(offerId: string, status: OfferStatus, reason?: string): Observable<ApiResponse<AdminOffer>> {
    const offer = this.mockOffers.find(o => o.id === offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }
    
    offer.status = status;
    if (reason) {
      offer.rejection_reason = reason;
    }
    
    return of({
      success: true,
      message: `Offer status updated to ${status}`,
      data: { ...offer }
    }).pipe(delay(500));
  }
}
