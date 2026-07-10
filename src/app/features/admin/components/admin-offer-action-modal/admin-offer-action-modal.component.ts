import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AdminOffer, OfferStatus, AdminBusiness } from '../../models/admin-business.model';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';

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
  
  business: AdminBusiness | null = null;
  loadingBusiness: boolean = true;

  constructor(
    private modalCtrl: ModalController,
    private adminBusinessesService: AdminBusinessesService
  ) {
    addIcons({
      closeOutline,
      checkmarkCircleOutline,
      closeCircleOutline
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
    this.modalCtrl.dismiss();
  }

  approve() {
    this.modalCtrl.dismiss({
      action: 'approve',
      offerId: this.offer.id
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
