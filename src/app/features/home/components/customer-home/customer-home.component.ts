import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BusinessDTO, CustomerHomeFeedDTO, OfferDTO } from '../../models/home.model';
import { HomeHeaderComponent } from '../home-header/home-header.component';
import { HeroCarouselComponent } from '../hero-carousel/hero-carousel.component';
import { CategoryChipsComponent } from '../category-chips/category-chips.component';
import { BusinessCardComponent } from '../business-card/business-card.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sparklesOutline, ticketOutline, timeOutline, chevronForwardOutline } from 'ionicons/icons';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [
    HomeHeaderComponent,
    HeroCarouselComponent,
    CategoryChipsComponent,
    BusinessCardComponent,
    IonIcon,
    DatePipe,
    NgClass
  ],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerHomeComponent {
  @Input({ required: true }) feed!: CustomerHomeFeedDTO;
  @Input({ required: true }) unreadNotificationsCount!: number;
  @Input({ required: true }) selectedCategory!: string;
  @Input({ required: true }) filteredPercentageDeals!: OfferDTO[];
  @Input({ required: true }) filteredTopBiz!: BusinessDTO[];
  @Input({ required: true }) filteredFeaturedBiz!: BusinessDTO[];
  @Input({ required: true }) filteredFlatOffers!: OfferDTO[];
  @Input({ required: true }) filteredCashbackOffers!: OfferDTO[];
  @Input({ required: true }) activeVouchersCount!: number;
  @Input() activeVouchers: any[] = []; // Using any to avoid importing VoucherDTO if not needed, or better import it

  @Output() walletClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() dealClick = new EventEmitter<OfferDTO>();
  @Output() businessClick = new EventEmitter<BusinessDTO>();
  @Output() categorySelect = new EventEmitter<string>();
  @Output() vouchersClick = new EventEmitter<void>();
  @Output() voucherClick = new EventEmitter<any>();
  @Output() claimOffer = new EventEmitter<OfferDTO>();

  constructor() {
    addIcons({ sparklesOutline, ticketOutline, timeOutline, chevronForwardOutline });
  }

  getVoucherTypeClass(v: any): string {
    const offerType = v.offer_type || v.offer?.offer_type;
    const discountType = v.discount_type || v.offer?.discount_type;
    const text = (v.discountText || '').toLowerCase();

    if (offerType === 'CASHBACK' || text.includes('cashback')) {
      return 'type-cashback';
    }
    if (discountType === 'PERCENTAGE' || text.includes('%')) {
      return 'type-percentage';
    }
    if (discountType === 'FIXED_AMOUNT' || discountType === 'FIXED' || text.includes('₹') || text.includes('off')) {
      return 'type-fixed';
    }

    return 'type-fixed'; // default fallback for colored items
  }
}
