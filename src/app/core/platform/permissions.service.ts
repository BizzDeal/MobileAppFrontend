import { Injectable, inject } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { PushNotifications } from '@capacitor/push-notifications';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { ModalController } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { PermissionModalComponent } from '../../shared/components/permission-modal/permission-modal.component';

export type PermissionType = 'camera' | 'microphone' | 'contacts' | 'notifications' | 'storage';
export type PermissionStatusResult = 'granted' | 'denied' | 'prompt' | 'limited';

const NativeContacts = registerPlugin<any>('Contacts');

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private readonly modalCtrl = inject(ModalController);

  /**
   * Checks current permission status for a given permission type
   */
  async checkPermission(type: PermissionType): Promise<PermissionStatusResult> {
    try {
      switch (type) {
        case 'camera': {
          if (Capacitor.isNativePlatform()) {
            const status = await BarcodeScanner.checkPermissions();
            return this.normalizeStatus(status.camera);
          } else {
            if (navigator.permissions && navigator.permissions.query) {
              const res = await navigator.permissions.query({ name: 'camera' as any });
              return this.normalizeStatus(res.state);
            }
            return 'prompt';
          }
        }

        case 'microphone': {
          if (navigator.permissions && navigator.permissions.query) {
            try {
              const res = await navigator.permissions.query({ name: 'microphone' as any });
              return this.normalizeStatus(res.state);
            } catch {
              return 'prompt';
            }
          }
          return 'prompt';
        }

        case 'contacts': {
          if (Capacitor.isNativePlatform()) {
            try {
              if (NativeContacts.checkPermissions) {
                const status = await NativeContacts.checkPermissions();
                return this.normalizeStatus(status.contacts || status.granted);
              }
            } catch {}
          }
          return 'prompt';
        }

        case 'notifications': {
          if (Capacitor.isNativePlatform()) {
            const status = await PushNotifications.checkPermissions();
            return this.normalizeStatus(status.receive);
          } else {
            if (typeof Notification !== 'undefined') {
              if (Notification.permission === 'granted') return 'granted';
              if (Notification.permission === 'denied') return 'denied';
              return 'prompt';
            }
            return 'granted';
          }
        }

        case 'storage': {
          if (Capacitor.isNativePlatform()) {
            const status = await Filesystem.checkPermissions();
            return this.normalizeStatus(status.publicStorage);
          }
          return 'granted';
        }

        default:
          return 'granted';
      }
    } catch (err) {
      console.warn(`[PermissionsService] Error checking permission for ${type}:`, err);
      return 'prompt';
    }
  }

  /**
   * Requests OS permission for a given type
   */
  async requestPermission(type: PermissionType): Promise<PermissionStatusResult> {
    try {
      switch (type) {
        case 'camera': {
          if (Capacitor.isNativePlatform()) {
            const status = await BarcodeScanner.requestPermissions();
            return this.normalizeStatus(status.camera);
          } else {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              stream.getTracks().forEach(track => track.stop());
              return 'granted';
            } catch {
              return 'denied';
            }
          }
        }

        case 'microphone': {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return 'granted';
          } catch {
            return 'denied';
          }
        }

        case 'contacts': {
          if (Capacitor.isNativePlatform()) {
            try {
              if (NativeContacts.requestPermissions) {
                const status = await NativeContacts.requestPermissions();
                return this.normalizeStatus(status.contacts || status.granted);
              }
            } catch {}
          }
          return 'prompt';
        }

        case 'notifications': {
          if (Capacitor.isNativePlatform()) {
            const status = await PushNotifications.requestPermissions();
            return this.normalizeStatus(status.receive);
          } else {
            if (typeof Notification !== 'undefined') {
              const res = await Notification.requestPermission();
              return this.normalizeStatus(res);
            }
            return 'granted';
          }
        }

        case 'storage': {
          if (Capacitor.isNativePlatform()) {
            const status = await Filesystem.requestPermissions();
            return this.normalizeStatus(status.publicStorage);
          }
          return 'granted';
        }

        default:
          return 'granted';
      }
    } catch (err) {
      console.error(`[PermissionsService] Error requesting permission for ${type}:`, err);
      return 'denied';
    }
  }

  /**
   * Just-in-Time (JIT) helper: Checks permission and presents rationale or settings modal if needed.
   * Returns true if permission is granted, false if rejected or denied.
   */
  async ensurePermission(type: PermissionType, customRationale?: string): Promise<boolean> {
    const currentStatus = await this.checkPermission(type);

    if (currentStatus === 'granted' || currentStatus === 'limited') {
      return true;
    }

    if (currentStatus === 'denied') {
      await this.presentPermissionModal(type, true, customRationale);
      return false;
    }

    // Status is 'prompt' -> Show JIT rationale modal first
    const action = await this.presentPermissionModal(type, false, customRationale);

    if (action === 'grant') {
      const newStatus = await this.requestPermission(type);
      if (newStatus === 'granted' || newStatus === 'limited') {
        return true;
      }
      if (newStatus === 'denied') {
        // Now denied by user -> show Settings modal
        await this.presentPermissionModal(type, true, customRationale);
      }
    }

    return false;
  }

  /**
   * Presents the permission modal dialog
   */
  private async presentPermissionModal(
    permissionType: PermissionType,
    isDenied: boolean,
    customRationale?: string
  ): Promise<'grant' | 'open_settings' | 'cancel'> {
    const modal = await this.modalCtrl.create({
      component: PermissionModalComponent,
      componentProps: {
        permissionType,
        isDenied,
        customRationale
      },
      cssClass: 'permission-modal-dialog'
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    const action = data?.action || 'cancel';

    if (action === 'open_settings') {
      await this.openAppSettings();
    }

    return action;
  }

  /**
   * Directs the user to system app settings when permission is permanently denied
   */
  async openAppSettings(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          if ((App as any).openUrl) {
            await (App as any).openUrl({ url: 'app-settings:' });
          } else {
            window.open('app-settings:', '_system');
          }
        } catch {
          window.open('app-settings:', '_system');
        }
      } else {
        alert('Please allow permissions in your browser address bar settings (click lock icon next to URL) and reload.');
      }
    } catch (err) {
      console.error('[PermissionsService] Failed to open app settings:', err);
    }
  }

  /**
   * Deprecated startup call maintained for backwards compatibility (no-op or minimal check)
   */
  async requestStartupPermissions(): Promise<void> {
    // Purposefully no-op to prevent startup permission fatigue
    console.log('[PermissionsService] Startup permission prompts deferred to Just-in-Time intent.');
  }

  private normalizeStatus(status: any): PermissionStatusResult {
    if (!status) return 'prompt';
    const s = String(status).toLowerCase();
    if (s === 'granted') return 'granted';
    if (s === 'limited') return 'limited';
    if (s === 'denied' || s === 'never_ask_again') return 'denied';
    return 'prompt';
  }
}
