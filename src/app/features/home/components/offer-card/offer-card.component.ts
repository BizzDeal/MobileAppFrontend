import { ChangeDetectionStrategy, Component, input, output, OnInit, OnDestroy, signal, inject, ElementRef } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationOutline, pricetagOutline, sparklesOutline, timeOutline } from 'ionicons/icons';
import { OfferDTO } from '../../models/home.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-offer-card',
  standalone: true,
  imports: [IonIcon, CachedImgDirective],
  templateUrl: './offer-card.component.html',
  styleUrl: './offer-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferCardComponent implements OnInit, OnDestroy {
  readonly offer = input.required<OfferDTO>();
  readonly hideClaimButton = input<boolean>(false);

  readonly claimClick = output<OfferDTO>();
  readonly cardClick = output<OfferDTO>();

  readonly isVisible = signal(false);
  private observer: IntersectionObserver | null = null;
  private readonly el = inject(ElementRef);

  constructor() {
    addIcons({ timeOutline, sparklesOutline, locationOutline, pricetagOutline });
  }

  ngOnInit() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isVisible.set(true);
          if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
          }
        }
      });
    }, { threshold: 0.1 });
    
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  getDaysLeft(endDateStr: string): string {
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  }

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }
}
