import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { 
  IonSpinner, 
  IonIcon, 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  walletOutline, 
  trendingUpOutline, 
  arrowDownOutline, 
  arrowUpOutline, 
  giftOutline, 
  closeOutline, 
  receiptOutline, 
  timeOutline, 
  alertCircleOutline,
  chevronForwardOutline,
  sparklesOutline
} from 'ionicons/icons';
import { WalletService } from '../../services/wallet.service';
import { WalletTransactionDTO } from '../../models/wallet.model';

@Component({
  selector: 'app-wallet-view',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    DecimalPipe,
    IonSpinner,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton
  ],
  templateUrl: './wallet-view.component.html',
  styleUrl: './wallet-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletViewComponent {
  readonly walletService = inject(WalletService);

  readonly wallet = this.walletService.wallet;
  readonly transactions = this.walletService.transactions;
  readonly loading = this.walletService.loading;
  readonly error = this.walletService.error;

  readonly activeFilter = signal<'ALL' | 'CREDIT' | 'DEBIT' | 'SAVING'>('ALL');
  readonly selectedTransaction = signal<WalletTransactionDTO | null>(null);

  readonly filteredTransactions = computed(() => {
    const list = this.transactions();
    const filter = this.activeFilter();
    if (filter === 'ALL') return list;
    return list.filter(t => t.type === filter);
  });

  constructor() {
    addIcons({
      walletOutline,
      trendingUpOutline,
      arrowDownOutline,
      arrowUpOutline,
      giftOutline,
      closeOutline,
      receiptOutline,
      timeOutline,
      alertCircleOutline,
      chevronForwardOutline,
      sparklesOutline
    });
  }

  setFilter(filter: 'ALL' | 'CREDIT' | 'DEBIT' | 'SAVING'): void {
    this.activeFilter.set(filter);
  }

  viewTransactionDetails(tx: WalletTransactionDTO): void {
    this.selectedTransaction.set(tx);
  }

  closeDetailsModal(): void {
    this.selectedTransaction.set(null);
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'CREDIT': return 'arrow-up-outline';
      case 'DEBIT': return 'arrow-down-outline';
      case 'SAVING': return 'gift-outline';
      default: return 'receipt-outline';
    }
  }

  getTransactionTypeLabel(type: string): string {
    switch (type) {
      case 'CREDIT': return 'Added Funds';
      case 'DEBIT': return 'Paid out / Redeemed';
      case 'SAVING': return 'Savings / Cashback';
      default: return 'Transaction';
    }
  }

  retryLoad(): void {
    this.walletService.loadWalletData().subscribe();
  }
}
