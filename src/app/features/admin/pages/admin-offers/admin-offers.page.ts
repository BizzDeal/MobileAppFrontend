import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminOffer, OfferStatus } from '../../models/admin-business.model';
import { AdminRegionFilterModalComponent } from '../../components/admin-region-filter-modal/admin-region-filter-modal.component';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { addIcons } from 'ionicons';
import { 
  pricetagOutline, timeOutline, flashOutline, businessOutline, 
  filterOutline, flash, chevronForward, chevronBackOutline, 
  chevronForwardOutline, starOutline, star 
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-offers',
  standalone: true,
  imports: [CommonModule, IonicModule, CardSkeletonComponent, AdminRegionFilterModalComponent],
  templateUrl: './admin-offers.page.html',
  styleUrls: ['./admin-offers.page.scss']
})
export class AdminOffersPage implements OnInit, OnDestroy {
  offers: AdminOffer[] = [];
  loading = true;
  selectedStatus: string = 'ALL';
  stateId = '';
  districtId = '';
  searchQuery: string = '';

  isFilterOpen = false;
  isDesktop = window.innerWidth >= 992;
  page = 1;
  limit = this.isDesktop ? 5 : 20;
  hasMore = true;
  totalPages = 1;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private adminBusinessesService: AdminBusinessesService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      pricetagOutline,
      timeOutline,
      flashOutline,
      businessOutline,
      filterOutline,
      flash,
      chevronForward,
      chevronBackOutline,
      chevronForwardOutline,
      starOutline,
      star
    });
  }

  ngOnInit() {
    this.loadOffers();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchQuery = query;
      this.refresh();
    });
  }

  ionViewWillEnter() {
    if (this.offers.length > 0) {
      this.loadOffers();
    }
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize() {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth >= 992;
    if (this.isDesktop !== wasDesktop) {
      this.limit = this.isDesktop ? 5 : 20;
      this.refresh();
    }
  }

  refresh() {
    this.page = 1;
    this.offers = [];
    this.loading = true;
    this.loadOffers();
  }

  loadOffers(event?: any) {
    this.loading = true;
    const query: any = {
      page: this.page,
      limit: this.limit
    };
    
    if (this.stateId) query.state = this.stateId;
    if (this.districtId) query.district = this.districtId;
    if (this.selectedStatus !== 'ALL') {
      // If 'APPROVED' is selected, you might want to show both APPROVED and ACTIVE, but usually backend handles status exact match.
      // Assuming backend handles exact match.
      query.status = this.selectedStatus;
    }
    if (this.searchQuery.trim()) {
      query.q = this.searchQuery.trim();
    }

    this.adminBusinessesService.getAllOffers(query).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          if (this.page === 1 || this.isDesktop) {
            this.offers = res.data;
          } else {
            // Filter duplicates for infinite scroll
            const existingIds = new Set(this.offers.map(o => o.id));
            const newOffers = res.data.filter((o: any) => !existingIds.has(o.id));
            this.offers = [...this.offers, ...newOffers];
          }

          if (res.meta) {
            this.page = res.meta.currentPage;
            this.totalPages = res.meta.totalPages;
            this.hasMore = res.meta.currentPage < res.meta.totalPages;
          } else {
            this.hasMore = res.data.length === this.limit;
          }
        }
        this.loading = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.loading = false;
        if (event) event.target.complete();
      }
    });
  }

  loadMore(event: any) {
    if (this.hasMore) {
      this.page++;
      this.loadOffers(event);
    } else {
      event.target.complete();
    }
  }

  changePageSize(event: any) {
    this.limit = parseInt(event.target.value, 10);
    this.refresh();
  }

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadOffers();
    }
  }

  openFilter() {
    this.isFilterOpen = true;
  }

  onFilterApplied(data: { stateId: string; districtId: string }) {
    this.stateId = data.stateId;
    this.districtId = data.districtId;
    this.refresh();
  }

  segmentChanged(event: any) {
    this.selectedStatus = event.detail.value;
    this.refresh();
  }

  onSearch(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    this.searchSubject.next(query);
  }

  viewOfferDetails(offer: AdminOffer): void {
    this.router.navigate(['/admin/offers', offer.id]);
  }

  handleOfferAction(offerId: string, action: 'approve' | 'reject' | 'feature' | 'unfeature', reason?: string, markAsTop?: boolean) {
    if (action === 'feature' || action === 'unfeature') {
      const isFeatured = action === 'feature';
      this.adminBusinessesService.featureOffer(offerId, isFeatured).subscribe(async (res: any) => {
        if (res) {
          const index = this.offers.findIndex(o => o.id === offerId);
          if (index > -1) {
            this.offers[index] = { ...this.offers[index], is_featured: isFeatured };
          }
        }
      });
      return;
    }

    const newStatus = action === 'approve' ? OfferStatus.APPROVED : OfferStatus.REJECTED;
    
    this.adminBusinessesService.updateOfferStatus(offerId, newStatus, reason).subscribe(async (res: any) => {
      if (res) {
        const updatedOffer = res.success ? res.data : res;
        if (updatedOffer && typeof updatedOffer === 'object') {
          // If markAsTop is requested during approval, also trigger featureOffer
          if (action === 'approve' && markAsTop) {
            this.adminBusinessesService.featureOffer(offerId, true).subscribe({
              next: (featRes) => {
                const index = this.offers.findIndex(o => o.id === offerId);
                if (index > -1) {
                  this.offers[index] = { ...this.offers[index], ...updatedOffer, is_featured: true };
                }
              }
            });
          }

          // Update local array
          const index = this.offers.findIndex(o => o.id === offerId);
          if (index > -1) {
            this.offers[index] = { ...this.offers[index], ...updatedOffer, is_featured: markAsTop ? true : this.offers[index].is_featured };
            
            // If the segment is filtering by status and it no longer matches, remove it from view
            if (this.selectedStatus !== 'ALL' && this.selectedStatus !== newStatus) {
               this.offers.splice(index, 1);
            }
          }
        }
      }
    });
  }

  async toggleFeatureOffer(offer: AdminOffer, event?: Event) {
    if (event) event.stopPropagation();
    
    // Only allow for active or approved offers
    if (offer.status !== 'ACTIVE' && offer.status !== 'APPROVED') {
      return;
    }

    const newStatus = !offer.is_featured;
    const actionText = newStatus ? 'mark' : 'unmark';

    const alert = await this.alertController.create({
      header: 'Confirm Action',
      message: `Are you sure you want to ${actionText} "${offer.title}" ${newStatus ? 'as a Top Deal' : 'from Top Deals'}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: () => {
            this.adminBusinessesService.featureOffer(offer.id, newStatus).subscribe({
              next: (res: any) => {
                if (res.success) {
                  offer.is_featured = newStatus;
                }
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  getOfferStatusColor(status: string): string {
    if (status === 'ACTIVE' || status === 'APPROVED') return 'success';
    if (status === 'REJECTED' || status === 'EXPIRED') return 'danger';
    return 'warning';
  }
}
