import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({
  providedIn: 'root',
})
export class StatusBarService {
  /**
   * Initializes the native device status bar.
   * Sets the text style to black (Style.Light) across the app,
   * and sets the background color on Android to match the application's light theme.
   */
  async initialize(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        document.body.classList.add('capacitor-native');
        await StatusBar.setStyle({ style: Style.Light });

        if (Capacitor.getPlatform() === 'android') {
          document.body.classList.add('plt-android');
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setBackgroundColor({ color: '#00000000' });
        }
      } catch (error) {
        console.error('Failed to initialize status bar:', error);
      }
    }
  }
}
