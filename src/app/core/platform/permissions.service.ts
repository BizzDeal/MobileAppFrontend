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
        // On native platforms (Android/iOS), request via custom plugin and capacitor filesystem
        try {
          await StartupPermissions.requestAll();
        } catch (err) {
          console.warn('StartupPermissions native request failed or not available:', err);
        }

        try {
          await Filesystem.requestPermissions();
        } catch (err) {
          console.warn('Filesystem permissions request failed:', err);
        }
      } else {
        // On Web browser or non-native environment, request camera, mic, and filesystem permissions
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            stream.getTracks().forEach((track) => track.stop());
          }
        } catch (err) {
          console.log('Web media (camera/recording) permissions not granted initially.', err);
        }

        try {
          await Filesystem.requestPermissions();
        } catch (err) {
          console.log('Web filesystem permissions not granted or supported initially.', err);
        }
      }
    } catch (error) {
      console.error('Error requesting startup permissions:', error);
    }
  }
}
