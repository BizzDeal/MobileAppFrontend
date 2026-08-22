import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Device } from '@capacitor/device';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, shareReplay, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { NotificationDTO, NotificationType } from '../models/notification.model';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { extractFriendlyErrorMessage } from '../../../core/utils/error.utils';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  private readonly apiUrl = environment.apiUrl;

  private readonly _notifications = signal<NotificationDTO[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal<number>(1);
  private readonly _limit = signal<number>(20);
  private readonly _hasMore = signal<boolean>(true);
  private pushListenersSetUp = false;
  private inFlightNotifications$: Observable<NotificationDTO[]> | null = null;

  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();

  readonly unreadCount = computed(() => {
    return this._notifications().filter(n => !n.is_read).length;
  });

  constructor() {
    effect(() => {
      const user = this.authSession.currentUser();
      if (user) {
        untracked(() => {
          if (this._notifications().length === 0) {
            this.getNotifications().subscribe({
              error: (err) => console.error('Notifications load encountered error:', err),
            });
          }
        });
      } else {
        this._notifications.set([]);
      }
    });
  }

  getNotifications(page = 1, limit = 20, append = false, search = ''): Observable<NotificationDTO[]> {
    if (page === 1 && !append && !search && this.inFlightNotifications$) {
      return this.inFlightNotifications$;
    }

    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    const request$ = this.http.get<any>(`${this.apiUrl}/notifications`, { params }).pipe(
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
        return { list, meta: res?.meta };
      }),
      tap({
        next: ({ list, meta }) => {
          if (append) {
            this._notifications.update(prev => [...prev, ...list]);
          } else {
            this._notifications.set(list);
          }
          
          if (meta) {
            this._page.set(meta.currentPage);
            this._limit.set(meta.itemsPerPage);
            this._hasMore.set(meta.currentPage < meta.totalPages);
          } else {
            this._page.set(page);
            this._hasMore.set(list.length === limit);
          }
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = extractFriendlyErrorMessage(err, 'Failed to retrieve notifications.');
          this._error.set(errMsg);
          this._loading.set(false);
        }
      }),
      map(({ list }) => list),
      catchError((err) => {
        return throwError(() => err);
      }),
      finalize(() => {
        if (page === 1 && !append && !search) {
          this.inFlightNotifications$ = null;
        }
      }),
      shareReplay(1)
    );

    if (page === 1 && !append && !search) {
      this.inFlightNotifications$ = request$;
    }

    return request$;
  }

  loadMoreNotifications(search = ''): Observable<NotificationDTO[]> | null {
    if (this._hasMore() && !this._loading()) {
      return this.getNotifications(this._page() + 1, this._limit(), true, search);
    }
    return null;
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
        const errMsg = extractFriendlyErrorMessage(err, 'Failed to mark notification as read.');
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
        const errMsg = extractFriendlyErrorMessage(err, 'Failed to delete notification.');
        this._error.set(errMsg);
        return throwError(() => err);
      })
    );
  }

  async initPushNotificationsOnStartup(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
        await this.setupPushListeners();

        console.log('[Notifications] Checking push notification permissions on app load...');
        let permStatus = await PushNotifications.checkPermissions();
        console.log('[Notifications] Initial permission status:', permStatus.receive);

        if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
          permStatus = await PushNotifications.requestPermissions();
          console.log('[Notifications] Requested permission status:', permStatus.receive);
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
          console.log('[Notifications] Called PushNotifications.register() on startup.');
        } else {
          console.warn('[Notifications] Push notification permission not granted or denied by user.');
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
          if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
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

      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'denied') {
          console.warn('[Notifications] Notification permission explicitly denied on web.');
          return null;
        }
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('[Notifications] Notification permission denied on web.');
            return null;
          }
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
        this.handleNotificationTap(action);
      });

      // When user taps on a local system notification scheduled while app was in foreground
      await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        this.handleNotificationTap(action);
      });

      console.log('[Notifications] Permanent push notification listeners registered for foreground and background.');
    }
  }

  private handleNotificationTap(action: any): void {
    console.log('[Notifications] Notification tapped:', action);

    this.getNotifications().subscribe({
      error: (err) => console.error('[Notifications] Failed to refresh notifications after tap:', err),
    });

    const data = action.notification?.data || action.notification?.extra || {};
    
    // Sometimes push payloads arrive as strings from FCM or APNs.
    // Try to parse 'data' string to object if necessary, or check if type is 'CHAT'.
    // If backend sends it as type: 'CHAT' inside data:
    if (data.type === 'CHAT' && data.conversation_id) {
      const role = this.authSession.userRole();
      if (role === 'ADMIN') {
        this.router.navigate(['/admin/chat'], { queryParams: { conversation_id: data.conversation_id } });
      } else if (role === 'MEMBER') {
        this.router.navigate(['/home'], { queryParams: { tab: 'chat', conversation_id: data.conversation_id } });
      } else {
        this.router.navigate(['/home']);
      }
      return;
    }

    // Default routing
    const role = this.authSession.userRole();
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/notifications']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  private async sendDeviceTokenToServer(fcmToken: string, deviceType: 'ANDROID' | 'IOS' | 'WEB'): Promise<void> {
    let deviceName = `${deviceType} Device`;
    let deviceModel: string | null = null;
    let operatingSystem: string | null = null;
    let osVersion: string | null = null;
    let manufacturer: string | null = null;
    let isVirtual: boolean | null = null;
    let deviceIdentifier: string | null = null;

    try {
      const idInfo = await Device.getId();
      if (idInfo && idInfo.identifier) {
        deviceIdentifier = idInfo.identifier;
      }
    } catch (e) {
      console.warn('[Notifications] Could not fetch native device ID:', e);
    }

    try {
      const info = await Device.getInfo();
      deviceName = info.name || info.model || deviceName;
      deviceModel = info.model || null;
      operatingSystem = info.operatingSystem || null;
      osVersion = info.osVersion || null;
      manufacturer = info.manufacturer || null;
      isVirtual = info.isVirtual;
    } catch (e) {
      console.warn('[Notifications] Could not fetch native device info:', e);
    }

    const payload = {
      fcm_token: fcmToken,
      device_type: deviceType,
      device_name: deviceName,
      device_model: deviceModel,
      operating_system: operatingSystem,
      os_version: osVersion,
      manufacturer: manufacturer,
      is_virtual: isVirtual,
      device_identifier: deviceIdentifier
    };

    this.http.get<any>(`${this.apiUrl}/notifications/devices`).pipe(
      catchError((err) => {
        console.warn('[Notifications] Could not fetch remote devices list, proceeding with registration check:', err);
        return throwError(() => err);
      })
    ).subscribe({
      next: (res) => {
        const rawDevices: any[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const deviceOnServer = rawDevices.find((d: any) => 
          (deviceIdentifier && typeof d !== 'string' && d.device_identifier === deviceIdentifier) || 
          (typeof d !== 'string' && d.fcm_token === fcmToken) || 
          (typeof d === 'string' && d === fcmToken)
        );
        
        const deviceTokenMatch = typeof deviceOnServer === 'string' ? deviceOnServer === fcmToken : deviceOnServer?.fcm_token === fcmToken;
        if (deviceOnServer && deviceTokenMatch) {
          console.log('[Notifications] Device token is already registered on server. Ignoring.');
          this.storage.set('bizzdeal_device_registered_v1', 'true');
          return;
        }

        this.http.post(`${this.apiUrl}/notifications/devices`, payload).subscribe({
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
        this.http.post(`${this.apiUrl}/notifications/devices`, payload).subscribe({
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

  unregisterDeviceByToken(fcmToken: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/devices/token/${fcmToken}`);
  }

  getUserDevices(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/notifications/devices`).pipe(
      map(res => Array.isArray(res) ? res : res?.data || res?.items || [])
    );
  }

  toggleDeviceStatus(deviceId: string, isActive: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/notifications/devices/${deviceId}/status`, { is_active: isActive });
  }

  deleteDevice(deviceId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/notifications/devices/${deviceId}`);
  }
}

