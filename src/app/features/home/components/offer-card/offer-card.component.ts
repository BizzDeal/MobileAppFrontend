import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, sparklesOutline, locationOutline, pricetagOutline } from 'ionicons/icons';
import { OfferDTO } from '../../models/home.model';

@Component({
  selector: 'app-offer-card',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './offer-card.component.html',
  styleUrl: './offer-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferCardComponent {
  readonly offer = input.required<OfferDTO>();

  readonly claimClick = output<OfferDTO>();
  readonly cardClick = output<OfferDTO>();

  constructor() {
    addIcons({ timeOutline, sparklesOutline, locationOutline, pricetagOutline });
  }

  getDaysLeft(endDateStr: string): string {
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  }
}
