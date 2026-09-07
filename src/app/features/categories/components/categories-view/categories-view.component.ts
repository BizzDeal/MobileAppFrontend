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
  IonModal,
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
  call,
  callOutline,
  logoWhatsapp,
  globe,
  globeOutline,
  informationCircleOutline,
  locationOutline,
  mailOutline,
  personOutline,
  businessOutline,
  checkmarkCircle,
} from 'ionicons/icons';
import { CategoriesService } from '../../services/categories.service';
import { BusinessCategoryDTO, CategoryMemberDTO, OfferDTO } from '../../../home/models/home.model';
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
    IonModal,
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
  readonly selectedCategoryMember = this.categoriesService.selectedCategoryMember;
  readonly loadingMember = this.categoriesService.loadingMember;
  readonly userDistrictName = this.categoriesService.userDistrictName;
  readonly filteredOffers = this.categoriesService.filteredOffers;
  readonly loadingCategories = this.categoriesService.loadingCategories;
  readonly loadingOffers = this.categoriesService.loadingOffers;
  readonly error = this.categoriesService.error;
  readonly filterType = this.categoriesService.filterType;
  readonly sortType = this.categoriesService.sortType;
  readonly searchQuery = this.categoriesService.searchQuery;

  readonly claimingOfferId = signal<string | null>(null);
  readonly isMemberModalOpen = signal<boolean>(false);
  readonly selectedMemberForModal = signal<CategoryMemberDTO | null>(null);

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
      call,
      callOutline,
      logoWhatsapp,
      globe,
      globeOutline,
      informationCircleOutline,
      locationOutline,
      mailOutline,
      personOutline,
      businessOutline,
      checkmarkCircle,
    });
  }

  ngOnInit(): void {
    const district = this.categoriesService.userDistrict() || undefined;
    this.categoriesService.loadCategories(district).subscribe();
    this.categoriesService.loadOffers('ALL', district).subscribe();
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
    const district = this.categoriesService.userDistrict() || undefined;
    this.categoriesService.loadCategories(district).subscribe({
      next: () => {
        this.categoriesService.loadOffers(this.selectedCategoryId(), district).subscribe({
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

  onCallMember(event: Event, phone?: string): void {
    event.stopPropagation();
    if (!phone) return;
    const cleanPhone = phone.replace(/\s+/g, '');
    window.open(`tel:${cleanPhone}`, '_system');
  }

  onWhatsAppMember(event: Event, phone?: string): void {
    event.stopPropagation();
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_system');
  }

  onWebsiteMember(event: Event, url?: string | null): void {
    event.stopPropagation();
    if (!url) return;
    const targetUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;
    window.open(targetUrl, '_blank');
  }

  openMemberDetails(member: CategoryMemberDTO): void {
    this.selectedMemberForModal.set(member);
    this.isMemberModalOpen.set(true);
  }

  closeMemberDetails(): void {
    this.isMemberModalOpen.set(false);
    this.selectedMemberForModal.set(null);
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
