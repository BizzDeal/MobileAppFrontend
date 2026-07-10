import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AdminNotificationsService } from '../../services/admin-notifications.service';
import { NotificationType, NotificationAudience } from '../../models/admin-notification.model';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, peopleOutline, personOutline, megaphoneOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-notification-compose-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './admin-notification-compose-modal.component.html',
  styleUrls: ['./admin-notification-compose-modal.component.scss']
})
export class AdminNotificationComposeModalComponent implements OnInit {
  composeForm: FormGroup;
  isSubmitting = false;

  audienceOptions = [
    { value: NotificationAudience.SINGLE_USER, label: 'Single User', icon: 'person-outline' },
    { value: NotificationAudience.BULK_USERS, label: 'Bulk Users', icon: 'people-outline' },
    { value: NotificationAudience.ALL_MEMBERS, label: 'All Members', icon: 'megaphone-outline' },
    { value: NotificationAudience.ALL_CUSTOMERS, label: 'All Customers', icon: 'megaphone-outline' }
  ];

  typeOptions = Object.values(NotificationType);

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private notificationsService: AdminNotificationsService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      closeOutline, saveOutline, peopleOutline, personOutline, megaphoneOutline
    });

    this.composeForm = this.fb.group({
      audience: [NotificationAudience.ALL_MEMBERS, Validators.required],
      type: [NotificationType.GENERAL, Validators.required],
      target_ids: [''], // Only required if SINGLE_USER or BULK_USERS
      title: ['', [Validators.required, Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    // Dynamic validation based on audience
    this.composeForm.get('audience')?.valueChanges.subscribe(audience => {
      const targetIdsControl = this.composeForm.get('target_ids');
      if (audience === NotificationAudience.SINGLE_USER || audience === NotificationAudience.BULK_USERS) {
        targetIdsControl?.setValidators([Validators.required]);
      } else {
        targetIdsControl?.clearValidators();
      }
      targetIdsControl?.updateValueAndValidity();
    });
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data, data ? 'confirm' : 'cancel');
  }

  async submit() {
    if (this.composeForm.invalid) {
      this.composeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.composeForm.value;
    
    // Parse target_ids for BULK_USERS
    let userIds: string[] = [];
    if (formValue.target_ids) {
      userIds = formValue.target_ids.split(',').map((id: string) => id.trim()).filter((id: string) => id);
    }

    const payload = {
      title: formValue.title,
      message: formValue.message,
      type: formValue.type
    };

    let request$;

    switch (formValue.audience) {
      case NotificationAudience.SINGLE_USER:
        request$ = this.notificationsService.sendToUser(userIds[0], payload);
        break;
      case NotificationAudience.BULK_USERS:
        request$ = this.notificationsService.sendBulk(userIds, payload);
        break;
      case NotificationAudience.ALL_MEMBERS:
        request$ = this.notificationsService.broadcastToMembers(payload);
        break;
      case NotificationAudience.ALL_CUSTOMERS:
        request$ = this.notificationsService.broadcastToCustomers(payload);
        break;
    }

    if (request$) {
      request$.subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.showToast('Notification sent successfully!', 'success');
          this.dismiss(res.notification);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error sending notification', err);
          this.showToast(err.message || 'Failed to send notification', 'danger');
        }
      });
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 3000,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    toast.present();
  }
}
