import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { IonIcon, IonSearchbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  chevronForwardOutline,
  globeOutline,
  locationOutline,
  pricetagOutline,
  receiptOutline,
  searchOutline,
  sparklesOutline,
  star,
  timeOutline
} from 'ionicons/icons';
import { BusinessDTO, OfferDTO } from '../../models/home.model';
import { CachedBgImgDirective } from '../../../../shared/directives/cached-bg-img.directive';

@Component({
  selector: 'app-search-view',
  standalone: true,
  imports: [IonIcon, IonSearchbar, DatePipe, CachedBgImgDirective],
  templateUrl: './search-view.component.html',
  styleUrl: './search-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchViewComponent {
  readonly searchQuery = model<string>('');
  readonly businesses = input<BusinessDTO[]>([]);
  readonly offers = input<OfferDTO[]>([]);
  
  readonly businessClick = output<BusinessDTO>();
  readonly offerClick = output<OfferDTO>();

  readonly activeTab = signal<'businesses' | 'offers'>('businesses');

  readonly filteredBusinesses = computed(() => {
    const list = this.businesses();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter((b: BusinessDTO) => 
      b.name.toLowerCase().includes(query) || 
      (b.description && b.description.toLowerCase().includes(query)) ||
      (b.categoryName && b.categoryName.toLowerCase().includes(query))
    );
  });

  readonly filteredOffers = computed(() => {
    const list = this.offers();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter((o: OfferDTO) => 
      o.title.toLowerCase().includes(query) || 
      o.description.toLowerCase().includes(query) ||
      (o.businessName && o.businessName.toLowerCase().includes(query))
    );
  });

  constructor() {
    addIcons({
      businessOutline,
      pricetagOutline,
      chevronForwardOutline,
      sparklesOutline,
      searchOutline,
      star,
      locationOutline,
      globeOutline,
      receiptOutline,
      timeOutline
    });
  }

  setTab(tab: 'businesses' | 'offers'): void {
    this.activeTab.set(tab);
  }

  onSearchInput(event: Event): void {
    const customEvent = event as CustomEvent;
    const value = (customEvent.detail?.value || '') as string;
    this.searchQuery.set(value);
  }

  onSearchClear(): void {
    this.searchQuery.set('');
  }
}
