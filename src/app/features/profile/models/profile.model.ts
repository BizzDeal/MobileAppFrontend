export interface ProfileDTO {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  state_id?: string | null;
  state_name?: string | null;
  district_id: string;
  district_name?: string | null;
  pincode?: string | null;
  role: 'ADMIN' | 'MEMBER' | 'CUSTOMER';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  profile_pic_url: string | null;
  // Business fields
  business_id?: string | null;
  category_id?: string;
  business_name?: string | null;
  business_description?: string | null;
  website?: string | null;
  gst_number?: string | null;
  business_logo_url?: string | null;
  business_address?: string | null;
  business_state_id?: string | null;
  business_district_id: string;
  business_pincode?: string | null;
  video_url?: string | null;
  is_featured?: boolean;
  primary_business_name?: string | null;
  primary_business_id?: string | null;
  primary_business_category_name?: string | null;
  primary_business_state_name?: string | null;
  primary_business_district_name?: string | null;
  
  // Profile Completion Tracking
  is_profile_completed?: boolean;
  completion_score?: number;
  grade?: 'PASS' | 'INCOMPLETE';
  missing_fields?: string[];
  completed_fields?: string[];

  // User Stats
  stats?: {
    stores_visited: number;
    customers_dealt: number;
    profit_gained: number;
  };

  created_at: string;
  updated_at: string;
}
