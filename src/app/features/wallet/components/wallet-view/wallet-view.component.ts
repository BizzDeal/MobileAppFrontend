import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
  AlertController
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
  ribbonOutline,
  addCircleOutline,
  peopleOutline,
  bagHandleOutline,
  briefcaseOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  shareSocialOutline,
  informationCircleOutline,
  swapHorizontalOutline,
  cashOutline,
  syncOutline,
  chatbubbleEllipsesOutline,
  storefrontOutline,
  cardOutline,
  trophyOutline
} from 'ionicons/icons';
import { WalletService } from '../../services/wallet.service';
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
  activityTitle: string;
  activitySubtitle: string;
  iconType: 'business' | 'referral' | 'purchase' | 'reward' | 'default';
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
    ListSkeletonComponent
  ],
  templateUrl: './wallet-view.component.html',
  styleUrl: './wallet-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletViewComponent {
  readonly walletService = inject(WalletService);
  private readonly alertController = inject(AlertController);

  private readonly router = inject(Router);

  @Input() hideHeader = false;
  @Input() customerName?: string;
  @Input() customer?: any;
  @Output() redeemClick = new EventEmitter<void>();

  readonly wallet = this.walletService.wallet;
  readonly transactions = this.walletService.transactions;
  readonly bizzCoinsBalance = this.walletService.bizzCoinsBalance;
  readonly bizzCoinsTransactions = this.walletService.bizzCoinsTransactions;
  readonly loading = this.walletService.loading;
  readonly error = this.walletService.error;
  readonly hasMore = this.walletService.hasMore;

  readonly selectedTransaction = signal<DisplayTransactionItem | null>(null);

  // Computed greeting first name
  readonly firstName = computed<string>(() => {
    const raw = this.customerName || this.customer?.name || '';
    if (!raw || raw.trim().toLowerCase() === 'customer' || raw.trim().toLowerCase() === 'unknown') {
      return 'Raja';
    }
    return raw.trim().split(' ')[0];
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
      ribbonOutline,
      addCircleOutline,
      peopleOutline,
      bagHandleOutline,
      briefcaseOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      shareSocialOutline,
      informationCircleOutline,
      swapHorizontalOutline,
      cashOutline,
      syncOutline,
      chatbubbleEllipsesOutline,
      storefrontOutline,
      cardOutline,
      trophyOutline
    });
  }

  // Helper to format friendly relative time
  private formatRelativeTime(dateString: string): string {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        return diffHours < 1 ? 'Just now' : 'Today';
      }
      if (diffDays === 1) return 'Yesterday';
      if (diffDays === 2) return '2 Days Ago';
      if (diffDays < 7) return `${diffDays} Days Ago`;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recent';
    }
  }

  // Helper to determine item display metadata
  private mapTransactionToDisplay(
    raw: any,
    isCoin: boolean
  ): DisplayTransactionItem {
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
      activityTitle = desc || 'Bizz Points';
      iconType = 'reward';
    } else {
      activityTitle = desc || (type === 'CREDIT' ? 'Added Funds' : 'Paid Out');
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
      activitySubtitle: this.formatRelativeTime(raw.created_at),
      iconType
    };
  }

  // All combined transactions mapped for display
  readonly allDisplayTransactions = computed<DisplayTransactionItem[]>(() => {
    const coins = this.bizzCoinsTransactions().map(t => this.mapTransactionToDisplay(t, true));
    const cash = this.transactions().map(t => this.mapTransactionToDisplay(t, false));

    // Prefer coin transactions at top, sorted by date descending
    const combined = [...coins, ...cash];
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return combined;
  });

  // Recent 10 transactions for the scrollable card view
  readonly recentTransactions = computed<DisplayTransactionItem[]>(() => {
    return this.allDisplayTransactions().slice(0, 10);
  });

  // Redemption transactions (where points or wallet was redeemed/debited)
  readonly redemptionTransactions = computed<DisplayTransactionItem[]>(() => {
    return this.allDisplayTransactions().filter(t => t.type === 'DEBIT');
  });

  navigateToHistory(): void {
    this.router.navigate(['/wallet/history']);
  }

  navigateToEarnCoins(): void {
    this.router.navigate(['/wallet/earn-bizz-coins']);
  }

  navigateToEarnWalletPoints(): void {
    this.router.navigate(['/wallet/earn-wallet-points']);
  }

  navigateToRedemptions(): void {
    this.router.navigate(['/wallet/my-redemptions']);
  }

  viewTransactionDetails(tx: DisplayTransactionItem): void {
    this.selectedTransaction.set(tx);
  }

  closeDetailsModal(): void {
    this.selectedTransaction.set(null);
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
