import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { AdminNotificationsService } from '../../services/admin-notifications.service';
import { NotificationType, NotificationAudience } from '../../models/admin-notification.model';
import { addIcons } from 'ionicons';
import { saveOutline, peopleOutline, personOutline, megaphoneOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-notification-create',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './admin-notification-create.page.html',
  styleUrls: ['./admin-notification-create.page.scss']
})
export class AdminNotificationCreatePage implements OnInit {
  composeForm: FormGroup;
  isSubmitting = false;

  audienceOptions = [
    { value: NotificationAudience.ALL_MEMBERS, label: 'All Members', icon: 'megaphone-outline' },
    { value: NotificationAudience.ALL_CUSTOMERS, label: 'All Customers', icon: 'megaphone-outline' }
  ];

  typeOptions = Object.values(NotificationType);

  constructor(
    private navCtrl: NavController,
    private fb: FormBuilder,
    private notificationsService: AdminNotificationsService
  ) {
    addIcons({
      saveOutline, peopleOutline, personOutline, megaphoneOutline
    });

    this.composeForm = this.fb.group({
      audience: [NotificationAudience.ALL_MEMBERS, Validators.required],
      type: [NotificationType.GENERAL, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
  }

  goBack() {
    this.navCtrl.back();
  }

  async submit() {
    if (this.composeForm.invalid) {
      this.composeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.composeForm.value;
    
    const payload = {
      title: formValue.title,
      message: formValue.message,
      type: formValue.type
    };

    let request$;

    switch (formValue.audience) {
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
          this.goBack();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error sending notification', err);
        }
      });
    } else {
      this.isSubmitting = false;
    }
  }
}
