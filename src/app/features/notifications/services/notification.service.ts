import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { NotificationDTO, NotificationType } from '../models/notification.model';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly authSession = inject(AuthSessionService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _notifications = signal<NotificationDTO[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly unreadCount = computed(() => {
    return this._notifications().filter(n => !n.is_read).length;
  });

  constructor() {
    this.getNotifications().subscribe({
      error: (err) => console.error('Initial notifications load encountered error:', err),
    });

    effect(() => {
      const user = this.authSession.currentUser();
      if (user) {
        untracked(() => {
          this.registerDeviceOnStartup();
        });
      }
    });
  }

  getNotifications(): Observable<NotificationDTO[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<any>(`${this.apiUrl}/notifications`).pipe(
      map((res) => {
        const rawList: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const list: NotificationDTO[] = rawList.map((n) => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type || NotificationType.GENERAL,
          data: n.data || null,
          is_read: n.is_read ?? false,
          read_at: n.read_at ? new Date(n.read_at) : null,
          created_at: n.created_at ? new Date(n.created_at) : new Date(),
          updated_at: n.updated_at ? new Date(n.updated_at) : new Date(),
        }));
        return list;
      }),
      tap({
        next: (list) => {
          this._notifications.set(list);
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to retrieve notifications from server';
          this._error.set(errMsg);
          this._loading.set(false);
        }
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<any>(`${this.apiUrl}/notifications/${id}/read`, {}).pipe(
      map(() => void 0),
      tap(() => {
        this._notifications.update(notes => 
          notes.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date() } : n)
        );
      }),
      catchError((err) => {
        const errMsg = err?.error?.message || err?.message || 'Failed to mark notification as read via server API';
        this._error.set(errMsg);
        return throwError(() => err);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    const unread = this._notifications().filter(n => !n.is_read);
    if (unread.length === 0) {
      return new Observable(obs => { obs.next(void 0); obs.complete(); });
    }
    this._notifications.update(notes => 
      notes.map(n => ({ ...n, is_read: true, read_at: new Date() }))
    );
    unread.forEach(n => {
      this.http.put(`${this.apiUrl}/notifications/${n.id}/read`, {}).subscribe({
        error: (err) => console.error(`Failed to mark notification ${n.id} as read on server:`, err)
      });
    });
    return new Observable(obs => { obs.next(void 0); obs.complete(); });
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/notifications/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        this._notifications.update(notes => notes.filter(n => n.id !== id));
      }),
      catchError((err) => {
        const errMsg = err?.error?.message || err?.message || 'Failed to delete notification via server API';
        this._error.set(errMsg);
        return throwError(() => err);
      })
    );
  }

  async registerDeviceOnStartup(): Promise<void> {
    try {
      if (!this.authSession.isAuthenticated()) {
        return;
      }

      // Check if device is already registered locally
      const isRegistered = await this.storage.get('bizzdeal_device_registered_v1');
      if (isRegistered === 'true') {
        console.log('[Notifications] Device is already registered for notifications. Ignoring duplicate registration.');
        return;
      }

      // Determine platform device type
      const platform = Capacitor.getPlatform().toUpperCase();
      const deviceType: 'ANDROID' | 'IOS' | 'WEB' = platform === 'ANDROID' ? 'ANDROID' : platform === 'IOS' ? 'IOS' : 'WEB';

      // Obtain or generate consistent device FCM registration token
      let fcmToken = await this.storage.get('bizzdeal_fcm_token');
      if (!fcmToken) {
        fcmToken = `BIZZDEAL_${deviceType}_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
        await this.storage.set('bizzdeal_fcm_token', fcmToken);
      }

      // Check if server already has this exact device token registered
      this.http.get<any>(`${this.apiUrl}/notifications/devices`).pipe(
        catchError((err) => {
          console.warn('[Notifications] Could not fetch remote devices list, proceeding with registration check:', err);
          return throwError(() => err);
        })
      ).subscribe({
        next: (res) => {
          const rawDevices: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
          const alreadyOnServer = rawDevices.some((d: any) => d.fcm_token === fcmToken || (typeof d === 'string' && d === fcmToken));
          
          if (alreadyOnServer) {
            console.log('[Notifications] Device token is already registered on server. Ignoring.');
            this.storage.set('bizzdeal_device_registered_v1', 'true');
            return;
          }

          // Register device on backend API
          this.http.post(`${this.apiUrl}/notifications/devices`, {
            fcm_token: fcmToken,
            device_type: deviceType,
            device_name: `${deviceType} Device`
          }).subscribe({
            next: () => {
              console.log('[Notifications] Device successfully registered for push notifications.');
              this.storage.set('bizzdeal_device_registered_v1', 'true');
            },
            error: (err) => {
              if (err.status === 409 || err.status === 400 || (err?.error?.message && err.error.message.includes('already'))) {
                console.log('[Notifications] Device is already registered on server (409/duplicate). Ignoring.');
                this.storage.set('bizzdeal_device_registered_v1', 'true');
              } else {
                console.error('[Notifications] Failed to register device on server:', err);
              }
            }
          });
        },
        error: () => {
          this.http.post(`${this.apiUrl}/notifications/devices`, {
            fcm_token: fcmToken,
            device_type: deviceType,
            device_name: `${deviceType} Device`
          }).subscribe({
            next: () => {
              console.log('[Notifications] Device successfully registered for push notifications.');
              this.storage.set('bizzdeal_device_registered_v1', 'true');
            },
            error: (err) => {
              if (err.status === 409 || err.status === 400 || (err?.error?.message && err.error.message.includes('already'))) {
                console.log('[Notifications] Device is already registered on server (409/duplicate). Ignoring.');
                this.storage.set('bizzdeal_device_registered_v1', 'true');
              } else {
                console.error('[Notifications] Failed to register device on server:', err);
              }
            }
          });
        }
      });
    } catch (err) {
      console.error('[Notifications] Error inside registerDeviceOnStartup:', err);
    }
  }
}
