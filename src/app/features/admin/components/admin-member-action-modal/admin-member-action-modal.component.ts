import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { User, UserStatus } from '../../services/admin-dashboard.service';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline, closeCircleOutline, callOutline, mailOutline, locationOutline, logoWhatsapp, businessOutline } from 'ionicons/icons';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-admin-member-action-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, DatePipe, CachedImgDirective],
  templateUrl: './admin-member-action-modal.component.html',
  styleUrls: ['./admin-member-action-modal.component.scss']
})
export class AdminMemberActionModalComponent implements OnInit {
  @Input() member!: User;
  
  UserStatus = UserStatus;
  rejectionReason: string = '';
  showRejectInput: boolean = false;

  getInitials(name: string | null | undefined): string {
    return getInitials(name);
  }

  getAvatarColor(name: string | null | undefined): string {
    return getAvatarColor(name);
  }

  constructor(private modalCtrl: ModalController) {
    addIcons({
      closeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      callOutline,
      mailOutline,
      locationOutline,
      logoWhatsapp,
      businessOutline
    });
  }

  ngOnInit() {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  approve() {
    this.modalCtrl.dismiss({
      action: 'approve',
      memberId: this.member.id
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
      memberId: this.member.id,
      reason: this.rejectionReason.trim()
    });
  }
}
