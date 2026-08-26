export type VideoSourceType = 'BUSINESS' | 'OFFER' | 'MEMBER_VIDEO';

export type VideoType = 'SHORT_PORTRAIT' | 'LANDSCAPE' | 'SQUARE';

export type VideoCategory =
  | 'OFFER'
  | 'BUSINESS_TOUR'
  | 'PRODUCT_DEMO'
  | 'TESTIMONIAL'
  | 'GENERAL';

export interface BizzdealVideo {
  id: string;
  title: string;
  description: string | null;
  tags?: string[];
  video_url: string;
  thumbnail_url: string | null;
  source_type: VideoSourceType;
  source_id: string;
  business_name: string;
  business_logo_url: string | null;
  category_name: string | null;
  discount_badge: string | null;
  video_type?: VideoType;
  category?: VideoCategory;
  cta_title?: string | null;
  cta_url?: string | null;
  views_count?: string | number;
  duration_text?: string;
  likes_count?: number;
  is_trending?: boolean;
  user_id?: string;
  created_at: string;
}

export type VideoFilterType = 'ALL' | 'TRENDING' | 'BUSINESS' | 'OFFER';

export interface MemberVideo {
  id: string;
  user_id: string;
  business_id: string | null;
  offer_id: string | null;
  title: string;
  description: string | null;
  tags: string[];
  video_url: string;
  thumbnail_url: string | null;
  video_type: VideoType;
  category: VideoCategory;
  cta_title: string | null;
  cta_url: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  business?: {
    id: string;
    name: string;
    logo_url?: string | null;
    category?: { name: string } | null;
  } | null;
  offer?: {
    id: string;
    title: string;
    offer_type: string;
    discount_value?: number | null;
  } | null;
}

export interface CreateVideoRequest {
  title: string;
  description?: string | null;
  tags?: string[];
  video_url: string;
  thumbnail_url?: string | null;
  video_type?: VideoType;
  category?: VideoCategory;
  business_id?: string | null;
  offer_id?: string | null;
  cta_title?: string | null;
  cta_url?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export type UpdateVideoRequest = Partial<CreateVideoRequest>;
