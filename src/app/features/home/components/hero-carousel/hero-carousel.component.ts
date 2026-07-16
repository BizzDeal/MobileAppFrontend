import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, flameOutline, starOutline, timeOutline } from 'ionicons/icons';
import { BusinessDTO, OfferDTO } from '../../models/home.model';
import { CachedBgImgDirective } from '../../../../shared/directives/cached-bg-img.directive';

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [IonIcon, CachedBgImgDirective],
  templateUrl: './hero-carousel.component.html',
  styleUrl: './hero-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCarouselComponent {
  readonly title = input<string>('Spotlight & Mega Deals');
  readonly icon = input<string>('flame-outline');
  readonly featuredBusinesses = input<BusinessDTO[]>([]);
  readonly megaDeals = input<OfferDTO[]>([]);

  readonly dealClick = output<OfferDTO>();
  readonly businessClick = output<BusinessDTO>();

  readonly activeSlide = signal<number>(0);

  constructor() {
    addIcons({ flameOutline, starOutline, arrowForwardOutline, timeOutline });
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const slideWidth = target.clientWidth;
    const scrollLeft = target.scrollLeft;
    const index = Math.round(scrollLeft / slideWidth);
    if (this.activeSlide() !== index) {
      this.activeSlide.set(index);
    }
  }
}
