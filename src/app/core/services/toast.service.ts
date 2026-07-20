import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastController = inject(ToastController);

  async showSuccess(message: string, duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'success',
      position: 'bottom',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  async showError(message: string, duration: number = 4000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'danger',
      position: 'bottom',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }
}
