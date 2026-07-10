import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  AdminMember,
  AdminCustomer,
  ApiResponse,
  UserRole,
  UserStatus,
} from '../models/admin-user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  // Mock Data
  private mockMembers: AdminMember[] = [
    {
      id: 'm1',
      full_name: 'John Doe',
      phone: '+919876543210',
      whatsapp: '+919876543210',
      email: 'john.doe@example.com',
      address: '123 Business Rd, Tech City, 500081',
      role: UserRole.MEMBER,
      status: UserStatus.PENDING,
      approved_by_id: null,
      approved_at: null,
      last_login_at: new Date(Date.now() - 1000000),
      created_at: new Date(Date.now() - 5000000),
      updated_at: new Date(),
      profile_pic_url: 'https://i.pravatar.cc/150?u=m1',
      payment_receipt_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80',
      business_id: 'b1',
      business_name: 'Doe Enterprises',
      business_description: 'Leading provider of tech solutions and gadgets.',
      website: 'https://doe-enterprises.com',
      gst_number: '29ABCDE1234F1Z5',
      business_logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&q=80'
    },
    {
      id: 'm2',
      full_name: 'Jane Smith',
      phone: '+919876543211',
      whatsapp: null,
      email: 'jane.smith@example.com',
      address: '456 Market St, Commerce City, 500082',
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      approved_by_id: 'admin1',
      approved_at: new Date(Date.now() - 86400000),
      last_login_at: new Date(Date.now() - 500000),
      created_at: new Date(Date.now() - 10000000),
      updated_at: new Date(),
      profile_pic_url: 'https://i.pravatar.cc/150?u=m2',
      payment_receipt_url: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=400&q=80',
      business_id: 'b2',
      business_name: 'Smith Consulting',
      business_description: 'Expert financial and business consulting services.',
      website: 'https://smith-consulting.net',
      gst_number: '27ABCDE5678F1Z6',
      business_logo_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&q=80'
    },
    {
      id: 'm3',
      full_name: 'Bob Wilson',
      phone: '+919876543212',
      whatsapp: '+919876543212',
      email: null,
      address: null,
      role: UserRole.MEMBER,
      status: UserStatus.SUSPENDED,
      approved_by_id: 'admin1',
      approved_at: new Date(Date.now() - 172800000),
      last_login_at: new Date(Date.now() - 86400000),
      created_at: new Date(Date.now() - 20000000),
      updated_at: new Date(),
      profile_pic_url: 'https://i.pravatar.cc/150?u=m3',
      payment_receipt_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&q=80',
      business_id: 'b3',
      business_name: 'Wilson Logistics',
      business_description: 'Reliable freight and transport solutions nationwide.',
      website: null,
      gst_number: '33ABCDE9012F1Z7',
      business_logo_url: null
    }
  ];

  private mockCustomers: AdminCustomer[] = [
    {
      id: 'c1',
      full_name: 'Alice Johnson',
      phone: '+919000000001',
      whatsapp: null,
      email: 'alice.j@example.com',
      address: '789 Residential Ln',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      approved_by_id: null,
      approved_at: null,
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      profile_pic_url: 'https://i.pravatar.cc/150?u=c1',
    },
    {
      id: 'c2',
      full_name: 'Charlie Brown',
      phone: '+919000000002',
      whatsapp: '+919000000002',
      email: null,
      address: '101 Customer St',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      approved_by_id: null,
      approved_at: null,
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      profile_pic_url: 'https://i.pravatar.cc/150?u=c2',
    },
  ];

  constructor() {}

  getMembers(): Observable<ApiResponse<AdminMember[]>> {
    return of({
      success: true,
      message: 'Members fetched successfully',
      data: [...this.mockMembers],
    }).pipe(delay(500));
  }

  getCustomers(): Observable<ApiResponse<AdminCustomer[]>> {
    return of({
      success: true,
      message: 'Customers fetched successfully',
      data: [...this.mockCustomers],
    }).pipe(delay(500));
  }

  approveMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    const member = this.mockMembers.find(m => m.id === memberId);
    if (member) member.status = UserStatus.ACTIVE;
    return of({
      success: true,
      message: 'Member approved successfully',
      data: { memberId, status: UserStatus.ACTIVE },
    }).pipe(delay(500));
  }

  rejectMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    const member = this.mockMembers.find(m => m.id === memberId);
    if (member) member.status = UserStatus.REJECTED;
    return of({
      success: true,
      message: 'Member rejected successfully',
      data: { memberId, status: UserStatus.REJECTED },
    }).pipe(delay(500));
  }

  suspendMember(memberId: string): Observable<ApiResponse<{ memberId: string; status: UserStatus }>> {
    const member = this.mockMembers.find(m => m.id === memberId);
    if (member) member.status = UserStatus.SUSPENDED;
    return of({
      success: true,
      message: 'Member suspended successfully',
      data: { memberId, status: UserStatus.SUSPENDED },
    }).pipe(delay(500));
  }

  deleteMember(memberId: string): Observable<ApiResponse<null>> {
    this.mockMembers = this.mockMembers.filter(m => m.id !== memberId);
    return of({
      success: true,
      message: 'Member deleted successfully',
      data: null,
    }).pipe(delay(500));
  }

  getUserById(id: string): Observable<ApiResponse<AdminMember | AdminCustomer | null>> {
    const member = this.mockMembers.find((m) => m.id === id);
    if (member) {
      return of({
        success: true,
        message: 'User fetched successfully',
        data: member,
      }).pipe(delay(500));
    }
    const customer = this.mockCustomers.find((c) => c.id === id);
    if (customer) {
      return of({
        success: true,
        message: 'User fetched successfully',
        data: customer,
      }).pipe(delay(500));
    }
    return of({
      success: false,
      message: 'User not found',
      data: null,
    }).pipe(delay(500));
  }
}

