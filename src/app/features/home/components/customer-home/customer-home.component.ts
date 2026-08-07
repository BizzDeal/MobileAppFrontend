import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { BusinessDTO, CustomerHomeFeedDTO, OfferDTO, CustomerProfileDTO, WalletDTO } from '../../models/home.model';
import { HomeHeaderComponent } from '../home-header/home-header.component';
import { CategoryChipsComponent } from '../category-chips/category-chips.component';
import { InfiniteScrollingCardsComponent } from '../infinite-scrolling-cards/infinite-scrolling-cards.component';
import { FeaturedStoreBannersComponent } from '../featured-store-banners/featured-store-banners.component';
import { OfferCardComponent } from '../offer-card/offer-card.component';
import { IntersectionObserverDirective } from '../../../../shared/directives/intersection-observer.directive';
import { HomeService } from '../../services/home.service';
import { PlatformSettingsService } from '../../../../core/services/platform-settings.service';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [
    HomeHeaderComponent,
    CategoryChipsComponent,
    InfiniteScrollingCardsComponent,
    FeaturedStoreBannersComponent,
    OfferCardComponent,
    IntersectionObserverDirective,
  ],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerHomeComponent implements OnInit, OnChanges {
  private readonly homeService = inject(HomeService);
  private readonly platformSettingsService = inject(PlatformSettingsService);

  @Input({ required: true }) feed!: CustomerHomeFeedDTO;
  @Input({ required: true }) customer!: CustomerProfileDTO;
  @Input({ required: true }) wallet!: WalletDTO;
  @Input({ required: true }) unreadNotificationsCount!: number;
  @Input({ required: true }) selectedCategory!: string;
  @Input({ required: true }) filteredPercentageDeals!: OfferDTO[];
  @Input({ required: true }) filteredTopBiz!: BusinessDTO[];
  @Input({ required: true }) filteredFeaturedBiz!: BusinessDTO[];
  @Input({ required: true }) filteredFlatOffers!: OfferDTO[];
  @Input({ required: true }) filteredCashbackOffers!: OfferDTO[];
  @Input({ required: true }) activeVouchersCount!: number;
  @Input() activeVouchers: any[] = [];

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

  readonly infiniteOffers = signal<OfferDTO[]>([]);
  readonly feedPage = signal<number>(1);
  readonly loadingMoreFeed = signal<boolean>(false);
  readonly hasMoreFeed = signal<boolean>(true);
  readonly initialFeedLoaded = signal<boolean>(false);

  ngOnInit(): void {
    this.loadFeedBatch(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCategory'] && !changes['selectedCategory'].firstChange) {
      this.loadFeedBatch(true);
    }
  }

  onSentinelIntersect(): void {
    if (this.hasMoreFeed() && !this.loadingMoreFeed() && this.initialFeedLoaded()) {
      this.loadFeedBatch(false);
    }
  }

  loadFeedBatch(reset: boolean = false): void {
    if (reset) {
      this.feedPage.set(1);
      this.infiniteOffers.set([]);
      this.hasMoreFeed.set(true);
      this.initialFeedLoaded.set(false);
    }

    if (this.loadingMoreFeed()) return;

    this.loadingMoreFeed.set(true);

    const limit = this.platformSettingsService.platformSettings()?.home_feed_limit || 10;
    const pageToFetch = this.feedPage();

    this.homeService.getPaginatedOffers(pageToFetch, limit, this.selectedCategory).subscribe({
      next: (res) => {
        const newItems = res.data || [];
        const existing = reset ? [] : this.infiniteOffers();
        const existingIds = new Set(existing.map((o) => o.id));
        const filteredNew = newItems.filter((o) => !existingIds.has(o.id));

        this.infiniteOffers.set([...existing, ...filteredNew]);
        this.hasMoreFeed.set(res.meta.hasMore);

        if (res.meta.hasMore) {
          this.feedPage.update((p) => p + 1);
        }

        this.loadingMoreFeed.set(false);
        this.initialFeedLoaded.set(true);
      },
      error: (err) => {
        console.error('Error fetching paginated home feed offers:', err);
        this.loadingMoreFeed.set(false);
        this.initialFeedLoaded.set(true);
      },
    });
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
    return 'type-fixed';
  }
}
