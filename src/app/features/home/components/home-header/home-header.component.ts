import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon, IonSearchbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  optionsOutline,
  searchOutline,
  walletOutline
} from 'ionicons/icons';
import { CustomerProfileDTO, WalletDTO } from '../../models/home.model';

@Component({
  selector: 'app-home-header',
  standalone: true,
  imports: [IonIcon, IonSearchbar, DecimalPipe],
  templateUrl: './home-header.component.html',
  styleUrl: './home-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeaderComponent {
  readonly customer = input.required<CustomerProfileDTO>();
  readonly wallet = input.required<WalletDTO>();
  readonly unreadCount = input.required<number>();

  readonly walletClick = output<void>();
  readonly notificationClick = output<void>();
  readonly searchChange = output<string>();
  readonly searchSubmit = output<string>();

  constructor() {
    addIcons({
      walletOutline,
      notificationsOutline,
      searchOutline,
      optionsOutline
    });
  }

  getFirstName(fullName?: string): string {
    if (!fullName) return 'User';
    const first = fullName.trim().split(' ')[0];
    return first.length > 10 ? `${first.substring(0, 15)}...` : first;
  }

  onWalletClick(): void {
    this.walletClick.emit();
  }

  onNotificationClick(): void {
    this.notificationClick.emit();
  }

  onSearchInput(event: Event): void {
    const customEvent = event as CustomEvent;
    const value = (customEvent.detail?.value || '') as string;
    this.searchChange.emit(value);
  }

  onSearchSubmit(event: Event): void {
    const searchbar = event.target as HTMLIonSearchbarElement;
    this.searchSubmit.emit(searchbar.value || '');
  }
}
