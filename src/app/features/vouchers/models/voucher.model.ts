export type VoucherStatus = 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export interface CustomerVoucher {
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
  offerTitle: string;
  businessName: string;
  discountText: string;
  discount_type?: 'PERCENTAGE' | 'FIXED' | 'FIXED_AMOUNT';
  discount_value?: number;
  imageUrl?: string;
}
