import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthSessionService } from '../../../../core/services/auth-session.service';

@Component({
  selector: 'app-admin-logout-button',
  template: `
    <ion-button fill="clear" color="light" (click)="confirmLogout()" aria-label="Logout" class="admin-logout-btn">
      <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
    </ion-button>
  `,
  styles: [`
    .admin-logout-btn {
      --padding-start: 8px;
      --padding-end: 8px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AdminLogoutButtonComponent {
  private readonly alertController = inject(AlertController);
  private readonly authSession = inject(AuthSessionService);

  constructor() {
    addIcons({ logOutOutline });
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out of the admin panel?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Logout',
          role: 'confirm',
          cssClass: 'danger-text',
          handler: () => {
            this.authSession.logout(true);
          }
        }
      ]
    });

    await alert.present();
  }
}
