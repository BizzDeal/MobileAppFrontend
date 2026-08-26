import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { extractFriendlyErrorMessage } from '../../../core/utils/error.utils';
import {
  BizzdealVideo,
  CreateVideoRequest,
  MemberVideo,
  UpdateVideoRequest,
  VideoFilterType,
} from '../models/video.model';

@Injectable({
  providedIn: 'root',
})
export class VideosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _videos = signal<BizzdealVideo[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedFilter = signal<VideoFilterType>('ALL');
  private readonly _searchQuery = signal<string>('');

  readonly videos = this._videos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedFilter = this._selectedFilter.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();

  /** Hero Spotlight video for Flipkart-style top banner */
  readonly spotlightVideo = computed(() => {
    const list = this._videos();
    if (list.length === 0) return null;
    return list.find((v) => v.is_trending) || list[0];
  });

  /** Horizontal Shorts / Quick Reels */
  readonly trendingShorts = computed(() => {
    const list = this._videos();
    return list.filter((v) => v.video_type === 'SHORT_PORTRAIT' || v.is_trending).slice(0, 10);
  });

  /** Filtered video feed for discovery grid */
  readonly filteredVideos = computed(() => {
    const list = this._videos();
    const filter = this._selectedFilter();
    const query = this._searchQuery().trim().toLowerCase();

    return list.filter((item) => {
      // Filter by category / type
      if (filter === 'TRENDING' && !item.is_trending && item.video_type !== 'SHORT_PORTRAIT') return false;
      if (filter === 'BUSINESS' && item.source_type !== 'BUSINESS' && item.category !== 'BUSINESS_TOUR') return false;
      if (filter === 'OFFER' && item.source_type !== 'OFFER' && item.category !== 'OFFER') return false;

      // Filter by search query
      if (query) {
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesBiz = item.business_name.toLowerCase().includes(query);
        const matchesCategory = item.category_name ? item.category_name.toLowerCase().includes(query) : false;
        const matchesDesc = item.description ? item.description.toLowerCase().includes(query) : false;
        const matchesTag = item.tags ? item.tags.some((t) => t.toLowerCase().includes(query)) : false;
        return matchesTitle || matchesBiz || matchesCategory || matchesDesc || matchesTag;
      }

      return true;
    });
  });

  loadVideos(): Observable<BizzdealVideo[]> {
    this._loading.set(true);
    this._error.set(null);

    return forkJoin({
      memberVideos: this.http.get<any>(`${this.apiUrl}/videos?limit=50`).pipe(catchError(() => of({ items: [] }))),
      featuredBusinesses: this.http.get<any>(`${this.apiUrl}/businesses/featured`).pipe(catchError(() => of([]))),
      topBusinesses: this.http.get<any>(`${this.apiUrl}/businesses/top`).pipe(catchError(() => of([]))),
      allBusinesses: this.http.get<any>(`${this.apiUrl}/businesses?limit=50`).pipe(catchError(() => of([]))),
      megaDeals: this.http.get<any>(`${this.apiUrl}/offers/mega`).pipe(catchError(() => of([]))),
      trendingOffers: this.http.get<any>(`${this.apiUrl}/offers/trending`).pipe(catchError(() => of([]))),
      allOffers: this.http.get<any>(`${this.apiUrl}/offers?limit=50`).pipe(catchError(() => of([]))),
    }).pipe(
      map((res) => {
        const videoList: BizzdealVideo[] = [];
        const seenVideoUrls = new Set<string>();

        const extractYtThumbnail = (url: string): string | null => {
          const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
          const match = url.match(ytRegExp);
          if (match && match[2].length === 11) {
            return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
          }
          return null;
        };

        const viewCounts = ['14.2k', '8.5k', '21.9k', '5.1k', '18.4k', '9.7k', '12.0k', '3.8k'];
        const durations = ['1:30', '0:45', '2:15', '1:10', '0:55', '3:05', '1:40', '2:20'];
        let index = 0;

        // 1. Process Member Submitted Videos (Highest Priority & Freshness)
        const rawMemberVideos = Array.isArray(res.memberVideos)
          ? res.memberVideos
          : res.memberVideos?.items || res.memberVideos?.data || [];

        for (const mv of rawMemberVideos) {
          const videoUrl = mv.video_url;
          if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== '') {
            const key = `mv_${mv.id}`;
            if (!seenVideoUrls.has(key)) {
              seenVideoUrls.add(key);
              const ytThumb = extractYtThumbnail(videoUrl);
              const isPortrait = mv.video_type === 'SHORT_PORTRAIT';

              videoList.push({
                id: `mv_${mv.id}`,
                title: mv.title,
                description: mv.description || null,
                tags: mv.tags || [],
                video_url: videoUrl,
                thumbnail_url: mv.thumbnail_url || ytThumb || null,
                source_type: 'MEMBER_VIDEO',
                source_id: mv.id,
                business_name: mv.business?.name || 'BizzDeal Member Showcase',
                business_logo_url: mv.business?.logo_url || null,
                category_name: mv.category ? mv.category.replace(/_/g, ' ') : 'Showcase',
                discount_badge: mv.cta_title || (isPortrait ? '⚡ Short' : '🎬 Showcase'),
                video_type: mv.video_type || (isPortrait ? 'SHORT_PORTRAIT' : 'LANDSCAPE'),
                category: mv.category || 'GENERAL',
                cta_title: mv.cta_title || null,
                cta_url: mv.cta_url || null,
                views_count: mv.views_count ? `${mv.views_count}` : viewCounts[index % viewCounts.length],
                duration_text: isPortrait ? '0:45' : durations[index % durations.length],
                likes_count: mv.likes_count ?? 12,
                is_trending: isPortrait || index % 2 === 0,
                user_id: mv.user_id,
                created_at: mv.created_at || new Date().toISOString(),
              });
              index++;
            }
          }
        }

        // 2. Process Businesses
        const rawBusinesses = [
          ...(Array.isArray(res.featuredBusinesses) ? res.featuredBusinesses : res.featuredBusinesses?.data || []),
          ...(Array.isArray(res.topBusinesses) ? res.topBusinesses : res.topBusinesses?.data || []),
          ...(Array.isArray(res.allBusinesses) ? res.allBusinesses : res.allBusinesses?.data || res.allBusinesses?.items || []),
        ];

        for (const b of rawBusinesses) {
          const videoUrl = b.video_url || b.videoUrl;
          if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== '') {
            const key = `biz_${b.id}_${videoUrl}`;
            if (!seenVideoUrls.has(key)) {
              seenVideoUrls.add(key);
              const ytThumb = extractYtThumbnail(videoUrl);
              const banner = b.bannerUrl || b.banner_url || b.logoUrl || b.business_logo_url;
              const views = viewCounts[index % viewCounts.length];
              const dur = durations[index % durations.length];

              videoList.push({
                id: `biz_${b.id}`,
                title: `${b.name} Store Tour & Highlights`,
                description: b.description || `Explore trending products and exclusive member services at ${b.name}.`,
                video_url: videoUrl,
                thumbnail_url: ytThumb || banner || null,
                source_type: 'BUSINESS',
                source_id: b.id,
                business_name: b.name,
                business_logo_url: b.logoUrl || b.business_logo_url || null,
                category_name: b.categoryName || b.category?.name || 'Store Highlights',
                discount_badge: b.is_featured ? '⭐ Featured Store' : '🏬 Store Tour',
                video_type: 'LANDSCAPE',
                category: 'BUSINESS_TOUR',
                views_count: views,
                duration_text: dur,
                likes_count: 150 + (index * 27) % 800,
                is_trending: index % 2 === 0,
                created_at: b.created_at || new Date().toISOString(),
              });
              index++;
            }
          }
        }

        // 3. Process Offers & Deals
        const rawOffers = [
          ...(Array.isArray(res.megaDeals) ? res.megaDeals : res.megaDeals?.data || []),
          ...(Array.isArray(res.trendingOffers) ? res.trendingOffers : res.trendingOffers?.data || []),
          ...(Array.isArray(res.allOffers) ? res.allOffers : res.allOffers?.data || res.allOffers?.items || []),
        ];

        for (const o of rawOffers) {
          const videoUrl = o.video_url || o.videoUrl;
          if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== '') {
            const key = `offer_${o.id}_${videoUrl}`;
            if (!seenVideoUrls.has(key)) {
              seenVideoUrls.add(key);
              const ytThumb = extractYtThumbnail(videoUrl);
              const img = o.imageUrl || o.image_url;
              let discountBadge = '🔥 Special Offer';
              if (o.offer_type === 'CASHBACK') {
                discountBadge = `₹${o.discount_value || 0} Cashback`;
              } else if (o.discount_type === 'PERCENTAGE') {
                discountBadge = `${o.discount_value || 0}% OFF`;
              } else if (o.discount_value) {
                discountBadge = `₹${o.discount_value} OFF`;
              }

              const views = viewCounts[index % viewCounts.length];
              const dur = durations[index % durations.length];

              videoList.push({
                id: `offer_${o.id}`,
                title: o.title,
                description: o.description || `Special promotional offer at ${o.businessName || o.business?.name || 'BizzDeal'}.`,
                video_url: videoUrl,
                thumbnail_url: ytThumb || img || null,
                source_type: 'OFFER',
                source_id: o.id,
                business_name: o.businessName || o.business?.name || 'Partner Store',
                business_logo_url: o.businessLogoUrl || o.business?.business_logo_url || null,
                category_name: o.categoryName || o.business?.category?.name || 'Deals & Savings',
                discount_badge: discountBadge,
                video_type: 'LANDSCAPE',
                category: 'OFFER',
                views_count: views,
                duration_text: dur,
                likes_count: 220 + (index * 33) % 950,
                is_trending: true,
                created_at: o.created_at || new Date().toISOString(),
              });
              index++;
            }
          }
        }

        return videoList;
      }),
      tap({
        next: (items) => {
          this._videos.set(items);
          this._loading.set(false);
        },
        error: (err) => {
          const friendlyMessage = extractFriendlyErrorMessage(err, 'Unable to load Bizzdeal Videos. Please pull down to refresh.');
          this._error.set(friendlyMessage);
          this._loading.set(false);
        },
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  setFilter(filter: VideoFilterType): void {
    this._selectedFilter.set(filter);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  // Member CRUD Methods
  getMyVideos(): Observable<MemberVideo[]> {
    return this.http.get<MemberVideo[]>(`${this.apiUrl}/videos/my`).pipe(
      map((res: any) => (Array.isArray(res) ? res : res?.data || [])),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  getVideoById(id: string): Observable<MemberVideo> {
    return this.http.get<MemberVideo>(`${this.apiUrl}/videos/${id}`).pipe(
      map((res: any) => res?.data || res),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  createVideo(dto: CreateVideoRequest): Observable<MemberVideo> {
    return this.http.post<MemberVideo>(`${this.apiUrl}/videos`, dto).pipe(
      map((res: any) => res?.data || res),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  updateVideo(id: string, dto: UpdateVideoRequest): Observable<MemberVideo> {
    return this.http.put<MemberVideo>(`${this.apiUrl}/videos/${id}`, dto).pipe(
      map((res: any) => res?.data || res),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  deleteVideo(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/videos/${id}`).pipe(
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }
}
