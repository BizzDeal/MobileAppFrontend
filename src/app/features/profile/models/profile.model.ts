export interface ProfileDTO {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  role: 'ADMIN' | 'MEMBER' | 'CUSTOMER';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  profile_pic_url: string | null;
  // Business fields
  category_id?: string;
  business_name?: string | null;
  business_description?: string | null;
  website?: string | null;
  gst_number?: string | null;
  business_logo_url?: string | null;
  created_at: string;
  updated_at: string;
}
