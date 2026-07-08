import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ticketOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsComponent {
  readonly activeVouchersCount = input.required<number>();

  readonly vouchersClick = output<void>();

  constructor() {
    addIcons({ ticketOutline, chevronForwardOutline });
  }
}
