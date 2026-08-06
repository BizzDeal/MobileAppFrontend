import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, locationOutline, starOutline, ribbonOutline } from 'ionicons/icons';
import { BusinessDTO } from '../../models/home.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [IonIcon, CachedImgDirective],
  templateUrl: './business-card.component.html',
  styleUrl: './business-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessCardComponent {
  readonly business = input.required<BusinessDTO>();
  readonly businessClick = output<BusinessDTO>();
  readonly logoLoadError = signal(false);

  constructor() {
    addIcons({ starOutline, locationOutline, arrowForwardOutline, ribbonOutline });
  }

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }
}
