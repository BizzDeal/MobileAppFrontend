import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminOffer, OfferStatus, AdminBusiness } from '../../models/admin-business.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { AdminLogoutButtonComponent } from '../../components/admin-logout-button/admin-logout-button.component';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';

import { addIcons } from 'ionicons';
import { 
  pricetagOutline, timeOutline, flashOutline, businessOutline, 
  starOutline, star, checkmarkCircleOutline, closeCircleOutline, 
  personOutline, mailOutline, callOutline, mapOutline, documentTextOutline,
  calendarOutline, ticketOutline, arrowBackOutline, trophyOutline, trophy
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-offer-details',
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    FormsModule, 
    DatePipe,
    CachedImgDirective, 
    CardSkeletonComponent, 
    AdminLogoutButtonComponent
  ],
  providers: [AdminBusinessesService],
  templateUrl: './admin-offer-details.page.html',
  styleUrls: ['./admin-offer-details.page.scss']
})
export class AdminOfferDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly adminBusinessesService = inject(AdminBusinessesService);
  private readonly alertController = inject(AlertController);

  offer: AdminOffer | null = null;
  business: AdminBusiness | null = null;
  
  loading = true;
  loadingBusiness = false;
  actionLoading = false;
  
  OfferStatus = OfferStatus;
  rejectionReason = '';
  showRejectInput = false;
  isTopDeal = false;

  constructor() {
    addIcons({
      pricetagOutline,
      timeOutline,
      flashOutline,
      businessOutline,
      starOutline,
      star,
      checkmarkCircleOutline,
      closeCircleOutline,
      personOutline,
      mailOutline,
      callOutline,
      mapOutline,
      documentTextOutline,
      calendarOutline,
      ticketOutline,
      arrowBackOutline,
      trophyOutline,
      trophy
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ionViewWillEnter(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.offer && this.offer.id === id) {
      this.loadData();
    }
  }

  loadData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.adminBusinessesService.getOfferById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.offer = res.data;
          this.isTopDeal = !!this.offer.is_featured;
          if (this.offer.business_id) {
            this.loadBusinessData(this.offer.business_id);
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadBusinessData(businessId: string): void {
    this.loadingBusiness = true;
    this.adminBusinessesService.getBusinessById(businessId).subscribe({
      next: (res) => {
        if (res.success) {
          this.business = res.data;
        }
        this.loadingBusiness = false;
      },
      error: () => {
        this.loadingBusiness = false;
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/admin/offers']);
    }
  }

  getInitials(name: string | null | undefined): string {
    return getInitials(name);
  }

  getAvatarColor(name: string | null | undefined): string {
    return getAvatarColor(name);
  }

  onTopDealCheckboxChange(event: any): void {
    const checked = !!event?.detail?.checked;
    this.isTopDeal = checked;

    // If offer is already APPROVED or ACTIVE, immediately update backend
    if (this.offer && (this.offer.status === 'ACTIVE' || this.offer.status === 'APPROVED')) {
      this.adminBusinessesService.featureOffer(this.offer.id, checked).subscribe({
        next: (res) => {
          if (res.success && this.offer) {
            this.offer.is_featured = checked;
          }
        },
        error: () => {
          // Revert on failure
          this.isTopDeal = !checked;
        }
      });
    }
  }

  approve(): void {
    if (!this.offer || this.actionLoading) return;
    this.actionLoading = true;

    // Step 1: Offer approval API completes first
    this.adminBusinessesService.updateOfferStatus(this.offer.id, OfferStatus.APPROVED).subscribe({
      next: (res) => {
        this.actionLoading = false;
        if (res.success && this.offer) {
          this.offer.status = OfferStatus.APPROVED;
          this.showRejectInput = false;

          // Step 2: Once approval ends, update Top Deal status if checked
          if (this.isTopDeal) {
            this.adminBusinessesService.featureOffer(this.offer.id, true).subscribe({
              next: () => {
                if (this.offer) this.offer.is_featured = true;
              }
            });
          }
        }
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  toggleRejectInput(): void {
    this.showRejectInput = true;
  }

  cancelReject(): void {
    this.showRejectInput = false;
    this.rejectionReason = '';
  }

  reject(): void {
    if (!this.offer || this.actionLoading || !this.rejectionReason.trim()) return;
    this.actionLoading = true;

    const reason = this.rejectionReason.trim();
    this.adminBusinessesService.updateOfferStatus(this.offer.id, OfferStatus.REJECTED, reason).subscribe({
      next: (res) => {
        this.actionLoading = false;
        if (res.success && this.offer) {
          this.offer.status = OfferStatus.REJECTED;
          this.offer.rejection_reason = reason;
          this.showRejectInput = false;
        }
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  getStatusColor(status: string | undefined): string {
    if (status === 'ACTIVE' || status === 'APPROVED') return 'success';
    if (status === 'REJECTED' || status === 'EXPIRED') return 'danger';
    return 'warning';
  }
}
