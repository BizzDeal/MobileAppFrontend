import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
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
export class InfiniteScrollingCardsComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly iconType = input<string>('flame');
  readonly items = input<any[]>([]);
  readonly cardType = input<'deal' | 'business'>('deal');
  readonly isMemberView = input<boolean>(false);

  readonly itemClick = output<any>();
  readonly claimClick = output<OfferDTO>();
  readonly businessClick = output<BusinessDTO>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  scrollPrev(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;
    const card = container.querySelector('.flipkart-card') as HTMLElement;
    const scrollAmount = card ? card.offsetWidth + 12 : 240;
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  scrollNext(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;
    const card = container.querySelector('.flipkart-card') as HTMLElement;
    const scrollAmount = card ? card.offsetWidth + 12 : 240;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  onMouseEnter(): void {}
  onMouseLeave(): void {}

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
