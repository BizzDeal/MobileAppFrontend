import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, locationOutline, starOutline } from 'ionicons/icons';
import { BusinessDTO } from '../../models/home.model';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './business-card.component.html',
  styleUrl: './business-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessCardComponent {
  readonly business = input.required<BusinessDTO>();

  readonly businessClick = output<BusinessDTO>();

  constructor() {
    addIcons({ starOutline, locationOutline, arrowForwardOutline });
  }
}
