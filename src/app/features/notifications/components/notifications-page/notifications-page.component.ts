import { DatePipe, NgClass, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  calendarOutline,
  chatbubbleOutline,
  checkmarkDoneOutline,
  closeOutline,
  gridOutline,
  informationCircleOutline,
  ticketOutline,
  trashOutline,
  walletOutline
} from 'ionicons/icons';
import { NotificationDTO, NotificationType } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    KeyValuePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonModal
  ],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {
  private readonly notificationService = inject(NotificationService);

  readonly closeNotifications = output<void>();

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;

  readonly selectedFilter = signal<string>('ALL');
  readonly selectedNotification = signal<NotificationDTO | null>(null);

  readonly filteredNotifications = computed(() => {
    const filter = this.selectedFilter();
    const all = this.notifications();
    if (filter === 'ALL') return all;
    if (filter === 'UNREAD') return all.filter(n => !n.is_read);
    return all.filter(n => n.type === filter);
  });

  constructor() {
    addIcons({
      closeOutline,
      checkmarkDoneOutline,
      trashOutline,
      ticketOutline,
      walletOutline,
      calendarOutline,
      chatbubbleOutline,
      informationCircleOutline,
      alertCircleOutline,
      gridOutline
    });
  }

  closeModal(): void {
    this.closeNotifications.emit();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe();
  }

  openNotification(notification: NotificationDTO): void {
    if (!notification.is_read) {
      this.markAsRead(notification.id);
    }
    this.selectedNotification.set(notification);
  }

  deleteNotification(id: string): void {
    this.notificationService.deleteNotification(id).subscribe();
  }

  getIconForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.OFFER:
      case NotificationType.VOUCHER:
        return 'ticket-outline';
      case NotificationType.WALLET:
        return 'wallet-outline';
      case NotificationType.MEETING:
        return 'calendar-outline';
      case NotificationType.CHAT:
        return 'chatbubble-outline';
      case NotificationType.GENERAL:
      default:
        return 'information-circle-outline';
    }
  }

  getColorForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.VOUCHER:
      case NotificationType.OFFER:
        return 'success';
      case NotificationType.WALLET:
        return 'warning';
      case NotificationType.MEETING:
        return 'tertiary';
      case NotificationType.CHAT:
        return 'primary';
      case NotificationType.GENERAL:
      default:
        return 'medium';
    }
  }
}
