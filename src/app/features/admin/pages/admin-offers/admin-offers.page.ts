import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminOffer, OfferStatus } from '../../models/admin-business.model';
import { AdminOfferActionModalComponent } from '../../components/admin-offer-action-modal/admin-offer-action-modal.component';
import { AdminRegionFilterModalComponent } from '../../components/admin-region-filter-modal/admin-region-filter-modal.component';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';

import { addIcons } from 'ionicons';
import { pricetagOutline, timeOutline, flashOutline, businessOutline, filterOutline, flash, chevronForward } from 'ionicons/icons';

@Component({
  selector: 'app-admin-offers',
  standalone: true,
  imports: [CommonModule, IonicModule, CardSkeletonComponent, AdminRegionFilterModalComponent],
  templateUrl: './admin-offers.page.html',
  styleUrls: ['./admin-offers.page.scss']
})
export class AdminOffersPage implements OnInit {
  offers: AdminOffer[] = [];
  filteredOffers: AdminOffer[] = [];
  loading = true;
  selectedStatus: string = 'PENDING';
  stateId = '';
  districtId = '';

  constructor(
    private adminBusinessesService: AdminBusinessesService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      pricetagOutline,
      timeOutline,
      flashOutline,
      businessOutline,
      filterOutline,
      flash,
      chevronForward
    });
  }

  ngOnInit() {
    this.loadOffers();
  }

  loadOffers() {
    this.loading = true;
    const query: any = {};
    if (this.stateId) query.state = this.stateId;
    if (this.districtId) query.district = this.districtId;

    this.adminBusinessesService.getAllOffers(query).subscribe({
      next: (res: any) => {
        if (res) {
          if (Array.isArray(res)) {
            this.offers = res;
          } else if (res.success && Array.isArray(res.data)) {
            this.offers = res.data;
          } else if (res.data && Array.isArray(res.data)) {
            this.offers = res.data;
          }
          this.filterOffers();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  isFilterOpen = false;

  openFilter() {
    this.isFilterOpen = true;
  }

  onFilterApplied(data: { stateId: string; districtId: string }) {
    this.stateId = data.stateId;
    this.districtId = data.districtId;
    this.offers = [];
    this.filteredOffers = [];
    this.loading = true;
    this.loadOffers();
  }

  searchQuery: string = '';

  segmentChanged(event: any) {
    this.selectedStatus = event.detail.value;
    this.filterOffers();
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value?.toLowerCase() || '';
    this.filterOffers();
  }

  filterOffers() {
    let tempOffers = [...this.offers];

    if (this.selectedStatus !== 'ALL') {
      tempOffers = tempOffers.filter(offer => {
        const offerStatus = (offer.status || '').toUpperCase();
        const selected = this.selectedStatus.toUpperCase();
        if (selected === 'APPROVED') {
          return offerStatus === 'APPROVED' || offerStatus === 'ACTIVE';
        }
        return offerStatus === selected;
      });
    }

    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.trim();
      tempOffers = tempOffers.filter(offer => 
        (offer.title && offer.title.toLowerCase().includes(query)) ||
        (offer.business_name && offer.business_name.toLowerCase().includes(query))
      );
    }

    this.filteredOffers = tempOffers;
  }

  async openOfferModal(offer: AdminOffer) {
    const modal = await this.modalCtrl.create({
      component: AdminOfferActionModalComponent,
      componentProps: {
        offer
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.action) {
      this.handleOfferAction(data.offerId, data.action, data.reason);
    }
  }

  handleOfferAction(offerId: string, action: 'approve' | 'reject', reason?: string) {
    const newStatus = action === 'approve' ? OfferStatus.APPROVED : OfferStatus.REJECTED;
    
    this.adminBusinessesService.updateOfferStatus(offerId, newStatus, reason).subscribe(async (res: any) => {
      if (res) {
        const updatedOffer = res.success ? res.data : res;
        if (updatedOffer && typeof updatedOffer === 'object') {
          // Update local array
          const index = this.offers.findIndex(o => o.id === offerId);
          if (index > -1) {
            this.offers[index] = { ...this.offers[index], ...updatedOffer };
            // Re-filter to reflect the updated status if the segment is active
            this.filterOffers();
          }
        }
      }
    });
  }

  getOfferStatusColor(status: string): string {
    if (status === 'ACTIVE' || status === 'APPROVED') return 'success';
    if (status === 'REJECTED' || status === 'EXPIRED') return 'danger';
    return 'warning';
  }
}
