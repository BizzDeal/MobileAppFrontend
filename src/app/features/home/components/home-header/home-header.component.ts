import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { IonIcon, IonSearchbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  optionsOutline,
  searchOutline,
  walletOutline,
  sparklesOutline
} from 'ionicons/icons';
import { CustomerProfileDTO, WalletDTO } from '../../models/home.model';
import { WalletService } from '../../../wallet/services/wallet.service';

@Component({
  selector: 'app-home-header',
  standalone: true,
  imports: [IonIcon, IonSearchbar, DecimalPipe],
  templateUrl: './home-header.component.html',
  styleUrl: './home-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeaderComponent implements OnInit, OnDestroy {
  private readonly walletService = inject(WalletService);
  readonly bizzCoinsBalance = this.walletService.bizzCoinsBalance;

  readonly customer = input.required<CustomerProfileDTO>();
  readonly wallet = input.required<WalletDTO>();
  readonly unreadCount = input.required<number>();

  readonly walletClick = output<void>();
  readonly notificationClick = output<void>();
  readonly searchChange = output<string>();
  readonly searchSubmit = output<string>();

  // 3D Auto Infinite Flip state
  readonly isFlipped = signal<boolean>(false);
  private flipInterval: any = null;

  constructor() {
    addIcons({
      walletOutline,
      notificationsOutline,
      searchOutline,
      optionsOutline,
      sparklesOutline
    });
  }

  ngOnInit() {
    this.startAutoFlip();
  }

  ngOnDestroy() {
    if (this.flipInterval) {
      clearInterval(this.flipInterval);
    }
  }

  private startAutoFlip() {
    this.flipInterval = setInterval(() => {
      this.isFlipped.update(val => !val);
    }, 3500);
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
