import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, model, output, signal } from '@angular/core';
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
import { IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';
import { BusinessDTO, OfferDTO } from '../../models/home.model';
import { HomeService } from '../../services/home.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-search-view',
  standalone: true,
  imports: [IonIcon, IonSearchbar, DatePipe, CachedImgDirective, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent],
  templateUrl: './search-view.component.html',
  styleUrl: './search-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchViewComponent {
  private readonly homeService = inject(HomeService);

  readonly searchQuery = model<string>('');
  
  readonly businessClick = output<BusinessDTO>();
  readonly offerClick = output<OfferDTO>();

  readonly activeTab = signal<'businesses' | 'offers'>('businesses');
  
  readonly displayedBusinesses = signal<BusinessDTO[]>([]);
  readonly displayedOffers = signal<OfferDTO[]>([]);
  
  readonly isLoading = signal<boolean>(false);
  
  private currentPage = 1;
  private readonly pageSize = 15;
  readonly hasMore = signal<boolean>(true);
  private isLoadingMore = false;

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

    effect(() => {
      const query = this.searchQuery();
      const tab = this.activeTab();
      this.resetAndSearch();
    });
  }

  private resetAndSearch() {
    this.currentPage = 1;
    this.hasMore.set(false);
    this.isLoadingMore = false;
    this.displayedBusinesses.set([]);
    this.displayedOffers.set([]);
    this.loadData();
  }

  private loadData(event?: any) {
    if (this.isLoadingMore) {
      event?.target?.complete();
      return;
    }

    const query = this.searchQuery();
    const isInitial = this.currentPage === 1;
    if (isInitial) {
      this.isLoading.set(true);
    }
    this.isLoadingMore = true;

    if (this.activeTab() === 'businesses') {
      this.homeService.searchBusinesses(query, this.currentPage, this.pageSize).subscribe({
        next: (res) => {
          this.displayedBusinesses.update(prev => isInitial ? res.data : [...prev, ...res.data]);
          this.hasMore.set(res.meta.currentPage < res.meta.totalPages);
          this.isLoading.set(false);
          this.isLoadingMore = false;
          event?.target?.complete();
        },
        error: () => {
          this.isLoading.set(false);
          this.isLoadingMore = false;
          this.hasMore.set(false);
          event?.target?.complete();
        }
      });
    } else {
      this.homeService.searchOffers(query, this.currentPage, this.pageSize).subscribe({
        next: (res) => {
          this.displayedOffers.update(prev => isInitial ? res.data : [...prev, ...res.data]);
          this.hasMore.set(res.meta.currentPage < res.meta.totalPages);
          this.isLoading.set(false);
          this.isLoadingMore = false;
          event?.target?.complete();
        },
        error: () => {
          this.isLoading.set(false);
          this.isLoadingMore = false;
          this.hasMore.set(false);
          event?.target?.complete();
        }
      });
    }
  }

  onIonInfinite(event: any) {
    if (this.hasMore() && !this.isLoadingMore) {
      this.currentPage++;
      this.loadData(event);
    } else {
      event.target.complete();
    }
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

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }
}
