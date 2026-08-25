import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  searchOutline,
  closeOutline,
  funnelOutline,
  swapVerticalOutline,
  pricetagOutline,
  timeOutline,
  checkmarkOutline,
  storefrontOutline,
  sparklesOutline,
  giftOutline,
  ribbonOutline,
  gridOutline,
  bagHandleOutline,
} from 'ionicons/icons';
import { CategoriesService } from '../../services/categories.service';
import { BusinessCategoryDTO, OfferDTO } from '../../../home/models/home.model';
import { CategoryFilterType, CategorySortType } from '../../models/category-view.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-categories-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CachedImgDirective,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: './categories-view.component.html',
  styleUrls: ['./categories-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesViewComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);

  readonly categories = this.categoriesService.categories;
  readonly selectedCategoryId = this.categoriesService.selectedCategoryId;
  readonly selectedCategory = this.categoriesService.selectedCategory;
  readonly filteredOffers = this.categoriesService.filteredOffers;
  readonly loadingCategories = this.categoriesService.loadingCategories;
  readonly loadingOffers = this.categoriesService.loadingOffers;
  readonly error = this.categoriesService.error;
  readonly filterType = this.categoriesService.filterType;
  readonly sortType = this.categoriesService.sortType;
  readonly searchQuery = this.categoriesService.searchQuery;

  readonly claimingOfferId = signal<string | null>(null);

  readonly dealClick = output<OfferDTO>();
  readonly claimOffer = output<OfferDTO>();

  readonly getAvatarColor = getAvatarColor;
  readonly getInitials = getInitials;

  constructor() {
    addIcons({
      arrowBackOutline,
      searchOutline,
      closeOutline,
      funnelOutline,
      swapVerticalOutline,
      pricetagOutline,
      timeOutline,
      checkmarkOutline,
      storefrontOutline,
      sparklesOutline,
      giftOutline,
      ribbonOutline,
      gridOutline,
      bagHandleOutline,
    });
  }

  ngOnInit(): void {
    this.categoriesService.loadCategories().subscribe();
    this.categoriesService.loadOffers('ALL').subscribe();
  }

  onSelectCategory(catId: string): void {
    this.categoriesService.selectCategory(catId);
  }

  onFilterSelect(type: CategoryFilterType): void {
    this.categoriesService.setFilterType(type);
  }

  toggleSort(): void {
    const current = this.sortType();
    if (current === 'NEWEST') {
      this.categoriesService.setSortType('DISCOUNT_DESC');
    } else if (current === 'DISCOUNT_DESC') {
      this.categoriesService.setSortType('TITLE_ASC');
    } else {
      this.categoriesService.setSortType('NEWEST');
    }
  }

  onRefresh(event: any): void {
    this.categoriesService.loadCategories().subscribe({
      next: () => {
        this.categoriesService.loadOffers(this.selectedCategoryId()).subscribe({
          next: () => event?.target?.complete(),
          error: () => event?.target?.complete(),
        });
      },
      error: () => event?.target?.complete(),
    });
  }

  onCardClick(deal: OfferDTO): void {
    this.dealClick.emit(deal);
  }

  onClaimClick(event: Event, deal: OfferDTO): void {
    event.stopPropagation();
    if (deal.isClaimed || this.claimingOfferId()) {
      return;
    }
    this.claimingOfferId.set(deal.id);
    this.categoriesService.claimOffer(deal).subscribe({
      next: () => {
        this.claimingOfferId.set(null);
        this.claimOffer.emit(deal);
      },
      error: () => {
        this.claimingOfferId.set(null);
      },
    });
  }

  getDiscountBadgeText(deal: OfferDTO): string {
    if (deal.offer_type === 'CASHBACK') {
      return deal.discount_value ? `₹${deal.discount_value} CASHBACK` : 'CASHBACK';
    }
    if (deal.discount_type === 'PERCENTAGE' && deal.discount_value) {
      return `${deal.discount_value}% OFF`;
    }
    if (deal.discount_value) {
      return `₹${deal.discount_value} OFF`;
    }
    return 'HOT DEAL';
  }
}
