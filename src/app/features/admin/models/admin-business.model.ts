export enum BusinessStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface AdminBusiness {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  gst_number: string | null;
  is_featured: boolean;
  status: BusinessStatus;
  category_id: string;
  category_name?: string;
  owner_id: string;
  owner_name?: string;
  owner_phone?: string;
  phone?: string;
  whatsapp?: string;
  owner_email?: string;
  created_at: Date;
  updated_at: Date;
  logo_url: string | null;
  logoUrl?: string | null;
  initials?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export enum OfferType {
  DISCOUNT = 'DISCOUNT',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

export enum OfferStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
}

export interface AdminOffer {
  id: string;
  business_id: string;
  business_name?: string;
  title: string;
  description: string;
  offer_type: OfferType;
  discount_value?: number | null;
  discount_type?: DiscountType | null;
  start_date: Date | string;
  end_date: Date | string;
  status: OfferStatus;
  rejection_reason?: string | null;
  offer_image?: string | null;
  created_at?: Date | string;
}

export enum VoucherStatus {
  ISSUED = 'ISSUED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface AdminVoucher {
  id: string;
  offer_id: string;
  business_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_avatar?: string;
  voucher_code: string;
  status: VoucherStatus;
  issued_at: Date | string;
  redeemed_at?: Date | string | null;
  bill_amount?: number | null;
  discount_applied?: number | null;
}

