import { DatePipe, DecimalPipe } from '@angular/common';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, DestroyRef } from '@angular/core';
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
import { AppBackButtonService } from '../../../../core/platform/app-back-button.service';

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
  private readonly backButtonService = inject(AppBackButtonService);
  private readonly destroyRef = inject(DestroyRef);
  readonly walletService = inject(WalletService);

  readonly selectedTransaction = signal<DisplayTransactionItem | null>(null);

  constructor() {
    addIcons({
      arrowBackOutline,
      giftOutline,
      bagHandleOutline,
      closeOutline
    });

    const unregister = this.backButtonService.registerOverlayDismissHandler(() => {
      if (this.selectedTransaction()) {
        this.closeDetailsModal();
        return true;
      }
      return false;
    });
    this.destroyRef.onDestroy(unregister);
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
    if (this.selectedTransaction()) {
      this.closeDetailsModal();
      return;
    }
    this.backButtonService.back('/home?tab=wallet');
  }

  viewTransactionDetails(tx: DisplayTransactionItem): void {
    this.selectedTransaction.set(tx);
  }

  closeDetailsModal(): void {
    this.selectedTransaction.set(null);
  }
}
