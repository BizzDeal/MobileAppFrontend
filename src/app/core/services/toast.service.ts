import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastController = inject(ToastController);

  async showSuccess(message: string, duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'top'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Toast.show({
        text: message,
        duration: duration > 2000 ? 'long' : 'short',
        position: position === 'middle' ? 'center' : position
      });
    } else {
      const toast = await this.toastController.create({
        message,
        duration,
        color: 'success',
        position,
        icon: 'checkmark-circle-outline'
      });
      await toast.present();
    }
  }

  async showInfo(message: string, duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'top'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Toast.show({
        text: message,
        duration: duration > 2000 ? 'long' : 'short',
        position: position === 'middle' ? 'center' : position
      });
    } else {
      const toast = await this.toastController.create({
        message,
        duration,
        color: 'medium',
        position,
        icon: 'information-circle-outline'
      });
      await toast.present();
    }
  }

  async showError(message: string, duration: number = 4000, position: 'top' | 'bottom' | 'middle' = 'top'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Toast.show({
        text: message,
        duration: duration > 2000 ? 'long' : 'short',
        position: position === 'middle' ? 'center' : position
      });
    } else {
      const toast = await this.toastController.create({
        message,
        duration,
        color: 'danger',
        position,
        icon: 'alert-circle-outline'
      });
      await toast.present();
    }
  }
}
