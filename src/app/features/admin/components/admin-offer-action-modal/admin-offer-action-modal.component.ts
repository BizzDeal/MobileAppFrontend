import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AdminOffer, OfferStatus, AdminBusiness } from '../../models/admin-business.model';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline, closeCircleOutline, starOutline, star } from 'ionicons/icons';

@Component({
  selector: 'app-admin-offer-action-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './admin-offer-action-modal.component.html',
  styleUrls: ['./admin-offer-action-modal.component.scss']
})
export class AdminOfferActionModalComponent implements OnInit {
  @Input() offer!: AdminOffer;
  
  OfferStatus = OfferStatus;
  rejectionReason: string = '';
  showRejectInput: boolean = false;
  markAsTopOnApprove: boolean = false;
  
  business: AdminBusiness | null = null;
  loadingBusiness: boolean = true;

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private adminBusinessesService: AdminBusinessesService
  ) {
    addIcons({
      closeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      starOutline,
      star
    });
  }

  ngOnInit() {
    this.adminBusinessesService.getBusinessById(this.offer.business_id).subscribe({
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

  dismiss() {
    this.modalCtrl.dismiss({
      updatedOffer: this.offer
    });
  }

  async toggleFeature() {
    // Only allowed for active or approved offers
    if (this.offer.status !== 'ACTIVE' && this.offer.status !== 'APPROVED') {
      return;
    }

    const newStatus = !this.offer.is_featured;
    const actionText = newStatus ? 'mark' : 'unmark';

    const alert = await this.alertController.create({
      header: 'Confirm Action',
      message: `Are you sure you want to ${actionText} "${this.offer.title}" ${newStatus ? 'as a Top Deal' : 'from Top Deals'}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: () => {
            this.adminBusinessesService.featureOffer(this.offer.id, newStatus).subscribe({
              next: (res) => {
                if (res.success) {
                  this.offer.is_featured = newStatus;
                }
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  approve() {
    this.modalCtrl.dismiss({
      action: 'approve',
      offerId: this.offer.id,
      markAsTop: this.markAsTopOnApprove
    });
  }

  toggleRejectInput() {
    this.showRejectInput = true;
  }

  cancelReject() {
    this.showRejectInput = false;
    this.rejectionReason = '';
  }

  reject() {
    if (!this.rejectionReason.trim()) {
      return;
    }
    
    this.modalCtrl.dismiss({
      action: 'reject',
      offerId: this.offer.id,
      reason: this.rejectionReason.trim()
    });
  }
}
