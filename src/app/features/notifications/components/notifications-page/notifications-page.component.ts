import { DatePipe, NgClass, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  IonToolbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent
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
import { AuthSessionService } from '../../../../core/services/auth-session.service';

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
    IonModal,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);

  readonly closeNotifications = output<void>();

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;

  readonly selectedFilter = signal<string>('ALL');
  readonly selectedNotification = signal<NotificationDTO | null>(null);
  readonly hasMore = this.notificationService.hasMore;

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
    
    if (notification.type === NotificationType.CHAT && notification.data?.['conversation_id']) {
      this.closeModal();
      const role = this.authSession.userRole();
      if (role === 'ADMIN') {
        this.router.navigate(['/admin/chat'], { queryParams: { conversation_id: notification.data['conversation_id'] } });
      } else if (role === 'MEMBER') {
        this.router.navigate(['/home'], { queryParams: { tab: 'chat', conversation_id: notification.data['conversation_id'] } });
      }
      return;
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

  loadMore(event: any) {
    const obs = this.notificationService.loadMoreNotifications();
    if (obs) {
      obs.subscribe({
        next: () => event.target.complete(),
        error: () => event.target.complete(),
      });
    } else {
      event.target.complete();
    }
  }
}
