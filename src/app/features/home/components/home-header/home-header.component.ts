import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { callOutline, mailOutline, globeOutline, shareSocialOutline, personOutline } from 'ionicons/icons';
import { CustomerProfileDTO, WalletDTO } from '../../models/home.model';
import { WalletService } from '../../../wallet/services/wallet.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { ShareService } from '../../../../core/platform/share.service';
import { UserInviteService } from '../../../auth/services/user-invite.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home-header',
  standalone: true,
  imports: [DecimalPipe, IonIcon, CachedImgDirective],
  templateUrl: './home-header.component.html',
  styleUrl: './home-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeaderComponent implements OnInit, OnDestroy {
  private readonly walletService = inject(WalletService);
  private readonly toastService = inject(ToastService);
  private readonly shareService = inject(ShareService);
  private readonly userInviteService = inject(UserInviteService);
  readonly bizzCoinsBalance = this.walletService.bizzCoinsBalance;

  readonly customer = input.required<CustomerProfileDTO>();
  readonly wallet = input.required<WalletDTO>();
  readonly unreadCount = input.required<number>();
  readonly isScrolled = input<boolean>(false);

  readonly walletClick = output<void>();
  readonly notificationClick = output<void>();
  readonly searchClick = output<void>();
  readonly locationClick = output<void>();
  readonly searchChange = output<string>();
  readonly searchSubmit = output<string>();

  // 3D Auto Infinite Flip state
  readonly isFlipped = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly showSupportDialog = signal<boolean>(false);
  private flipInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    addIcons({ callOutline, mailOutline, globeOutline, shareSocialOutline, personOutline });
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

  onSearchClick(): void {
    this.searchClick.emit();
  }

  onLocationClick(): void {
    this.locationClick.emit();
    this.showSupportInfo();
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

  async shareApp(): Promise<void> {
    try {
      const res = await firstValueFrom(this.userInviteService.getInviteDetails());
      if (res?.data) {
        await this.shareService.shareAppInvite({
          inviteCode: res.data.invite_code,
          appUrl: res.data.app_url,
          joinerRewardCoins: res.data.joiner_reward_coins,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to get invite details for share:', err);
      await this.shareService.shareAppInvite({
        inviteCode: 'BIZZDEAL',
        appUrl: 'https://play.google.com/store/apps/details?id=com.bizzdeal.app',
        joinerRewardCoins: 50,
      });
    }
  }
}
