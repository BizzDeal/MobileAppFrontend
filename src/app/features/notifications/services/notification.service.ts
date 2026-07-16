import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
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
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly apiUrl = environment.apiUrl;

  private readonly _notifications = signal<NotificationDTO[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private pushListenersSetUp = false;

  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly unreadCount = computed(() => {
    return this._notifications().filter(n => !n.is_read).length;
  });

  constructor() {
    effect(() => {
      const user = this.authSession.currentUser();
      if (user) {
        untracked(() => {
          this.getNotifications().subscribe({
            error: (err) => console.error('Notifications load encountered error:', err),
          });
        });
      } else {
        this._notifications.set([]);
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

  async initPushNotificationsOnStartup(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
        await this.setupPushListeners();

        console.log('[Notifications] Requesting push notification permissions on app load...');
        const permResult = await PushNotifications.requestPermissions();
        console.log('[Notifications] Permission result:', permResult.receive);

        if (permResult.receive === 'granted') {
          await PushNotifications.register();
          console.log('[Notifications] Called PushNotifications.register() on startup.');
        } else {
          console.warn('[Notifications] Push notification permission not granted by user.');
        }
      } else {
        await this.setupPushListeners();
      }
    } catch (err) {
      console.error('[Notifications] Error in initPushNotificationsOnStartup:', err);
    }
  }

  async registerDeviceOnStartup(): Promise<void> {
    return this.initPushNotificationsOnStartup();
  }

  async registerDeviceOnLogin(): Promise<void> {
    try {
      if (!this.authSession.isAuthenticated()) {
        return;
      }

      const existingToken = await this.storage.get('bizzdeal_fcm_token');
      if (existingToken && existingToken.startsWith('BIZZDEAL_')) {
        await this.storage.remove('bizzdeal_fcm_token');
        await this.storage.remove('bizzdeal_device_registered_v1');
      }

      const platform = Capacitor.getPlatform().toUpperCase();
      const deviceType: 'ANDROID' | 'IOS' | 'WEB' = platform === 'ANDROID' ? 'ANDROID' : platform === 'IOS' ? 'IOS' : 'WEB';

      let fcmToken: string | null = await this.storage.get('bizzdeal_fcm_token');
      if (!fcmToken || fcmToken.startsWith('BIZZDEAL_')) {
        fcmToken = await this.acquireRealFcmToken();
      }

      if (!fcmToken || fcmToken.startsWith('BIZZDEAL_')) {
        console.warn('[Notifications] Could not obtain real FCM token from Firebase SDK. Aborting device registration.');
        return;
      }

      await this.storage.set('bizzdeal_fcm_token', fcmToken);
      this.sendDeviceTokenToServer(fcmToken, deviceType);
      await this.setupPushListeners();
    } catch (err) {
      console.error('[Notifications] Error inside registerDeviceOnLogin:', err);
    }
  }

  private async acquireRealFcmToken(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
        try {
          await this.setupPushListeners();
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive !== 'granted') {
            permStatus = await PushNotifications.requestPermissions();
          }
          if (permStatus.receive !== 'granted') {
            console.warn('[Notifications] Push notification permission denied by user on native device.');
            return null;
          }

          const existingStored = await this.storage.get('bizzdeal_fcm_token');
          if (existingStored && !existingStored.startsWith('BIZZDEAL_')) {
            PushNotifications.register();
            return existingStored;
          }

          return await new Promise<string | null>((resolve) => {
            let resolved = false;

            const tempSub = PushNotifications.addListener('registration', (token) => {
              if (!resolved) {
                resolved = true;
                tempSub.then(sub => sub.remove()).catch(() => {});
                resolve(token.value);
              }
            });

            const tempErr = PushNotifications.addListener('registrationError', async (err) => {
              if (!resolved) {
                resolved = true;
                tempErr.then(sub => sub.remove()).catch(() => {});
                console.error('[Notifications] Native PushNotifications.register failed:', err);
                const fallbackToken = await this.acquireWebFcmToken();
                resolve(fallbackToken);
              }
            });

            try {
              PushNotifications.register();
            } catch (regErr) {
              if (!resolved) {
                resolved = true;
                console.error('[Notifications] Synchronous register exception:', regErr);
                resolve(this.acquireWebFcmToken());
              }
            }

            setTimeout(async () => {
              if (!resolved) {
                resolved = true;
                console.warn('[Notifications] Native PushNotifications.register timed out. Checking storage or web.');
                const stored = await this.storage.get('bizzdeal_fcm_token');
                if (stored && !stored.startsWith('BIZZDEAL_')) {
                  resolve(stored);
                } else {
                  const fallbackToken = await this.acquireWebFcmToken();
                  resolve(fallbackToken);
                }
              }
            }, 8000);
          });
        } catch (nativeErr) {
          console.error('[Notifications] Exception in native PushNotifications flow:', nativeErr);
          return await this.acquireWebFcmToken();
        }
      } else {
        return await this.acquireWebFcmToken();
      }
    } catch (err) {
      console.error('[Notifications] Error acquiring native FCM token:', err);
      return await this.acquireWebFcmToken();
    }
  }

  private async acquireWebFcmToken(): Promise<string | null> {
    try {
      const supported = await isSupported();
      if (!supported) {
        console.warn('[Notifications] Firebase messaging is not supported in this browser/environment.');
        return null;
      }

      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('[Notifications] Notification permission denied on web.');
          return null;
        }
      }

      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: (environment.firebaseConfig as any)?.vapidKey
      });

      if (token) {
        console.log('[Notifications] Acquired real web FCM token from Firebase SDK.');
        return token;
      } else {
        console.warn('[Notifications] No registration token available. Request permission to generate one.');
        return null;
      }
    } catch (err) {
      console.error('[Notifications] Error acquiring web FCM token:', err);
      return null;
    }
  }

  private async setupPushListeners(): Promise<void> {
    if (this.pushListenersSetUp) {
      return;
    }
    this.pushListenersSetUp = true;

    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
      try {
        await PushNotifications.createChannel({
          id: 'bizzdeal_notifications',
          name: 'BizzDeal Notifications',
          description: 'High priority push notifications from BizzDeal',
          importance: 5,
          visibility: 1,
          sound: 'default',
          vibration: true,
        });
        console.log('[Notifications] Created Android notification channel bizzdeal_notifications.');
      } catch (channelErr) {
        console.error('[Notifications] Error creating Android notification channel:', channelErr);
      }

      // Permanent registration listener for when app starts up
      await PushNotifications.addListener('registration', async (token) => {
        console.log('[Notifications] Native push registration successful inside permanent listener:', token.value);
        await this.storage.set('bizzdeal_fcm_token', token.value);
        if (this.authSession.isAuthenticated()) {
          const platform = Capacitor.getPlatform().toUpperCase();
          const deviceType: 'ANDROID' | 'IOS' | 'WEB' = platform === 'ANDROID' ? 'ANDROID' : platform === 'IOS' ? 'IOS' : 'WEB';
          this.sendDeviceTokenToServer(token.value, deviceType);
        }
      });

      await PushNotifications.addListener('registrationError', (err) => {
        console.error('[Notifications] Native push registration error:', err);
      });

      // Foreground: when app is open and a push arrives
      await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('[Notifications] Push received in foreground:', notification);

        this.getNotifications().subscribe({
          error: (err) => console.error('[Notifications] Failed to refresh notifications after push:', err),
        });

        try {
          // Schedule as a native OS system tray notification so all notifications are system-level
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Math.floor(Math.random() * 2147483647),
                title: notification.title || 'New Notification',
                body: notification.body || 'You have received a new notification',
                channelId: 'bizzdeal_notifications',
                extra: notification.data || {}
              }
            ]
          });
          console.log('[Notifications] Scheduled foreground notification to native system tray.');
        } catch (localErr) {
          console.error('[Notifications] Error scheduling foreground local notification:', localErr);
        }
      });

      // Background/Killed: when user taps on a push notification in tray
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Notifications] Push notification tapped:', action);

        this.getNotifications().subscribe({
          error: (err) => console.error('[Notifications] Failed to refresh notifications after tap:', err),
        });
        this.router.navigate(['/notifications']);
      });

      // When user taps on a local system notification scheduled while app was in foreground
      await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('[Notifications] Local system notification tapped:', action);

        this.getNotifications().subscribe({
          error: (err) => console.error('[Notifications] Failed to refresh notifications after local tap:', err),
        });
        this.router.navigate(['/notifications']);
      });

      console.log('[Notifications] Permanent push notification listeners registered for foreground and background.');
    }
  }

  private sendDeviceTokenToServer(fcmToken: string, deviceType: 'ANDROID' | 'IOS' | 'WEB'): void {
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

        this.http.post(`${this.apiUrl}/notifications/devices`, {
          fcm_token: fcmToken,
          device_type: deviceType,
          device_name: `${deviceType} Device`
        }).subscribe({
          next: () => {
            console.log('[Notifications] Device successfully registered for push notifications on login.');
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
            console.log('[Notifications] Device successfully registered for push notifications on login.');
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
  }
}
