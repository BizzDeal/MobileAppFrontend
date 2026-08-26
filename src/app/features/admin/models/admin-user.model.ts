import { PaginationMeta } from '../../../shared/models/pagination.model';

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface AdminUser {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  state_id?: string | null;
  state_name?: string | null;
  district_id?: string | null;
  district_name?: string | null;
  pincode?: string | null;
  role: UserRole;
  status: UserStatus;
  approved_by_id: string | null;
  approved_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  profile_pic_url: string | null;
}

export interface AdminMember extends AdminUser {
  role: UserRole.MEMBER;
  payment_receipt_url: string | null;
  business_id: string | null;
  business_name?: string | null;
  business_description?: string | null;
  business_category_id?: string | null;
  business_category_name?: string | null;
  website?: string | null;
  gst_number?: string | null;
  business_logo_url?: string | null;
  business_address?: string | null;
  business_pincode?: string | null;
  is_featured?: boolean;
  is_top?: boolean;
  businessProfile?: {
    business_name: string;
    description: string;
    category_id: string;
  };
}

export interface AdminCustomer extends AdminUser {
  role: UserRole.CUSTOMER;
  primary_business_store?: {
    business_name: string;
    category_id?: string;
  } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}
