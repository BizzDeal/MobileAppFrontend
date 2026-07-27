export type ReferralType = 'INSIDE' | 'OUTSIDE';

export interface CreateReferralSlipDto {
  to_member_id: string;
  referral_type: ReferralType;
  told_to_call: boolean;
  card_given: boolean;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  contact_address?: string;
  comments?: string;
  rating?: number;
}

export interface ReferralDTO {
  id: string;
  referrer_id: string;
  to_member_id: string;
  referral_type: ReferralType;
  told_to_call: boolean;
  card_given: boolean;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  contact_address: string | null;
  comments: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  referrer: {
    id: string;
    full_name: string;
    phone: string;
    profile_pic_url: string | null;
    businessProfile?: {
      business_name: string;
    } | null;
  };
  to_member: {
    id: string;
    full_name: string;
    phone: string;
    profile_pic_url: string | null;
    businessProfile?: {
      business_name: string;
    } | null;
  };
}

export interface ReferralQueryDto {
  page?: number;
  limit?: number;
  type?: 'GIVEN' | 'RECEIVED';
}

export interface MemberBusinessDTO {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  profile: {
    full_name: string;
    whatsapp: string;
    address: string;
    district_id: string;
    state_id: string;
  };
  businessProfile?: {
    business_name: string;
    description: string;
    category_id: string;
  };
}

export interface AdminReferralQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  referral_type?: ReferralType;
}

export interface AdminReferralSummary {
  totalCount: number;
  insideCount: number;
  outsideCount: number;
}

export interface AdminReferralResponse {
  success: boolean;
  data: ReferralDTO[];
  summary: AdminReferralSummary;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

