import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
} from '@angular/core';
import { BusinessDTO, CustomerProfileDTO, WalletDTO } from '../../models/home.model';
import { HomeHeaderComponent } from '../home-header/home-header.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  businessOutline,
  cashOutline,
  chevronForwardOutline,
  locationOutline,
  ribbonOutline,
  star,
  storefront,
  storefrontOutline,
  ticketOutline,
  trophy,
} from 'ionicons/icons';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';
import { register } from 'swiper/element/bundle';
import { ProfileService } from '../../../profile/services/profile.service';

register();

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [
    DecimalPipe,
    HomeHeaderComponent,
    CachedImgDirective,
    IonIcon,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerHomeComponent {
  private readonly profileService = inject(ProfileService);

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

  readonly profile = this.profileService.profile;
  readonly userStats = computed(() => this.profile()?.stats || {
    stores_visited: 0,
    customers_dealt: 0,
    profit_gained: 0,
  });

  readonly primaryBusiness = computed(() => {
    const p = this.profile();
    if (!p?.primary_business_name) return null;
    const found = (this.topBusinesses || []).find(b => b.id === p.primary_business_id) ||
                  (this.featuredBusinesses || []).find(b => b.id === p.primary_business_id);
    return {
      id: p.primary_business_id,
      name: p.primary_business_name,
      categoryName: p.primary_business_category_name || found?.categoryName || 'Partner Store',
      location: [p.primary_business_district_name, p.primary_business_state_name].filter(Boolean).join(', '),
      bannerUrl: p.primary_business_banner_url || found?.bannerUrl || found?.logoUrl || null,
      rawBiz: found || null,
    };
  });

  constructor() {
    addIcons({
      star,
      arrowForwardOutline,
      storefront,
      storefrontOutline,
      ribbonOutline,
      trophy,
      chevronForwardOutline,
      ticketOutline,
      cashOutline,
      businessOutline,
      locationOutline,
    });
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

  onPrimaryBusinessClick(): void {
    const pb = this.primaryBusiness();
    if (!pb) return;
    if (pb.rawBiz) {
      this.businessClick.emit(pb.rawBiz);
    } else if (pb.id) {
      const bizDto: BusinessDTO = {
        id: pb.id,
        owner_id: '',
        category_id: '',
        name: pb.name,
        description: null,
        website: null,
        gst_number: null,
        logo_id: null,
        status: 'ACTIVE',
        district_id: '',
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        categoryName: pb.categoryName,
        bannerUrl: pb.bannerUrl || undefined,
      };
      this.businessClick.emit(bizDto);
    }
  }

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }
}
