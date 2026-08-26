import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  filmOutline,
  flame,
  flameOutline,
  play,
  playCircle,
  playCircleOutline,
  pricetagOutline,
  refreshOutline,
  searchOutline,
  sparkles,
  sparklesOutline,
  storefrontOutline,
  videocamOutline,
  checkmarkCircle,
  eyeOutline,
  addCircleOutline,
  closeCircleOutline,
  ribbonOutline,
  flashOutline,
  starOutline,
  cubeOutline,
  heartOutline,
  heart,
  arrowForwardOutline,
} from 'ionicons/icons';
import { BizzdealVideo, VideoFilterType, VideoCategorySection } from '../../models/video.model';
import { VideosService } from '../../services/videos.service';
import { VideoCardComponent } from '../video-card/video-card.component';
import { VideoPlayerModalComponent } from '../video-player-modal/video-player-modal.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';
import { computed } from '@angular/core';

@Component({
  selector: 'app-videos-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonSearchbar,
    VideoCardComponent,
    VideoPlayerModalComponent,
    CachedImgDirective,
  ],
  templateUrl: './videos-view.component.html',
  styleUrl: './videos-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideosViewComponent implements OnInit {
  private readonly videosService = inject(VideosService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly isMember = computed(() => {
    const role = this.authSession.currentUser()?.role;
    return role === 'MEMBER' || role === 'ADMIN';
  });

  readonly videos = this.videosService.videos;
  readonly spotlightVideo = this.videosService.spotlightVideo;
  readonly trendingShorts = this.videosService.trendingShorts;
  readonly categorySections = this.videosService.categorySections;
  readonly popularTags = this.videosService.popularTags;
  readonly filteredVideos = this.videosService.filteredVideos;
  readonly loading = this.videosService.loading;
  readonly error = this.videosService.error;
  readonly selectedFilter = this.videosService.selectedFilter;
  readonly selectedTag = this.videosService.selectedTag;
  readonly searchQuery = this.videosService.searchQuery;

  readonly selectedVideo = signal<BizzdealVideo | null>(null);
  readonly isPlayerOpen = signal<boolean>(false);

  readonly businessClick = output<string>();
  readonly dealClick = output<string>();

  readonly getAvatarColor = getAvatarColor;
  readonly getInitials = getInitials;

  constructor() {
    addIcons({
      videocamOutline,
      play,
      playCircleOutline,
      playCircle,
      storefrontOutline,
      pricetagOutline,
      searchOutline,
      sparklesOutline,
      sparkles,
      alertCircleOutline,
      refreshOutline,
      filmOutline,
      flame,
      flameOutline,
      checkmarkCircle,
      eyeOutline,
      addCircleOutline,
      closeCircleOutline,
      ribbonOutline,
      flashOutline,
      starOutline,
      cubeOutline,
      heartOutline,
      heart,
      arrowForwardOutline,
    });
  }

  onNavigatePostVideo(): void {
    this.router.navigate(['/videos/new']);
  }

  ngOnInit(): void {
    if (this.videos().length === 0) {
      this.videosService.loadVideos().subscribe({
        error: (err) => console.error('Error loading Bizzdeal Videos:', err),
      });
    }
  }

  onRefresh(event: any): void {
    this.videosService.loadVideos().subscribe({
      next: () => event?.target?.complete(),
      error: () => event?.target?.complete(),
    });
  }

  onSelectFilter(filter: VideoFilterType): void {
    if (filter === 'ALL') {
      this.videosService.clearAllFilters();
    } else {
      this.onOpenCategory(filter);
    }
  }

  onSeeAllCategory(filterType: VideoFilterType): void {
    this.onOpenCategory(filterType);
  }

  onOpenCategory(filterType: VideoFilterType): void {
    if (filterType === 'ALL') {
      this.videosService.clearAllFilters();
      return;
    }
    this.router.navigate(['/videos/category', filterType.toLowerCase()]);
  }

  onSelectTag(tag: string | null): void {
    this.videosService.setSelectedTag(tag);
  }

  onClearAllFilters(): void {
    this.videosService.clearAllFilters();
  }

  onSearchChange(event: Event): void {
    const customEvent = event as CustomEvent;
    const value = (customEvent.detail?.value || '') as string;
    this.videosService.setSearchQuery(value);
  }

  onLikeVideo(video: BizzdealVideo): void {
    this.videosService.likeVideo(video.source_id).subscribe();
  }

  onVideoCardClick(video: BizzdealVideo): void {
    this.videosService.incrementView(video.source_id).subscribe();
    this.selectedVideo.set(video);
    this.isPlayerOpen.set(true);
  }

  onClosePlayer(): void {
    this.isPlayerOpen.set(false);
    this.selectedVideo.set(null);
  }

  onViewSource(video: BizzdealVideo): void {
    this.onClosePlayer();
    if (video.source_type === 'OFFER') {
      this.dealClick.emit(video.source_id);
    } else {
      this.businessClick.emit(video.source_id);
    }
  }

  retryLoad(): void {
    this.videosService.loadVideos().subscribe();
  }
}
