import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminBusiness, AdminOffer, AdminVoucher, BusinessStatus, OfferStatus } from '../../models/admin-business.model';
import { AdminOfferActionModalComponent } from '../../components/admin-offer-action-modal/admin-offer-action-modal.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { AdminLogoutButtonComponent } from '../../components/admin-logout-button/admin-logout-button.component';

import { addIcons } from 'ionicons';
import { 
  businessOutline, globeOutline, documentTextOutline, 
  starOutline, star, pricetagOutline, ticketOutline,
  personOutline, callOutline, pricetag, flashOutline, timeOutline, 
  ticket, personCircleOutline, calendarOutline, checkmarkCircleOutline, closeCircleOutline, banOutline, refreshOutline, mailOutline,
  mapOutline, navigateOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-business-details',
  standalone: true,
  imports: [CommonModule, IonicModule, CachedImgDirective, CardSkeletonComponent, AdminLogoutButtonComponent],
  providers: [AdminBusinessesService],
  templateUrl: './admin-business-details.page.html',
  styleUrls: ['./admin-business-details.page.scss']
})
export class AdminBusinessDetailsPage implements OnInit {
  business: AdminBusiness | null = null;
  offers: AdminOffer[] = [];
  vouchers: AdminVoucher[] = [];
  
  loading = true;
  selectedSegment: 'details' | 'offers' | 'vouchers' = 'details';
  BusinessStatus = BusinessStatus;

  constructor(
    private route: ActivatedRoute,
    private adminBusinessesService: AdminBusinessesService,
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) {
    addIcons({
      businessOutline, globeOutline, documentTextOutline,
      starOutline, star, pricetagOutline, ticketOutline,
      personOutline, callOutline, pricetag, flashOutline, timeOutline,
      ticket, personCircleOutline, calendarOutline, checkmarkCircleOutline, closeCircleOutline, banOutline, refreshOutline, mailOutline,
      mapOutline, navigateOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBusinessData(id);
    } else {
      this.loading = false;
    }
  }

  loadBusinessData(id: string) {
    this.loading = true;
    
    // Load Business Details
    this.adminBusinessesService.getBusinessById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.business = res.data;
          this.loadOffersAndVouchers(id);
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadOffersAndVouchers(id: string) {
    // Load Offers
    this.adminBusinessesService.getBusinessOffers(id).subscribe((res: any) => {
      if (Array.isArray(res)) {
        this.offers = res;
      } else if (res && res.success) {
        this.offers = res.data || [];
      }
    });

    // Load Vouchers
    this.adminBusinessesService.getBusinessVouchers(id).subscribe((res: any) => {
      if (Array.isArray(res)) {
        this.vouchers = res;
      } else if (res && res.success) {
        this.vouchers = res.data || [];
      }
      this.loading = false; // Finished loading everything
    });
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  async toggleFeatured() {
    if (!this.business) return;
    
    const newStatus = !this.business.is_featured;
    this.adminBusinessesService.featureBusiness(this.business.id, newStatus).subscribe(async res => {
      if (res.success) {
        this.business!.is_featured = newStatus;
      }
    });
  }

  updateStatus(newStatus: BusinessStatus) {
    if (!this.business) return;
    this.adminBusinessesService.updateBusinessStatus(this.business.id, newStatus).subscribe(res => {
      if (res.success) {
        this.business!.status = newStatus;
        this.navCtrl.back();
      }
    });
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
        }
      }
    });
  }

  getStatusColor(status: BusinessStatus): string {
    switch (status) {
      case BusinessStatus.ACTIVE: return 'success';
      case BusinessStatus.PENDING: return 'warning';
      case BusinessStatus.SUSPENDED: return 'danger';
      case BusinessStatus.REJECTED: return 'danger';
      default: return 'medium';
    }
  }

  getOfferStatusColor(status: string): string {
    if (status === 'ACTIVE' || status === 'APPROVED') return 'success';
    if (status === 'REJECTED' || status === 'EXPIRED') return 'danger';
    return 'warning';
  }

  getVoucherStatusColor(status: string): string {
    if (status === 'REDEEMED') return 'success';
    if (status === 'ISSUED') return 'primary';
    return 'medium';
  }

  getFallbackAvatar(name: string | undefined | null): string {
    const fallbackName = name ? encodeURIComponent(name) : 'Business';
    return `https://ui-avatars.com/api/?name=${fallbackName}&background=random&color=fff`;
  }
}
