import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AdminNotification,
  NotificationType,
  NotificationAudience,
  AdminNotificationFilters,
} from '../models/admin-notification.model';

@Injectable({
  providedIn: 'root',
})
export class AdminNotificationsService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  private readonly _notifications = signal<AdminNotification[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private http: HttpClient) {}

  // List Notifications from Backend
  getAllNotifications(filters?: AdminNotificationFilters): Observable<AdminNotification[]> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters?.type) {
      params = params.set('type', filters.type);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res: any) => {
        const rawList: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        let list: AdminNotification[] = rawList.map((n) => {
          let audience = n.data?.audience || NotificationAudience.SINGLE_USER;
          if (!n.data?.audience && n.data?.event === 'multiple_devices_registered') {
            audience = NotificationAudience.SINGLE_USER;
          }
          return {
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type || NotificationType.GENERAL,
            audience: audience,
            target_ids: n.data?.target_ids || [n.user_id],
            target_phones: n.data?.target_phones || [],
            data: n.data || undefined,
            created_at: n.created_at || new Date().toISOString(),
          };
        });

        if (filters?.audience) {
          list = list.filter((n) => n.audience === filters.audience);
        }

        this._notifications.set(list);
        this._loading.set(false);
        return list;
      }),
      catchError((err) => {
        console.error('Error fetching admin notifications:', err);
        this._loading.set(false);
        const errMsg =
          err?.error?.message || err?.message || 'Failed to fetch notifications';
        this._error.set(errMsg);
        return throwError(() => err);
      })
    );
  }

  // Create Notification & Dispatch FCM Push (Single User by Phone)
  sendToUser(
    phone: string,
    payload: Partial<AdminNotification>
  ): Observable<{ success: boolean; notification: AdminNotification }> {
    if (!phone) {
      return throwError(() => new Error('Phone number is required'));
    }

    const cleanPhone = phone.trim();
    const body = {
      phone: cleanPhone,
      title: payload.title || '',
      message: payload.message || '',
      type: payload.type || NotificationType.GENERAL,
      data: {
        ...(payload.data || {}),
        audience: NotificationAudience.SINGLE_USER,
        target_phones: [cleanPhone],
      },
    };

    return this.http.post<any>(this.apiUrl, body).pipe(
      map((n: any) => {
        const newNotification: AdminNotification = {
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || NotificationType.GENERAL,
          audience: n.data?.audience || NotificationAudience.SINGLE_USER,
          target_ids: n.data?.target_ids || [n.user_id],
          target_phones: n.data?.target_phones || [cleanPhone],
          data: n.data || undefined,
          created_at: n.created_at || new Date().toISOString(),
        };
        this._notifications.update((list) => [newNotification, ...list]);
        return { success: true, notification: newNotification };
      }),
      catchError((err) => {
        console.error('Error sending notification to user:', err);
        return throwError(() => err);
      })
    );
  }

  // Send Push Notification to Multiple Users (by Phone)
  sendBulk(
    phones: string[],
    payload: Partial<AdminNotification>
  ): Observable<{ success: boolean; notification: AdminNotification }> {
    if (!phones || phones.length === 0) {
      return throwError(() => new Error('Phone numbers are required'));
    }

    const cleanPhones = phones.map((p) => p.trim()).filter((p) => p.length > 0);
    const body = {
      phones: cleanPhones,
      title: payload.title || '',
      message: payload.message || '',
      type: payload.type || NotificationType.GENERAL,
      data: {
        ...(payload.data || {}),
        audience: NotificationAudience.BULK_USERS,
        target_phones: cleanPhones,
      },
    };

    return this.http.post<any>(`${this.apiUrl}/send-bulk`, body).pipe(
      map((res: any) => {
        const newNotification: AdminNotification = {
          id: 'bulk_' + Date.now(),
          title: payload.title || '',
          message: payload.message || '',
          type: payload.type || NotificationType.GENERAL,
          audience: NotificationAudience.BULK_USERS,
          target_ids: res.user_ids || [],
          target_phones: cleanPhones,
          data: {
            count: res.count,
            message: res.message,
            ...(payload.data || {}),
            audience: NotificationAudience.BULK_USERS,
            target_phones: cleanPhones,
          },
          created_at: new Date().toISOString(),
        };
        return { success: true, notification: newNotification };
      }),
      tap(() => this.getAllNotifications().subscribe()),
      catchError((err) => {
        console.error('Error sending bulk notifications:', err);
        return throwError(() => err);
      })
    );
  }

  // Broadcast Push Notification to All Members
  broadcastToMembers(
    payload: Partial<AdminNotification>
  ): Observable<{ success: boolean; notification: AdminNotification }> {
    const body = {
      title: payload.title || '',
      message: payload.message || '',
      type: payload.type || NotificationType.GENERAL,
      data: {
        ...(payload.data || {}),
        audience: NotificationAudience.ALL_MEMBERS,
      },
    };

    return this.http.post<any>(`${this.apiUrl}/members`, body).pipe(
      map((res: any) => {
        const newNotification: AdminNotification = {
          id: 'broadcast_members_' + Date.now(),
          title: payload.title || '',
          message: payload.message || '',
          type: payload.type || NotificationType.GENERAL,
          audience: NotificationAudience.ALL_MEMBERS,
          data: {
            count: res.count,
            message: res.message,
            ...(payload.data || {}),
            audience: NotificationAudience.ALL_MEMBERS,
          },
          created_at: new Date().toISOString(),
        };
        return { success: true, notification: newNotification };
      }),
      tap(() => this.getAllNotifications().subscribe()),
      catchError((err) => {
        console.error('Error broadcasting to members:', err);
        return throwError(() => err);
      })
    );
  }

  // Broadcast Push Notification to All Customers
  broadcastToCustomers(
    payload: Partial<AdminNotification>
  ): Observable<{ success: boolean; notification: AdminNotification }> {
    const body = {
      title: payload.title || '',
      message: payload.message || '',
      type: payload.type || NotificationType.GENERAL,
      data: {
        ...(payload.data || {}),
        audience: NotificationAudience.ALL_CUSTOMERS,
      },
    };

    return this.http.post<any>(`${this.apiUrl}/customers`, body).pipe(
      map((res: any) => {
        const newNotification: AdminNotification = {
          id: 'broadcast_customers_' + Date.now(),
          title: payload.title || '',
          message: payload.message || '',
          type: payload.type || NotificationType.GENERAL,
          audience: NotificationAudience.ALL_CUSTOMERS,
          data: {
            count: res.count,
            message: res.message,
            ...(payload.data || {}),
            audience: NotificationAudience.ALL_CUSTOMERS,
          },
          created_at: new Date().toISOString(),
        };
        return { success: true, notification: newNotification };
      }),
      tap(() => this.getAllNotifications().subscribe()),
      catchError((err) => {
        console.error('Error broadcasting to customers:', err);
        return throwError(() => err);
      })
    );
  }

  // Delete Notification
  deleteNotification(id: string): Observable<{ success: boolean }> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        this._notifications.update((list) => list.filter((n) => n.id !== id));
        return { success: true };
      }),
      catchError((err) => {
        console.error(`Error deleting notification ${id}:`, err);
        return throwError(() => err);
      })
    );
  }
}
