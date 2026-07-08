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
  created_at: string;
  updated_at: string;
}
