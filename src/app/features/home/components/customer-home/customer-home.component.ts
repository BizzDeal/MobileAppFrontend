import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { BusinessDTO, CustomerProfileDTO, WalletDTO } from '../../models/home.model';
import { HomeHeaderComponent } from '../home-header/home-header.component';
import { WalletViewComponent } from '../../../wallet/components/wallet-view/wallet-view.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, ribbonOutline, star, storefrontOutline } from 'ionicons/icons';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [
    HomeHeaderComponent,
    WalletViewComponent,
    CachedImgDirective,
    IonIcon,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerHomeComponent {
  @Input({ required: true }) customer!: CustomerProfileDTO;
  @Input({ required: true }) wallet!: WalletDTO;
  @Input({ required: true }) unreadNotificationsCount!: number;
  @Input() isScrolled = false;
  @Input() featuredBusinesses: BusinessDTO[] = [];
  @Input() topBusinesses: BusinessDTO[] = [];

  @Output() walletClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() redeemClick = new EventEmitter<void>();
  @Output() businessClick = new EventEmitter<BusinessDTO>();

  constructor() {
    addIcons({ star, arrowForwardOutline, storefrontOutline, ribbonOutline });
  }

  get loopFeaturedBusinesses(): BusinessDTO[] {
    const list = this.featuredBusinesses;
    if (!list || list.length === 0) return [];
    if (list.length === 1) return [list[0], list[0]];
    return list;
  }

  get firstName(): string {
    const raw = this.customer?.name || '';
    if (!raw || raw.trim().toLowerCase() === 'customer' || raw.trim().toLowerCase() === 'unknown') {
      return 'Raja';
    }
    return raw.trim().split(' ')[0];
  }

  onRedeem(): void {
    this.redeemClick.emit();
  }

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }
}
