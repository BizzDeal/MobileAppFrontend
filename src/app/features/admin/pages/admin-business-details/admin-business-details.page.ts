import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminBusiness, AdminOffer, AdminVoucher, BusinessStatus, OfferStatus } from '../../models/admin-business.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { AdminLogoutButtonComponent } from '../../components/admin-logout-button/admin-logout-button.component';

import { addIcons } from 'ionicons';
import { 
  businessOutline, globeOutline, documentTextOutline, 
  starOutline, star, trophyOutline, trophy, pricetagOutline, ticketOutline,
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
  activeTab: 'details' | 'offers' | 'vouchers' = 'details';
  BusinessStatus = BusinessStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminBusinessesService: AdminBusinessesService,
    private navCtrl: NavController,
    private alertController: AlertController
  ) {
    addIcons({
      businessOutline, globeOutline, documentTextOutline,
      starOutline, star, trophyOutline, trophy, pricetagOutline, ticketOutline,
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

  ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.business) {
      this.loadBusinessData(id);
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

  setTab(tab: 'details' | 'offers' | 'vouchers') {
    this.activeTab = tab;
  }

  async toggleTop() {
    if (!this.business) return;
    if (this.business.status !== BusinessStatus.ACTIVE) return;

    const newStatus = !this.business.is_top;
    const actionText = newStatus ? 'mark as Top Business' : 'unmark from Top Businesses';

    const alert = await this.alertController.create({
      header: 'Confirm Action',
      message: `Are you sure you want to ${actionText} "${this.business.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: () => {
            this.adminBusinessesService.topBusiness(this.business!.id, newStatus).subscribe(res => {
              if (res.success) {
                this.business!.is_top = newStatus;
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async updateStatus(newStatus: BusinessStatus) {
    if (!this.business) return;

    if (newStatus === BusinessStatus.ACTIVE) {
      // Approving business: provide options to mark as Top Business
      const alert = await this.alertController.create({
        header: 'Approve Business',
        message: `Approve "${this.business.name}" to make it active on the platform.`,
        inputs: [
          {
            name: 'is_top',
            type: 'checkbox',
            label: 'Mark as Top Business',
            value: 'is_top',
            checked: false
          }
        ],
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Approve',
            handler: (data: string[]) => {
              const markTop = data && data.includes('is_top');

              this.adminBusinessesService.updateBusinessStatus(this.business!.id, BusinessStatus.ACTIVE).subscribe(res => {
                if (res.success) {
                  this.business!.status = BusinessStatus.ACTIVE;
                  if (markTop) {
                    this.adminBusinessesService.topBusiness(this.business!.id, true).subscribe(topRes => {
                      if (topRes.success) this.business!.is_top = true;
                    });
                  }
                  this.navCtrl.back();
                }
              });
            }
          }
        ]
      });

      await alert.present();
      return;
    }

    if (newStatus === BusinessStatus.REJECTED) {
      const alert = await this.alertController.create({
        header: 'Reject Business',
        message: `Enter rejection reason for "${this.business.name}" (min 3 characters):`,
        inputs: [
          {
            name: 'reason',
            type: 'textarea',
            placeholder: 'Rejection reason...',
          },
        ],
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Reject',
            handler: (data) => {
              const entered = (data?.reason || '').trim();
              if (entered.length < 3) {
                return false;
              }
              this.adminBusinessesService.updateBusinessStatus(this.business!.id, BusinessStatus.REJECTED, entered).subscribe(res => {
                if (res.success) {
                  this.business!.status = BusinessStatus.REJECTED;
                  (this.business as any).rejection_reason = entered;
                  this.navCtrl.back();
                }
              });
              return true;
            },
          },
        ],
      });

      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Status Change',
      message: `Are you sure you want to change the status of "${this.business.name}" to ${newStatus}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: () => {
            this.adminBusinessesService.updateBusinessStatus(this.business!.id, newStatus).subscribe(res => {
              if (res.success) {
                this.business!.status = newStatus;
                this.navCtrl.back();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  viewOfferDetails(offer: AdminOffer): void {
    this.router.navigate(['/admin/offers', offer.id]);
  }

  async toggleFeatureOffer(offer: AdminOffer, event?: Event) {
    if (event) event.stopPropagation();
    if (offer.status !== 'ACTIVE' && offer.status !== 'APPROVED') return;

    const newStatus = !offer.is_featured;
    const alert = await this.alertController.create({
      header: newStatus ? 'Mark as Featured' : 'Remove Featured',
      message: `Are you sure you want to ${newStatus ? 'feature' : 'unfeature'} this offer?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: () => {
            this.adminBusinessesService.featureOffer(offer.id, newStatus).subscribe(res => {
              if (res.success) {
                offer.is_featured = newStatus;
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async handleOfferAction(offerId: string, action: 'approve' | 'reject', reason?: string, markAsTop?: boolean) {
    if (action === 'reject' && (!reason || reason.trim().length < 3)) {
      const alert = await this.alertController.create({
        header: 'Reject Offer',
        message: 'Please provide the rejection reason for this offer (min 3 characters):',
        inputs: [
          {
            name: 'reason',
            type: 'textarea',
            placeholder: 'Enter rejection reason...',
          },
        ],
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Reject',
            handler: (data) => {
              const entered = (data?.reason || '').trim();
              if (entered.length < 3) {
                return false;
              }
              this.handleOfferAction(offerId, 'reject', entered);
              return true;
            },
          },
        ],
      });
      await alert.present();
      return;
    }

    const newStatus = action === 'approve' ? OfferStatus.APPROVED : OfferStatus.REJECTED;
    
    this.adminBusinessesService.updateOfferStatus(offerId, newStatus, reason).subscribe(async res => {
      if (res.success) {
        if (action === 'approve' && markAsTop) {
          this.adminBusinessesService.featureOffer(offerId, true).subscribe({
            next: () => {
              const index = this.offers.findIndex(o => o.id === offerId);
              if (index > -1) {
                this.offers[index] = { ...this.offers[index], is_featured: true };
              }
            }
          });
        }

        // Update local array
        const index = this.offers.findIndex(o => o.id === offerId);
        if (index > -1) {
          this.offers[index] = { ...res.data, is_featured: markAsTop ? true : res.data.is_featured };
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

}
