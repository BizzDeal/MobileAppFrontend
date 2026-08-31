import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
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
  IonModal,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  documentTextOutline,
  closeOutline,
  briefcaseOutline,
  peopleOutline,
  bagHandleOutline,
  sparklesOutline
} from 'ionicons/icons';
import { WalletService } from '../../services/wallet.service';
import { DisplayTransactionItem } from '../../components/wallet-view/wallet-view.component';

@Component({
  selector: 'app-wallet-history',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonModal,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  templateUrl: './wallet-history.page.html',
  styleUrl: './wallet-history.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletHistoryPage {
  private readonly location = inject(Location);
  readonly walletService = inject(WalletService);

  readonly hasMore = this.walletService.hasMore;
  readonly activeFilter = signal<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  readonly selectedTransaction = signal<DisplayTransactionItem | null>(null);

  constructor() {
    addIcons({
      arrowBackOutline,
      documentTextOutline,
      closeOutline,
      briefcaseOutline,
      peopleOutline,
      bagHandleOutline,
      sparklesOutline
    });
  }

  private mapTransactionToDisplay(raw: any, isCoin: boolean): DisplayTransactionItem {
    const desc = raw.description || '';
    const descLower = desc.toLowerCase();
    const type = raw.type || 'CREDIT';
    const amount = Number(raw.amount || 0);

    let activityTitle = 'Points Reward';
    let iconType: 'business' | 'referral' | 'purchase' | 'reward' | 'default' = 'reward';

    if (descLower.includes('business') || descLower.includes('visiting') || descLower.includes('redemption reward')) {
      activityTitle = 'Business Done';
      iconType = 'business';
    } else if (descLower.includes('referral') || descLower.includes('refer') || raw.reference_type === 'REFERRAL') {
      activityTitle = 'Referral Added';
      iconType = 'referral';
    } else if (descLower.includes('purchase') || descLower.includes('order') || descLower.includes('bought') || raw.reference_type === 'VOUCHER') {
      activityTitle = 'Purchase Made';
      iconType = 'purchase';
    } else if (descLower.includes('welcome') || descLower.includes('signup')) {
      activityTitle = 'Signup Bonus';
      iconType = 'reward';
    } else if (type === 'DEBIT') {
      activityTitle = 'Redeemed Points';
      iconType = 'purchase';
    } else if (isCoin) {
      activityTitle = desc ? desc.slice(0, 24) : 'Bizz Points';
      iconType = 'reward';
    } else {
      activityTitle = desc ? desc.slice(0, 24) : (type === 'CREDIT' ? 'Added Funds' : 'Paid Out');
      iconType = 'business';
    }

    return {
      id: raw.id,
      type,
      amount,
      description: desc || activityTitle,
      reference_type: raw.reference_type || null,
      reference_id: raw.reference_id || null,
      created_at: raw.created_at,
      isBizzCoin: isCoin,
      currencySymbol: isCoin ? '🪙' : '₹',
      activityTitle,
      activitySubtitle: 'Transaction',
      iconType
    };
  }

  readonly allDisplayTransactions = computed<DisplayTransactionItem[]>(() => {
    const coins = this.walletService.bizzCoinsTransactions().map(t => this.mapTransactionToDisplay(t, true));
    const cash = this.walletService.transactions().map(t => this.mapTransactionToDisplay(t, false));

    const combined = [...coins, ...cash];
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return combined;
  });

  readonly filteredTransactions = computed<DisplayTransactionItem[]>(() => {
    const list = this.allDisplayTransactions();
    const filter = this.activeFilter();
    if (filter === 'ALL') return list;
    if (filter === 'CREDIT') return list.filter(t => t.type === 'CREDIT');
    if (filter === 'DEBIT') return list.filter(t => t.type === 'DEBIT');
    return list;
  });

  setFilter(filter: 'ALL' | 'CREDIT' | 'DEBIT'): void {
    this.activeFilter.set(filter);
  }

  goBack(): void {
    this.location.back();
  }

  viewTransactionDetails(tx: DisplayTransactionItem): void {
    this.selectedTransaction.set(tx);
  }

  closeDetailsModal(): void {
    this.selectedTransaction.set(null);
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
