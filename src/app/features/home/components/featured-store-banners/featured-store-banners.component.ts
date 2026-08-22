import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  OnInit,
  OnDestroy,
  AfterViewInit,
  effect,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessDTO } from '../../models/home.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
@Component({
  selector: 'app-featured-store-banners',
  standalone: true,
  imports: [CommonModule, CachedImgDirective],
  templateUrl: './featured-store-banners.component.html',
  styleUrls: ['./featured-store-banners.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedStoreBannersComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly stores = input<BusinessDTO[]>([]);
  readonly storeClick = output<BusinessDTO>();

  /** Index into displayStores — always points at the middle segment */
  readonly currentIndex = signal<number>(0);

  /** 3x buffer: [A,B,C] → [A,B,C, A,B,C, A,B,C] */
  readonly displayStores = computed(() => {
    const list = this.stores();
    if (!list || list.length <= 1) return list || [];
    return [...list, ...list, ...list];
  });

  /** Which original-array dot is active */
  readonly activeSlide = computed(() => {
    const len = this.stores().length;
    if (!len) return 0;
    return ((this.currentIndex() % len) + len) % len;
  });

  /** CSS transform for the track */
  readonly trackTransform = signal<string>('translateX(0px)');
  readonly trackTransition = signal<string>('transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)');

  @ViewChild('trackEl') trackEl?: ElementRef<HTMLDivElement>;
  @ViewChild('viewportEl') viewportEl?: ElementRef<HTMLDivElement>;

  private autoScrollTimer: ReturnType<typeof setInterval> | null = null;
  private isInteracting = false;
  readonly cardWidth = signal<number>(0);
  private gap = 16;

  // Touch/swipe state
  private touchStartX = 0;
  private touchStartY = 0;
  private touchDeltaX = 0;
  private isSwiping = false;

  constructor(private ngZone: NgZone) {
    effect(() => {
      const len = this.stores().length;
      if (len > 1) {
        // Start in the middle segment
        this.currentIndex.set(len);
        setTimeout(() => this.jumpToIndex(len), 0);
      } else {
        this.currentIndex.set(0);
        setTimeout(() => this.jumpToIndex(0), 0);
      }
    });
  }

  ngOnInit(): void {
    this.startAutoScroll();
  }

  ngAfterViewInit(): void {
    this.measureCard();
    const len = this.stores().length;
    if (len > 1) {
      setTimeout(() => {
        this.measureCard();
        this.jumpToIndex(len);
      }, 150);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  /** Measure the width of a single card + gap */
  private measureCard(): void {
    const viewport = this.viewportEl?.nativeElement;
    if (!viewport) return;
    this.cardWidth.set(viewport.clientWidth - 32);
  }

  /** Move to index with smooth CSS animation */
  private slideToIndex(index: number): void {
    this.measureCard();
    this.currentIndex.set(index);
    const offset = this.getOffset(index);
    this.trackTransition.set('transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)');
    this.trackTransform.set(`translateX(${offset}px)`);
  }

  /** Jump to index instantly (no animation) — used for normalization */
  private jumpToIndex(index: number): void {
    this.measureCard();
    this.currentIndex.set(index);
    const offset = this.getOffset(index);
    this.trackTransition.set('none');
    this.trackTransform.set(`translateX(${offset}px)`);
  }

  /** Calculate translateX offset to center a given index */
  private getOffset(index: number): number {
    const viewportWidth = this.viewportEl?.nativeElement?.clientWidth || 0;
    const w = this.cardWidth();
    const step = w + this.gap;
    // The track has padding: 0 16px; so the first card starts at 16px
    const trackPaddingLeft = 16;
    const cardLeft = trackPaddingLeft + index * step;
    return -(cardLeft - (viewportWidth - w) / 2);
  }

  /** After smooth transition ends, silently normalize to middle segment */
  onTransitionEnd(): void {
    const originalLen = this.stores().length;
    if (originalLen <= 1) return;
    const idx = this.currentIndex();
    if (idx >= 2 * originalLen) {
      this.jumpToIndex(idx - originalLen);
    } else if (idx < originalLen) {
      this.jumpToIndex(idx + originalLen);
    }
  }

  scrollNext(): void {
    this.slideToIndex(this.currentIndex() + 1);
  }

  scrollPrev(): void {
    this.slideToIndex(this.currentIndex() - 1);
  }

  goToDot(dotIndex: number): void {
    const originalLen = this.stores().length;
    // Target the middle segment copy of this dot
    this.slideToIndex(originalLen + dotIndex);
  }

  startAutoScroll(): void {
    this.stopAutoScroll();
    this.ngZone.runOutsideAngular(() => {
      this.autoScrollTimer = setInterval(() => {
        if (!this.isInteracting && this.stores().length > 1) {
          this.ngZone.run(() => this.scrollNext());
        }
      }, 3000);
    });
  }

  stopAutoScroll(): void {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }

  // --- Touch / swipe handlers ---
  onTouchStart(event: TouchEvent): void {
    if (this.stores().length <= 1) return;
    this.isInteracting = true;
    this.isSwiping = false;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchDeltaX = 0;
    // Disable transition for drag feel
    this.trackTransition.set('none');
  }

  onTouchMove(event: TouchEvent): void {
    if (this.stores().length <= 1) return;
    const dx = event.touches[0].clientX - this.touchStartX;
    const dy = event.touches[0].clientY - this.touchStartY;
    // If horizontal intent, prevent vertical scroll
    if (!this.isSwiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      this.isSwiping = true;
    }
    if (this.isSwiping) {
      event.preventDefault();
      this.touchDeltaX = dx;
      const baseOffset = this.getOffset(this.currentIndex());
      this.trackTransform.set(`translateX(${baseOffset + dx}px)`);
    }
  }

  onTouchEnd(): void {
    if (this.stores().length <= 1) return;
    this.isInteracting = false;
    if (this.isSwiping) {
      const threshold = this.cardWidth() * 0.25;
      if (this.touchDeltaX < -threshold) {
        this.scrollNext();
      } else if (this.touchDeltaX > threshold) {
        this.scrollPrev();
      } else {
        // Snap back
        this.slideToIndex(this.currentIndex());
      }
    }
    this.isSwiping = false;
    this.touchDeltaX = 0;
  }

  onMouseEnter(): void {
    this.isInteracting = true;
  }

  onMouseLeave(): void {
    this.isInteracting = false;
  }

  isNativeVideo(url: string | undefined | null): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.includes('.mp4?') || lower.includes('.webm?');
  }

  getInitials(name: string): string {
    if (!name) return 'BD';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
    const colors = [
      'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
      'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7c3aed 100%)',
      'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
      'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #e11d48 100%)',
      'linear-gradient(135deg, #451a03 0%, #9a3412 50%, #ea580c 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
