import { Component, Input, inject } from '@angular/core';

import { ModalController, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  micOutline,
  peopleOutline,
  notificationsOutline,
  folderOutline,
  settingsOutline,
  closeOutline,
  shieldCheckmarkOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { PermissionType } from '../../../core/platform/permissions.service';

@Component({
  selector: 'app-permission-modal',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './permission-modal.component.html',
  styleUrls: ['./permission-modal.component.scss']
})
export class PermissionModalComponent {
  private readonly modalCtrl = inject(ModalController);

  @Input() permissionType: PermissionType = 'camera';
  @Input() isDenied = false;
  @Input() customRationale?: string;

  constructor() {
    addIcons({
      cameraOutline,
      micOutline,
      peopleOutline,
      notificationsOutline,
      folderOutline,
      settingsOutline,
      closeOutline,
      shieldCheckmarkOutline,
      alertCircleOutline
    });
  }

  get title(): string {
    if (this.isDenied) {
      return `${this.getPermissionName()} Permission Blocked`;
    }
    return `Allow ${this.getPermissionName()} Access`;
  }

  get icon(): string {
    switch (this.permissionType) {
      case 'camera': return 'camera-outline';
      case 'microphone': return 'mic-outline';
      case 'contacts': return 'people-outline';
      case 'notifications': return 'notifications-outline';
      case 'storage': return 'folder-outline';
      default: return 'shield-checkmark-outline';
    }
  }

  get defaultRationale(): string {
    switch (this.permissionType) {
      case 'camera':
        return 'BizzDeal needs camera access to scan merchant QR codes and capture photos.';
      case 'microphone':
        return 'BizzDeal needs microphone access so you can record and send voice notes in chat.';
      case 'contacts':
        return 'BizzDeal needs contacts access so you can easily select friends and colleagues to invite.';
      case 'notifications':
        return 'BizzDeal needs notification access to keep you updated on deals, rewards, and messages.';
      case 'storage':
        return 'BizzDeal needs storage access to save and load media files.';
      default:
        return 'This permission is required to enable full feature functionality.';
    }
  }

  get rationale(): string {
    return this.customRationale || this.defaultRationale;
  }

  getPermissionName(): string {
    switch (this.permissionType) {
      case 'camera': return 'Camera';
      case 'microphone': return 'Microphone';
      case 'contacts': return 'Contacts';
      case 'notifications': return 'Notifications';
      case 'storage': return 'Storage';
      default: return 'Feature';
    }
  }

  dismiss(result: 'grant' | 'open_settings' | 'cancel') {
    this.modalCtrl.dismiss({ action: result });
  }
}
