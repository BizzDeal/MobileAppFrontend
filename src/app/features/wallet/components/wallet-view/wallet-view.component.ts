import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowDownOutline,
  arrowUpOutline,
  chevronForwardOutline,
  closeOutline,
  giftOutline,
  receiptOutline,
  sparklesOutline,
  timeOutline,
  trendingUpOutline,
  walletOutline
} from 'ionicons/icons';
import { WalletTransactionDTO } from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';
import { ListSkeletonComponent } from '../../../../shared/components/skeletons/list-skeleton/list-skeleton.component';

@Component({
  selector: 'app-wallet-view',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    DecimalPipe,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    ListSkeletonComponent
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
  readonly hasMore = this.walletService.hasMore;

  readonly activeFilter = signal<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
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

  setFilter(filter: 'ALL' | 'CREDIT' | 'DEBIT'): void {
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

  loadMore(event: any): void {
    const obs = this.walletService.loadMoreHistory();
    if (obs) {
      obs.subscribe({
        next: () => event.target.complete(),
        error: () => event.target.complete()
      });
    } else {
      event.target.complete();
    }
  }
}
