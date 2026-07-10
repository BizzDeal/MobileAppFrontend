import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AdminNotification, NotificationType, NotificationAudience, AdminNotificationFilters } from '../models/admin-notification.model';

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationsService {
  private mockNotifications: AdminNotification[] = [
    {
      id: 'n1',
      title: 'Welcome to BizzDeal!',
      message: 'Thank you for joining our platform.',
      type: NotificationType.GENERAL,
      audience: NotificationAudience.ALL_MEMBERS,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    },
    {
      id: 'n2',
      title: 'New Offer Available',
      message: 'Check out the new summer discount!',
      type: NotificationType.OFFER,
      audience: NotificationAudience.ALL_CUSTOMERS,
      created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 'n3',
      title: 'Your Voucher is Ready',
      message: 'You can now redeem your 50% off voucher.',
      type: NotificationType.VOUCHER,
      audience: NotificationAudience.SINGLE_USER,
      target_ids: ['user-123'],
      created_at: new Date().toISOString() // today
    }
  ];

  constructor() {}

  // List Notifications
  getAllNotifications(filters?: AdminNotificationFilters): Observable<AdminNotification[]> {
    let results = [...this.mockNotifications];
    
    if (filters) {
      if (filters.type) {
        results = results.filter(n => n.type === filters.type);
      }
      if (filters.audience) {
        results = results.filter(n => n.audience === filters.audience);
      }
    }

    // Sort by created_at desc
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return of(results).pipe(delay(800));
  }

  // Create Notification & Dispatch FCM Push (Single User)
  sendToUser(userId: string, payload: Partial<AdminNotification>): Observable<{ success: boolean, notification: AdminNotification }> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }
    
    const newNotification: AdminNotification = {
      id: 'n' + Math.random().toString(36).substring(2, 9),
      title: payload.title || '',
      message: payload.message || '',
      type: payload.type || NotificationType.GENERAL,
      audience: NotificationAudience.SINGLE_USER,
      target_ids: [userId],
      data: payload.data,
      created_at: new Date().toISOString()
    };
    
    this.mockNotifications.unshift(newNotification);
    return of({ success: true, notification: newNotification }).pipe(delay(1000));
  }

  // Send Push Notification to Multiple Users
  sendBulk(userIds: string[], payload: Partial<AdminNotification>): Observable<{ success: boolean, notification: AdminNotification }> {
    if (!userIds || userIds.length === 0) {
      return throwError(() => new Error('User IDs are required'));
    }
    
    const newNotification: AdminNotification = {
      id: 'n' + Math.random().toString(36).substring(2, 9),
      title: payload.title || '',
      message: payload.message || '',
      type: payload.type || NotificationType.GENERAL,
      audience: NotificationAudience.BULK_USERS,
      target_ids: userIds,
      data: payload.data,
      created_at: new Date().toISOString()
    };
    
    this.mockNotifications.unshift(newNotification);
    return of({ success: true, notification: newNotification }).pipe(delay(1000));
  }

  // Broadcast Push Notification to All Members
  broadcastToMembers(payload: Partial<AdminNotification>): Observable<{ success: boolean, notification: AdminNotification }> {
    const newNotification: AdminNotification = {
      id: 'n' + Math.random().toString(36).substring(2, 9),
      title: payload.title || '',
      message: payload.message || '',
      type: payload.type || NotificationType.GENERAL,
      audience: NotificationAudience.ALL_MEMBERS,
      data: payload.data,
      created_at: new Date().toISOString()
    };
    
    this.mockNotifications.unshift(newNotification);
    return of({ success: true, notification: newNotification }).pipe(delay(1000));
  }

  // Broadcast Push Notification to All Customers
  broadcastToCustomers(payload: Partial<AdminNotification>): Observable<{ success: boolean, notification: AdminNotification }> {
    const newNotification: AdminNotification = {
      id: 'n' + Math.random().toString(36).substring(2, 9),
      title: payload.title || '',
      message: payload.message || '',
      type: payload.type || NotificationType.GENERAL,
      audience: NotificationAudience.ALL_CUSTOMERS,
      data: payload.data,
      created_at: new Date().toISOString()
    };
    
    this.mockNotifications.unshift(newNotification);
    return of({ success: true, notification: newNotification }).pipe(delay(1000));
  }

  // Delete Notification
  deleteNotification(id: string): Observable<{ success: boolean }> {
    const index = this.mockNotifications.findIndex(n => n.id === id);
    if (index === -1) {
      return throwError(() => new Error('Notification not found'));
    }
    
    this.mockNotifications.splice(index, 1);
    return of({ success: true }).pipe(delay(500));
  }
}
