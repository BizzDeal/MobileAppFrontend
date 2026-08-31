import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CustomerProfileDTO, WalletDTO } from '../../models/home.model';
import { HomeHeaderComponent } from '../home-header/home-header.component';
import { WalletViewComponent } from '../../../wallet/components/wallet-view/wallet-view.component';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [
    HomeHeaderComponent,
    WalletViewComponent,
  ],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerHomeComponent {
  @Input({ required: true }) customer!: CustomerProfileDTO;
  @Input({ required: true }) wallet!: WalletDTO;
  @Input({ required: true }) unreadNotificationsCount!: number;
  @Input() isScrolled = false;

  @Output() walletClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() redeemClick = new EventEmitter<void>();

  onRedeem(): void {
    this.redeemClick.emit();
  }
}
