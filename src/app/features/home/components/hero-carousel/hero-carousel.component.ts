import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flameOutline, starOutline, arrowForwardOutline, timeOutline } from 'ionicons/icons';
import { BusinessDTO, OfferDTO } from '../../models/home.model';

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './hero-carousel.component.html',
  styleUrl: './hero-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCarouselComponent {
  readonly featuredBusinesses = input.required<BusinessDTO[]>();
  readonly megaDeals = input.required<OfferDTO[]>();

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
