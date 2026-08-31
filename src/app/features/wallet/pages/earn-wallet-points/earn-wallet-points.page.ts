import { DecimalPipe } from '@angular/common';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  bagHandleOutline,
  cardOutline,
  sparklesOutline,
  trophyOutline,
  addCircleOutline
} from 'ionicons/icons';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-earn-wallet-points',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon
  ],
  templateUrl: './earn-wallet-points.page.html',
  styleUrl: './earn-wallet-points.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EarnWalletPointsPage {
  private readonly location = inject(Location);
  readonly walletService = inject(WalletService);
  private readonly alertController = inject(AlertController);

  readonly wallet = this.walletService.wallet;

  constructor() {
    addIcons({
      arrowBackOutline,
      bagHandleOutline,
      cardOutline,
      sparklesOutline,
      trophyOutline,
      addCircleOutline
    });
  }

  goBack(): void {
    this.location.back();
  }

  async openAddFundsPrompt(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Add Funds',
      subHeader: 'Enter amount to add to your cash wallet',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Amount (₹)',
          min: 1
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-cancel-btn'
        },
        {
          text: 'Proceed',
          cssClass: 'alert-proceed-btn',
          handler: (data) => {
            const amount = Number(data.amount);
            if (amount > 0) {
              this.walletService.initiateAddFundsPayment(amount);
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
