import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  peopleOutline,
  chatbubbleEllipsesOutline,
  syncOutline
} from 'ionicons/icons';

import { AppBackButtonService } from '../../../../core/platform/app-back-button.service';

@Component({
  selector: 'app-earn-bizz-coins',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonIcon
  ],
  templateUrl: './earn-bizz-coins.page.html',
  styleUrl: './earn-bizz-coins.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EarnBizzCoinsPage {
  private readonly location = inject(Location);
  private readonly backButtonService = inject(AppBackButtonService);

  constructor() {
    addIcons({
      arrowBackOutline,
      peopleOutline,
      chatbubbleEllipsesOutline,
      syncOutline
    });
  }

  goBack(): void {
    this.backButtonService.back('/wallet/points');
  }
}
