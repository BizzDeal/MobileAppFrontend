export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export interface AuthUser {
  id: string;
  full_name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  state_id?: string | null;
  district_id?: string | null;
  role: UserRole;
  status: UserStatus;
  approved_by_id?: string | null;
  approved_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  profile_pic_url?: string | null;
  payment_receipt_url?: string | null;
  business_id?: string | null;
  business_name?: string | null;
  business_description?: string | null;
  website?: string | null;
  gst_number?: string | null;
  business_logo_url?: string | null;
  category_id?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface UserExistDto {
  email: string;
}

export interface LoginDto {
  email: string;
  pin: string;
}

export interface ForgotPinDto {
  email: string;
}

export interface ResetPinDto {
  email: string;
  otp: string;
  newPin: string;
}

export interface RegisterCustomerDto {
  full_name: string;
  phone: string;
  pin: string;
  whatsapp: string;
  email: string;
  address: string;
  otp: string;
}

export interface RegisterMemberDto {
  full_name: string;
  phone: string;
  pin: string;
  whatsapp: string;
  email?: string;
  address: string;
  state_id: string;
  district_id: string;
  business_name: string;
  category_id: string;
  business_description?: string;
  website?: string;
  gst_number?: string;
  otp: string;
}
