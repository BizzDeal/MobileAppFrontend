import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BusinessDTO, CustomerHomeFeedDTO, OfferDTO } from '../../models/home.model';
import { HomeHeaderComponent } from '../home-header/home-header.component';
import { HeroCarouselComponent } from '../hero-carousel/hero-carousel.component';
import { CategoryChipsComponent } from '../category-chips/category-chips.component';
import { BusinessCardComponent } from '../business-card/business-card.component';
import { QuickActionsComponent } from '../quick-actions/quick-actions.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sparklesOutline } from 'ionicons/icons';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [
    HomeHeaderComponent,
    HeroCarouselComponent,
    CategoryChipsComponent,
    BusinessCardComponent,
    QuickActionsComponent,
    IonIcon
  ],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerHomeComponent {
  @Input({ required: true }) feed!: CustomerHomeFeedDTO;
  @Input({ required: true }) unreadNotificationsCount!: number;
  @Input({ required: true }) selectedCategory!: string;
  @Input({ required: true }) filteredTrending!: OfferDTO[];
  @Input({ required: true }) filteredTopBiz!: BusinessDTO[];
  @Input({ required: true }) filteredFeaturedBiz!: BusinessDTO[];
  @Input({ required: true }) filteredMegaDeals!: OfferDTO[];

  @Output() walletClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() dealClick = new EventEmitter<OfferDTO>();
  @Output() businessClick = new EventEmitter<BusinessDTO>();
  @Output() categorySelect = new EventEmitter<string>();
  @Output() vouchersClick = new EventEmitter<void>();
  @Output() claimOffer = new EventEmitter<OfferDTO>();

  constructor() {
    addIcons({ sparklesOutline });
  }
}
