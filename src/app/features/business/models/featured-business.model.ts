export type FeaturedRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface FeaturedBusinessRequestDTO {
  id: string;
  business_id: string;
  category_id: string;
  title: string;
  description: string;
  banner_id?: string | null;
  banner?: {
    id: string;
    file_url: string;
    original_name?: string;
  } | null;
  start_date: string;
  end_date: string;
  status: FeaturedRequestStatus;
  rejection_reason?: string | null;
  approved_by_id?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  business?: {
    id: string;
    name: string;
    status?: string;
    category_id?: string;
    category?: {
      id: string;
      name: string;
    };
    owner?: {
      id: string;
      phone?: string;
      profile?: {
        full_name?: string;
      };
    };
  };
  category?: {
    id: string;
    name: string;
    slug?: string;
  };
}

export interface CategoryLiveStatusDTO {
  is_live: boolean;
  live_request?: {
    id: string;
    business_id: string;
    business_name: string;
    title: string;
    start_date: string;
    end_date: string;
  } | null;
}
