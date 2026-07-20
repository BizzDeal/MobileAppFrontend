import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { AdminNotificationsService } from '../../services/admin-notifications.service';
import { AdminNotification, NotificationType, NotificationAudience } from '../../models/admin-notification.model';
import { AdminNotificationComposeModalComponent } from '../../components/admin-notification-compose-modal/admin-notification-compose-modal.component';

import { addIcons } from 'ionicons';
import { notificationsOutline, trashOutline, peopleOutline, personOutline, megaphoneOutline, timeOutline, filterOutline, addOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-notifications.page.html',
  styleUrls: ['./admin-notifications.page.scss']
})
export class AdminNotificationsPage implements OnInit {
  notifications: AdminNotification[] = [];
  filteredNotifications: AdminNotification[] = [];
  loading = true;
  selectedAudience: string = 'ALL';

  constructor(
    private adminNotificationsService: AdminNotificationsService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      notificationsOutline, trashOutline, peopleOutline, personOutline, 
      megaphoneOutline, timeOutline, filterOutline, addOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading = true;
    this.adminNotificationsService.getAllNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.loading = false;
      }
    });
  }

  handleRefresh(event: any) {
    this.adminNotificationsService.getAllNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.applyFilters();
        event.target.complete();
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        event.target.complete();
      }
    });
  }

  filterByAudience(event: any) {
    this.selectedAudience = event.detail.value;
    this.applyFilters();
  }

  applyFilters() {
    if (this.selectedAudience === 'ALL') {
      this.filteredNotifications = [...this.notifications];
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.audience === this.selectedAudience);
    }
  }

  getAudienceIcon(audience: NotificationAudience): string {
    switch (audience) {
      case NotificationAudience.SINGLE_USER: return 'person-outline';
      case NotificationAudience.BULK_USERS: return 'people-outline';
      default: return 'megaphone-outline';
    }
  }
  
  getAudienceLabel(audience: NotificationAudience): string {
    switch (audience) {
      case NotificationAudience.SINGLE_USER: return 'Single User';
      case NotificationAudience.BULK_USERS: return 'Bulk Users';
      case NotificationAudience.ALL_MEMBERS: return 'All Members';
      case NotificationAudience.ALL_CUSTOMERS: return 'All Customers';
      default: return 'Unknown';
    }
  }

  getTypeBadgeColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.OFFER: return 'warning';
      case NotificationType.VOUCHER: return 'success';
      case NotificationType.WALLET: return 'tertiary';
      case NotificationType.MEETING: return 'secondary';
      case NotificationType.CHAT: return 'dark';
      case NotificationType.GENERAL:
      default: return 'primary';
    }
  }

  async openComposeModal() {
    const modal = await this.modalCtrl.create({
      component: AdminNotificationComposeModalComponent,
      cssClass: 'admin-action-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      // Reload notifications if a new one was sent
      this.loadNotifications();
    }
  }

  async deleteNotification(id: string) {
    this.adminNotificationsService.deleteNotification(id).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Failed to delete notification', err);
      }
    });
  }
}
