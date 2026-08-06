import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
export class OfferCardComponent {
  readonly offer = input.required<OfferDTO>();
  readonly hideClaimButton = input<boolean>(false);

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

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }
}
