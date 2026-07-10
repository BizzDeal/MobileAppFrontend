export type BusinessStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
export type OfferType = 'DISCOUNT' | 'FIXED_AMOUNT';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type OfferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'INACTIVE';
export type VoucherStatus = 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export interface BusinessCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // UI presentation fields
  icon?: string;
  color?: string;
}

export interface BusinessDTO {
  id: string;
  owner_id: string;
  category_id: string;
  name: string;
  description: string | null;
  website: string | null;
  gst_number: string | null;
  logo_id: string | null;
  status: BusinessStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // UI presentation fields joined in API response
  categoryName?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface OfferDTO {
  id: string;
  business_id: string;
  title: string;
  description: string;
  offer_type: OfferType;
  discount_value: number | null;
  discount_type: DiscountType | null;
  start_date: string;
  end_date: string;
  image_id: string | null;
  status: OfferStatus;
  approved_by_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // UI presentation fields joined in API response
  businessName?: string;
  businessLogoUrl?: string;
  imageUrl?: string;
}

export interface VoucherDTO {
  id: string;
  voucher_code: string;
  offer_id: string;
  customer_id: string;
  business_id: string;
  status: VoucherStatus;
  issued_at: string;
  redeemed_at: string | null;
  expires_at: string;
  redeemed_by_id: string | null;
  created_at: string;
  updated_at: string;
  // UI presentation fields joined in API response
  offerTitle?: string;
  businessName?: string;
  discountText?: string;
}

export interface WalletDTO {
  id: string;
  user_id: string;
  balance: number;
  total_savings: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfileDTO {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

export interface CustomerHomeFeedDTO {
  customer: CustomerProfileDTO;
  wallet: WalletDTO;
  unreadNotificationsCount: number;
  categories: BusinessCategoryDTO[];
  featuredBusinesses: BusinessDTO[];
  megaDeals: OfferDTO[];
  trendingOffers: OfferDTO[];
  recommendedBusinesses: BusinessDTO[];
  myActiveVouchers: VoucherDTO[];
}
