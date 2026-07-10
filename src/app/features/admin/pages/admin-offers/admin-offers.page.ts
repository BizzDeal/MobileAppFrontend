import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminOffer, OfferStatus } from '../../models/admin-business.model';
import { AdminOfferActionModalComponent } from '../../components/admin-offer-action-modal/admin-offer-action-modal.component';
import { addIcons } from 'ionicons';
import { pricetagOutline, timeOutline, flashOutline, businessOutline, filterOutline, flash, chevronForward } from 'ionicons/icons';

@Component({
  selector: 'app-admin-offers',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-offers.page.html',
  styleUrls: ['./admin-offers.page.scss']
})
export class AdminOffersPage implements OnInit {
  offers: AdminOffer[] = [];
  filteredOffers: AdminOffer[] = [];
  loading = true;
  selectedStatus: string = 'PENDING';

  constructor(
    private adminBusinessesService: AdminBusinessesService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
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
    this.adminBusinessesService.getAllOffers().subscribe({
      next: (res) => {
        if (res.success) {
          this.offers = res.data;
          this.filterOffers();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
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
      tempOffers = tempOffers.filter(offer => offer.status === this.selectedStatus);
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
    
    this.adminBusinessesService.updateOfferStatus(offerId, newStatus, reason).subscribe(async res => {
      if (res.success) {
        // Update local array
        const index = this.offers.findIndex(o => o.id === offerId);
        if (index > -1) {
          this.offers[index] = res.data;
          // Re-filter to reflect the updated status if the segment is active
          this.filterOffers();
        }
        
        const toast = await this.toastCtrl.create({
          message: res.message,
          duration: 2000,
          color: 'success'
        });
        toast.present();
      }
    });
  }

  getOfferStatusColor(status: string): string {
    if (status === 'ACTIVE' || status === 'APPROVED') return 'success';
    if (status === 'REJECTED' || status === 'EXPIRED') return 'danger';
    return 'warning';
  }
}
