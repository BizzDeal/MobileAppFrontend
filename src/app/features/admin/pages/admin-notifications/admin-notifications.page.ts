import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { AdminNotificationsService } from '../../services/admin-notifications.service';
import { AdminNotification, NotificationType, NotificationAudience } from '../../models/admin-notification.model';
import { ListSkeletonComponent } from '../../../../shared/components/skeletons/list-skeleton/list-skeleton.component';

import { addIcons } from 'ionicons';
import { notificationsOutline, trashOutline, peopleOutline, personOutline, megaphoneOutline, timeOutline, filterOutline, addOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, IonicModule, ListSkeletonComponent],
  templateUrl: './admin-notifications.page.html',
  styleUrls: ['./admin-notifications.page.scss']
})
export class AdminNotificationsPage implements OnInit {
  notifications: AdminNotification[] = [];
  loading = true;
  selectedAudience: string = 'ALL';

  isDesktop = window.innerWidth >= 992;
  page = 1;
  limit = this.isDesktop ? 5 : 20;
  hasMore = true;
  totalPages = 1;

  constructor(
    private adminNotificationsService: AdminNotificationsService,
    private navCtrl: NavController,
    private alertController: AlertController
  ) {
    addIcons({
      notificationsOutline, trashOutline, peopleOutline, personOutline, 
      megaphoneOutline, timeOutline, filterOutline, addOutline,
      chevronBackOutline, chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  ionViewWillEnter() {
    this.refresh();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth >= 992;
    if (this.isDesktop !== wasDesktop) {
      this.limit = this.isDesktop ? 5 : 20;
      this.refresh();
    }
  }

  refresh() {
    this.page = 1;
    this.notifications = [];
    this.loading = true;
    this.loadNotifications();
  }

  loadNotifications(event?: any) {
    this.loading = true;
    const filters = this.selectedAudience === 'ALL' ? undefined : { audience: this.selectedAudience as NotificationAudience };
    
    this.adminNotificationsService.getAllNotifications(filters, this.page, this.limit).subscribe({
      next: (res) => {
        if (this.page === 1 || this.isDesktop) {
          this.notifications = res.data;
        } else {
          const existingIds = new Set(this.notifications.map(n => n.id));
          const newNotifs = res.data.filter((n: any) => !existingIds.has(n.id));
          this.notifications = [...this.notifications, ...newNotifs];
        }

        if (res.meta) {
          this.page = res.meta.currentPage;
          this.totalPages = res.meta.totalPages;
          this.hasMore = res.meta.currentPage < res.meta.totalPages;
        } else {
          this.hasMore = res.data.length === this.limit;
        }

        this.loading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.loading = false;
        if (event) event.target.complete();
      }
    });
  }

  loadMore(event: any) {
    if (this.hasMore) {
      this.page++;
      this.loadNotifications(event);
    } else {
      event.target.complete();
    }
  }

  changePageSize(event: any) {
    this.limit = parseInt(event.target.value, 10);
    this.refresh();
  }

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadNotifications();
    }
  }

  handleRefresh(event: any) {
    this.refresh();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  filterByAudience(event: any) {
    this.selectedAudience = event.detail.value;
    this.refresh();
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

  openCreatePage() {
    this.navCtrl.navigateForward('/admin/notifications/create');
  }

  async deleteNotification(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this notification? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
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
      ]
    });

    await alert.present();
  }
}
