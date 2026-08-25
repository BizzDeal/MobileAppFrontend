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
  readonly hideHeader = input<boolean>(false);

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
    return [...list, ...list, ...list];
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
      this.currentIndex.set(0);
      setTimeout(() => this.jumpToIndex(0), 0);
    });
  }

  ngOnInit(): void {
    if (this.autoScroll()) {
      this.startAutoScroll();
    }
  }

  ngAfterViewInit(): void {
    if (this.items().length > 1) {
      setTimeout(() => {
        this.jumpToIndex(0);
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  // --- TranslateX carousel methods using exact DOM offsetLeft ---

  private getOffset(index: number): number {
    const track = this.trackEl?.nativeElement;
    if (!track) return 0;
    const cards = track.querySelectorAll<HTMLElement>('.flipkart-card');
    if (!cards || cards.length === 0 || !cards[index] || !cards[0]) {
      return 0;
    }
    const baseLeft = cards[0].offsetLeft;
    const targetLeft = cards[index].offsetLeft;
    return -(targetLeft - baseLeft);
  }

  private slideToIndex(index: number): void {
    this.currentIndex.set(index);
    const offset = this.getOffset(index);
    this.trackTransition.set('transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)');
    this.trackTransform.set(`translateX(${offset}px)`);
  }

  private jumpToIndex(index: number): void {
    this.currentIndex.set(index);
    const offset = this.getOffset(index);
    this.trackTransition.set('none');
    this.trackTransform.set(`translateX(${offset}px)`);
  }

  onTransitionEnd(): void {
    const originalLen = this.items().length;
    if (originalLen <= 1) return;
    const idx = this.currentIndex();
    if (idx >= originalLen) {
      this.jumpToIndex(idx % originalLen);
    } else if (idx < 0) {
      this.jumpToIndex(((idx % originalLen) + originalLen) % originalLen);
    }
  }

  // --- Touch/swipe for carousel ---

  onTouchStart(event: TouchEvent): void {
    const originalLen = this.items().length;
    if (originalLen <= 1) return;

    if (this.currentIndex() === 0) {
      this.jumpToIndex(originalLen);
    }

    this.isInteracting = true;
    this.isSwiping = false;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchDeltaX = 0;
    this.trackTransition.set('none');
  }

  onTouchMove(event: TouchEvent): void {
    if (this.items().length <= 1) return;
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

  onTouchEnd(): void {
    const originalLen = this.items().length;
    if (originalLen <= 1) return;
    this.isInteracting = false;
    if (this.isSwiping) {
      const track = this.trackEl?.nativeElement;
      const card = track?.querySelector<HTMLElement>('.flipkart-card');
      const cardW = card ? card.offsetWidth : 260;
      const threshold = cardW * 0.25;
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
    this.slideToIndex(this.currentIndex() - 1);
  }

  scrollNext(): void {
    this.slideToIndex(this.currentIndex() + 1);
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

