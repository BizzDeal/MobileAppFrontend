import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { callOutline, mailOutline, globeOutline } from 'ionicons/icons';
import { CustomerProfileDTO, WalletDTO } from '../../models/home.model';
import { WalletService } from '../../../wallet/services/wallet.service';

@Component({
  selector: 'app-home-header',
  standalone: true,
  imports: [DecimalPipe, IonIcon],
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
  readonly isScrolled = input<boolean>(false);

  readonly walletClick = output<void>();
  readonly notificationClick = output<void>();
  readonly searchChange = output<string>();
  readonly searchSubmit = output<string>();

  // 3D Auto Infinite Flip state
  readonly isFlipped = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly showSupportDialog = signal<boolean>(false);
  private flipInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    addIcons({ callOutline, mailOutline, globeOutline });
  }

  ngOnInit(): void {
    this.startAutoFlip();
  }

  ngOnDestroy(): void {
    if (this.flipInterval) {
      clearInterval(this.flipInterval);
    }
  }

  private startAutoFlip(): void {
    this.flipInterval = setInterval(() => {
      this.isFlipped.update(val => !val);
    }, 3500);
  }

  getFirstName(fullName?: string): string {
    if (!fullName) return 'User';
    return fullName.trim().split(' ')[0];
  }

  onWalletClick(): void {
    this.walletClick.emit();
  }

  onNotificationClick(): void {
    this.notificationClick.emit();
  }

  onSearchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value || '';
    this.searchQuery.set(value);
    this.searchChange.emit(value);
  }

  onClearSearch(): void {
    this.searchQuery.set('');
    this.searchChange.emit('');
  }

  onSearchSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.searchSubmit.emit(this.searchQuery());
  }

  showSupportInfo() {
    this.showSupportDialog.set(true);
  }

  closeSupportInfo() {
    this.showSupportDialog.set(false);
  }
}
