import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  flame,
  pricetagOutline,
  storefrontOutline,
  cubeOutline,
  starOutline,
  play,
  playCircleOutline,
  playCircle,
  heart,
  heartOutline,
  eyeOutline,
  checkmarkCircle,
  ticketOutline,
  openOutline,
  alertCircleOutline,
  refreshOutline,
  sparkles,
  videocamOutline,
  searchOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { BizzdealVideo, VideoFilterType } from '../../models/video.model';
import { VideosService } from '../../services/videos.service';
import { VideoPlayerModalComponent } from '../../components/video-player-modal/video-player-modal.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';

interface CategoryMeta {
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  filterType: VideoFilterType;
  isPortrait: boolean;
}

const CATEGORY_META_MAP: Record<string, CategoryMeta> = {
  shorts: {
    title: 'Shorts & Reels',
    subtitle: 'Quick 60-second video highlights',
    icon: 'flame',
    accentColor: '#f43f5e',
    filterType: 'SHORTS',
    isPortrait: true,
  },
  offer: {
    title: 'Deals & Live Discounts',
    subtitle: 'Claim discount vouchers & cashback rewards',
    icon: 'pricetag-outline',
    accentColor: '#e11d48',
    filterType: 'OFFER',
    isPortrait: false,
  },
  business: {
    title: 'Store & Showroom Tours',
    subtitle: 'Explore partner shops, clinics & gyms',
    icon: 'storefront-outline',
    accentColor: '#1565c0',
    filterType: 'BUSINESS',
    isPortrait: false,
  },
  demo: {
    title: 'Product Demos & Unboxings',
    subtitle: 'See products in live action & testing',
    icon: 'cube-outline',
    accentColor: '#8b5cf6',
    filterType: 'DEMO',
    isPortrait: true,
  },
  testimonial: {
    title: 'Customer Reviews & Stories',
    subtitle: 'Real member reviews & verified savings',
    icon: 'star-outline',
    accentColor: '#f59e0b',
    filterType: 'TESTIMONIAL',
    isPortrait: true,
  },
};

@Component({
  selector: 'app-video-category-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonContent,
    VideoPlayerModalComponent,
    CachedImgDirective,
  ],
  templateUrl: './video-category-list.page.html',
  styleUrl: './video-category-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCategoryListPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly videosService = inject(VideosService);

  readonly categoryKey = signal<string>('shorts');
  readonly searchQuery = signal<string>('');
  readonly selectedVideo = signal<BizzdealVideo | null>(null);
  readonly isPlayerOpen = signal<boolean>(false);

  readonly allVideos = this.videosService.videos;
  readonly loading = this.videosService.loading;
  readonly error = this.videosService.error;

  readonly getAvatarColor = getAvatarColor;
  readonly getInitials = getInitials;

  readonly categoryMeta = computed<CategoryMeta>(() => {
    const key = this.categoryKey().toLowerCase();
    return (
      CATEGORY_META_MAP[key] || {
        title: 'Video Collection',
        subtitle: 'Explore curated partner videos',
        icon: 'play-circle',
        accentColor: '#1565c0',
        filterType: 'ALL',
        isPortrait: false,
      }
    );
  });

  readonly categoryVideos = computed<BizzdealVideo[]>(() => {
    const list = this.allVideos();
    const meta = this.categoryMeta();
    const query = this.searchQuery().trim().toLowerCase();

    const filtered = list.filter((item) => {
      // Filter by category type
      if (meta.filterType === 'SHORTS') {
        if (item.video_type !== 'SHORT_PORTRAIT') return false;
      } else if (meta.filterType === 'OFFER') {
        if (item.category !== 'OFFER' && item.source_type !== 'OFFER') return false;
      } else if (meta.filterType === 'BUSINESS') {
        if (item.category !== 'BUSINESS_TOUR' && item.source_type !== 'BUSINESS') return false;
      } else if (meta.filterType === 'DEMO') {
        if (item.category !== 'PRODUCT_DEMO') return false;
      } else if (meta.filterType === 'TESTIMONIAL') {
        if (item.category !== 'TESTIMONIAL') return false;
      }

      // Filter by search query within category
      if (query) {
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesBiz = item.business_name.toLowerCase().includes(query);
        const matchesCat = item.category_name?.toLowerCase().includes(query) || false;
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query)) || false;
        return matchesTitle || matchesBiz || matchesCat || matchesTags;
      }

      return true;
    });

    return filtered;
  });

  constructor() {
    addIcons({
      arrowBackOutline,
      flame,
      pricetagOutline,
      storefrontOutline,
      cubeOutline,
      starOutline,
      play,
      playCircleOutline,
      playCircle,
      heart,
      heartOutline,
      eyeOutline,
      checkmarkCircle,
      ticketOutline,
      openOutline,
      alertCircleOutline,
      refreshOutline,
      sparkles,
      videocamOutline,
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const key = params.get('categoryKey') || 'shorts';
      this.categoryKey.set(key);
    });

    if (this.allVideos().length === 0) {
      this.videosService.loadVideos().subscribe();
    }
  }

  onGoBack(): void {
    this.location.back();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value || '');
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onSearchChange(event: Event): void {
    const customEvent = event as CustomEvent;
    const value = (customEvent.detail?.value || '') as string;
    this.searchQuery.set(value);
  }

  onVideoCardClick(video: BizzdealVideo): void {
    this.videosService.incrementView(video.source_id).subscribe();
    this.selectedVideo.set(video);
    this.isPlayerOpen.set(true);
  }

  onLikeVideo(event: Event, video: BizzdealVideo): void {
    event.stopPropagation();
    this.videosService.likeVideo(video.source_id).subscribe();
  }

  onClosePlayer(): void {
    this.isPlayerOpen.set(false);
    this.selectedVideo.set(null);
  }

  onViewSource(video: BizzdealVideo): void {
    this.onClosePlayer();
    if (video.source_type === 'OFFER') {
      this.router.navigate(['/home'], { queryParams: { tab: 'vouchers', offerId: video.source_id } });
    } else {
      this.router.navigate(['/home'], { queryParams: { tab: 'home', businessId: video.source_id } });
    }
  }

  retryLoad(): void {
    this.videosService.loadVideos().subscribe();
  }
}
