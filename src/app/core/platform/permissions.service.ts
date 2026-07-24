import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';

export interface StartupPermissionsPlugin {
  requestAll(): Promise<{ requested: boolean }>;
}

const StartupPermissions = registerPlugin<StartupPermissionsPlugin>('StartupPermissions');

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  /**
   * Requests required permissions at app startup:
   * - Camera
   * - Contacts
   * - Recording (Audio/Microphone)
   * - Reading SMS
   * - Storage
   */
  async requestStartupPermissions(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const fsStatus = await Filesystem.checkPermissions();
          if (fsStatus.publicStorage === 'prompt' || fsStatus.publicStorage === 'prompt-with-rationale') {
            await Filesystem.requestPermissions();
          }
        } catch (err) {
          console.warn('Filesystem permissions check/request failed:', err);
        }
      }
    } catch (error) {
      console.error('Error requesting startup permissions:', error);
    }
  }
}
