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
  walletOutline,
  ribbonOutline
} from 'ionicons/icons';
import { WalletTransactionDTO } from '../../models/wallet.model';
import { WalletService, BizzCoinTransactionItem } from '../../services/wallet.service';
import { ListSkeletonComponent } from '../../../../shared/components/skeletons/list-skeleton/list-skeleton.component';

export interface DisplayTransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at: string;
  isBizzCoin: boolean;
  currencySymbol: string;
}

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
  readonly bizzCoinsBalance = this.walletService.bizzCoinsBalance;
  readonly bizzCoinsTransactions = this.walletService.bizzCoinsTransactions;
  readonly loading = this.walletService.loading;
  readonly error = this.walletService.error;
  readonly hasMore = this.walletService.hasMore;

  // Active card: 0 = Cash Wallet Card, 1 = Bizz Coin Card
  readonly activeCardIndex = signal<number>(0);

  // Simplified filters: ALL, CREDIT, DEBIT
  readonly activeFilter = signal<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  readonly selectedTransaction = signal<DisplayTransactionItem | null>(null);

  readonly filteredTransactions = computed(() => {
    const isCoinCard = this.activeCardIndex() === 1;

    let baseList: DisplayTransactionItem[] = [];

    if (isCoinCard) {
      baseList = this.bizzCoinsTransactions().map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || `Received ${t.amount} Bizz Coins`,
        reference_type: 'BIZZ_COINS',
        reference_id: null,
        created_at: t.created_at,
        isBizzCoin: true,
        currencySymbol: '🪙'
      }));
    } else {
      baseList = this.transactions().map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || this.getTransactionTypeLabel(t.type),
        reference_type: t.reference_type,
        reference_id: t.reference_id,
        created_at: t.created_at,
        isBizzCoin: false,
        currencySymbol: '₹'
      }));
    }

    const filter = this.activeFilter();
    if (filter === 'ALL') return baseList;
    if (filter === 'CREDIT') return baseList.filter(t => t.type === 'CREDIT');
    if (filter === 'DEBIT') return baseList.filter(t => t.type === 'DEBIT');
    return baseList;
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
      sparklesOutline,
      ribbonOutline
    });
  }

  scrollToCard(index: number) {
    this.activeCardIndex.set(index);
    const track = document.querySelector('.carousel-track') as HTMLElement;
    if (track) {
      const cardWidth = track.clientWidth;
      track.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  }

  onCarouselScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (!target) return;
    const cardWidth = target.clientWidth;
    if (cardWidth > 0) {
      const newIndex = Math.round(target.scrollLeft / cardWidth);
      if (newIndex >= 0 && newIndex <= 1 && newIndex !== this.activeCardIndex()) {
        this.activeCardIndex.set(newIndex);
      }
    }
  }

  setFilter(filter: 'ALL' | 'CREDIT' | 'DEBIT'): void {
    this.activeFilter.set(filter);
  }

  viewTransactionDetails(tx: DisplayTransactionItem): void {
    this.selectedTransaction.set(tx);
  }

  closeDetailsModal(): void {
    this.selectedTransaction.set(null);
  }

  getTransactionIcon(tx: DisplayTransactionItem): string {
    if (tx.isBizzCoin) {
      return 'sparkles-outline';
    }
    switch (tx.type) {
      case 'CREDIT': return 'arrow-up-outline';
      case 'DEBIT': return 'arrow-down-outline';
      case 'SAVING': return 'gift-outline';
      default: return 'receipt-outline';
    }
  }

  getTransactionTypeLabel(type: string, isBizzCoin = false): string {
    if (isBizzCoin) {
      return type === 'CREDIT' ? 'Bizz Coins Credit' : 'Bizz Coins Redeemed';
    }
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
