import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  signal,
  computed,
  OnInit,
  AfterViewInit,
  OnDestroy,
  effect,
  NgZone,
} from '@angular/core';
import { OfferDTO, BusinessDTO } from '../../models/home.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-infinite-scrolling-cards',
  standalone: true,
  imports: [CachedImgDirective],
  templateUrl: './infinite-scrolling-cards.component.html',
  styleUrl: './infinite-scrolling-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfiniteScrollingCardsComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly iconType = input<string>('flame');
  readonly items = input<any[]>([]);
  readonly cardType = input<'deal' | 'business'>('deal');
  readonly isMemberView = input<boolean>(false);
  readonly autoScroll = input<boolean>(false);
  readonly autoScrollInterval = input<number>(3000);

  readonly itemClick = output<any>();
  readonly claimClick = output<OfferDTO>();
  readonly businessClick = output<BusinessDTO>();

  // --- TranslateX carousel state (business cards) ---
  readonly currentIndex = signal<number>(0);
  readonly trackTransform = signal<string>('translateX(0px)');
  readonly trackTransition = signal<string>('transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)');

  readonly displayItems = computed(() => {
    const list = this.items();
    if (!list || list.length <= 1) return list || [];
    if (this.cardType() === 'business') {
      return [...list, ...list, ...list];
    }
    return list;
  });

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('viewportEl') viewportEl?: ElementRef<HTMLDivElement>;
  @ViewChild('trackEl') trackEl?: ElementRef<HTMLDivElement>;

  private autoScrollTimer: ReturnType<typeof setInterval> | null = null;
  private isInteracting = false;

  // Business carousel measurements
  readonly cardWidth = signal<number>(0);
  private gap = 16;

  // Touch/swipe state
  private touchStartX = 0;
  private touchStartY = 0;
  private touchDeltaX = 0;
  private isSwiping = false;

  constructor(private ngZone: NgZone) {
    effect(() => {
      const len = this.items().length;
      if (this.cardType() === 'business' && len > 1) {
        this.currentIndex.set(len);
        setTimeout(() => this.jumpToIndex(len), 0);
      } else {
        this.currentIndex.set(0);
      }
    });
  }

  ngOnInit(): void {
    if (this.autoScroll()) {
      this.startAutoScroll();
    }
  }

  ngAfterViewInit(): void {
    if (this.cardType() === 'business' && this.items().length > 1) {
      setTimeout(() => {
        this.measureCard();
        this.jumpToIndex(this.items().length);
      }, 150);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  // --- Business carousel: translateX methods ---

  private measureCard(): void {
    const viewport = this.viewportEl?.nativeElement;
    if (!viewport) return;
    this.cardWidth.set(viewport.clientWidth - 32);
  }

  private getOffset(index: number): number {
    const viewportWidth = this.viewportEl?.nativeElement?.clientWidth || 0;
    const w = this.cardWidth();
    const step = w + this.gap;
    const trackPaddingLeft = 16;
    const cardLeft = trackPaddingLeft + index * step;
    return -(cardLeft - (viewportWidth - w) / 2);
  }

  private slideToIndex(index: number): void {
    this.measureCard();
    this.currentIndex.set(index);
    const offset = this.getOffset(index);
    this.trackTransition.set('transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)');
    this.trackTransform.set(`translateX(${offset}px)`);
  }

  private jumpToIndex(index: number): void {
    this.measureCard();
    this.currentIndex.set(index);
    const offset = this.getOffset(index);
    this.trackTransition.set('none');
    this.trackTransform.set(`translateX(${offset}px)`);
  }

  onTransitionEnd(): void {
    const originalLen = this.items().length;
    if (originalLen <= 1) return;
    const idx = this.currentIndex();
    if (idx >= 2 * originalLen) {
      this.jumpToIndex(idx - originalLen);
    } else if (idx < originalLen) {
      this.jumpToIndex(idx + originalLen);
    }
  }

  // --- Touch/swipe for business carousel ---

  onBizTouchStart(event: TouchEvent): void {
    this.isInteracting = true;
    this.isSwiping = false;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchDeltaX = 0;
    this.trackTransition.set('none');
  }

  onBizTouchMove(event: TouchEvent): void {
    const dx = event.touches[0].clientX - this.touchStartX;
    const dy = event.touches[0].clientY - this.touchStartY;
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

  onBizTouchEnd(): void {
    this.isInteracting = false;
    if (this.isSwiping) {
      const threshold = this.cardWidth() * 0.25;
      if (this.touchDeltaX < -threshold) {
        this.slideToIndex(this.currentIndex() + 1);
      } else if (this.touchDeltaX > threshold) {
        this.slideToIndex(this.currentIndex() - 1);
      } else {
        this.slideToIndex(this.currentIndex());
      }
    }
    this.isSwiping = false;
    this.touchDeltaX = 0;
  }

  // --- Scroll methods ---

  startAutoScroll(): void {
    this.stopAutoScroll();
    this.ngZone.runOutsideAngular(() => {
      this.autoScrollTimer = setInterval(() => {
        if (!this.isInteracting && this.items().length > 1) {
          this.ngZone.run(() => this.scrollNext());
        }
      }, this.autoScrollInterval());
    });
  }

  stopAutoScroll(): void {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }

  scrollPrev(): void {
    if (this.cardType() === 'business') {
      this.slideToIndex(this.currentIndex() - 1);
    } else {
      const container = this.scrollContainer?.nativeElement;
      if (!container) return;
      const card = container.querySelector('.flipkart-card') as HTMLElement;
      const scrollAmount = card ? card.offsetWidth + 12 : 240;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }

  scrollNext(): void {
    if (this.cardType() === 'business') {
      this.slideToIndex(this.currentIndex() + 1);
    } else {
      const container = this.scrollContainer?.nativeElement;
      if (!container) return;
      const card = container.querySelector('.flipkart-card') as HTMLElement;
      const scrollAmount = card ? card.offsetWidth + 12 : 240;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  onMouseEnter(): void {
    this.isInteracting = true;
  }

  onMouseLeave(): void {
    this.isInteracting = false;
  }

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }

  getDaysLeft(endDateStr: string): string {
    if (!endDateStr) return 'Limited';
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  }
}

