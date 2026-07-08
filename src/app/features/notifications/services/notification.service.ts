import { Injectable, signal, computed } from '@angular/core';
import { delay, Observable, of, map } from 'rxjs';
import { NotificationDTO, NotificationType } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _notifications = signal<NotificationDTO[]>(this.generateMockData());
  
  readonly notifications = this._notifications.asReadonly();
  
  readonly unreadCount = computed(() => {
    return this._notifications().filter(n => !n.is_read).length;
  });

  getNotifications(): Observable<NotificationDTO[]> {
    // Simulate network delay
    return of(this._notifications()).pipe(delay(500));
  }

  markAsRead(id: string): Observable<void> {
    this._notifications.update(notes => 
      notes.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date() } : n)
    );
    return of(void 0).pipe(delay(300));
  }

  markAllAsRead(): Observable<void> {
    this._notifications.update(notes => 
      notes.map(n => ({ ...n, is_read: true, read_at: new Date() }))
    );
    return of(void 0).pipe(delay(300));
  }

  deleteNotification(id: string): Observable<void> {
    this._notifications.update(notes => notes.filter(n => n.id !== id));
    return of(void 0).pipe(delay(300));
  }

  private generateMockData(): NotificationDTO[] {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    return [
      {
        id: 'notif-1',
        user_id: 'user-1',
        title: 'New Offer Claimed!',
        message: 'You have successfully claimed the 50% Off at TechHub deal. Your voucher is now in your wallet.',
        type: NotificationType.VOUCHER,
        data: { voucherId: 'v-123' },
        is_read: false,
        read_at: null,
        created_at: now,
        updated_at: now
      },
      {
        id: 'notif-2',
        user_id: 'user-1',
        title: 'Cashback Received 💸',
        message: 'You received ₹150 cashback for your recent referral. Check your wallet balance.',
        type: NotificationType.WALLET,
        data: { amount: 150 },
        is_read: false,
        read_at: null,
        created_at: twoHoursAgo,
        updated_at: twoHoursAgo
      },
      {
        id: 'notif-3',
        user_id: 'user-1',
        title: 'Meeting Scheduled',
        message: 'Your meeting with DesignPro has been scheduled for tomorrow at 10:00 AM.',
        type: NotificationType.MEETING,
        data: { meetingId: 'm-456' },
        is_read: true,
        read_at: oneDayAgo,
        created_at: oneDayAgo,
        updated_at: oneDayAgo
      },
      {
        id: 'notif-4',
        user_id: 'user-1',
        title: 'New Message from Sarah',
        message: 'Hey, are we still on for the project discussion today?',
        type: NotificationType.CHAT,
        data: { conversationId: 'c-789' },
        is_read: true,
        read_at: twoDaysAgo,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 'notif-5',
        user_id: 'user-1',
        title: 'System Update',
        message: 'BizzDeal will be undergoing maintenance tonight from 2AM to 4AM.',
        type: NotificationType.GENERAL,
        data: null,
        is_read: true,
        read_at: twoDaysAgo,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      }
    ];
  }
}
