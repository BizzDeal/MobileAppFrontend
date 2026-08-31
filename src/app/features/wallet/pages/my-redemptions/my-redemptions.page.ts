import { DatePipe, DecimalPipe } from '@angular/common';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  giftOutline,
  bagHandleOutline,
  closeOutline
} from 'ionicons/icons';
import { WalletService } from '../../services/wallet.service';
import { DisplayTransactionItem } from '../../components/wallet-view/wallet-view.component';

@Component({
  selector: 'app-my-redemptions',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonModal
  ],
  templateUrl: './my-redemptions.page.html',
  styleUrl: './my-redemptions.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyRedemptionsPage {
  private readonly location = inject(Location);
  readonly walletService = inject(WalletService);

  readonly selectedTransaction = signal<DisplayTransactionItem | null>(null);

  constructor() {
    addIcons({
      arrowBackOutline,
      giftOutline,
      bagHandleOutline,
      closeOutline
    });
  }

  private mapTransactionToDisplay(raw: any, isCoin: boolean): DisplayTransactionItem {
    const desc = raw.description || '';
    const type = raw.type || 'DEBIT';
    const amount = Number(raw.amount || 0);

    return {
      id: raw.id,
      type,
      amount,
      description: desc || 'Redeemed Points',
      reference_type: raw.reference_type || null,
      reference_id: raw.reference_id || null,
      created_at: raw.created_at,
      isBizzCoin: isCoin,
      currencySymbol: isCoin ? '🪙' : '₹',
      activityTitle: 'Redeemed Points',
      activitySubtitle: 'Redemption',
      iconType: 'purchase'
    };
  }

  readonly redemptionTransactions = computed<DisplayTransactionItem[]>(() => {
    const coins = this.walletService.bizzCoinsTransactions()
      .filter(t => t.type === 'DEBIT')
      .map(t => this.mapTransactionToDisplay(t, true));
    const cash = this.walletService.transactions()
      .filter(t => t.type === 'DEBIT')
      .map(t => this.mapTransactionToDisplay(t, false));

    const combined = [...coins, ...cash];
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return combined;
  });

  goBack(): void {
    this.location.back();
  }

  viewTransactionDetails(tx: DisplayTransactionItem): void {
    this.selectedTransaction.set(tx);
  }

  closeDetailsModal(): void {
    this.selectedTransaction.set(null);
  }
}
