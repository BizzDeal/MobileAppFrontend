import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  walletOutline,
  cardOutline,
  documentTextOutline,
  timeOutline,
  shieldCheckmarkOutline,
  trendingUpOutline,
  arrowForwardOutline,
  cashOutline,
  briefcaseOutline,
  peopleOutline,
  sparklesOutline,
  lockClosedOutline,
  pricetagOutline,
  giftOutline,
  receiptOutline,
} from 'ionicons/icons';
import { WalletService } from '../../services/wallet.service';
import { AppBackButtonService } from '../../../../core/platform/app-back-button.service';

export interface WalletActivityItem {
  id: string;
  title: string;
  dateText: string;
  amount: number;
  isCredit: boolean;
  icon: string;
  iconBgClass: string;
}

@Component({
  selector: 'app-wallet-balance',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonIcon,
  ],
  templateUrl: './wallet-balance.page.html',
  styleUrls: ['./wallet-balance.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletBalancePage {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly alertController = inject(AlertController);
  private readonly backButtonService = inject(AppBackButtonService);
  readonly walletService = inject(WalletService);

  readonly wallet = this.walletService.wallet;
  readonly transactions = this.walletService.transactions;

  readonly availableBalance = computed<number>(() => {
    return this.wallet()?.balance || 0;
  });

  readonly totalEarnings = computed<number>(() => {
    const w = this.wallet();
    if (!w) return 0;
    // Total earnings = total savings earned + current balance
    const savings = Number(w.total_savings || 0);
    const balance = Number(w.balance || 0);
    return savings > 0 ? (savings + balance) : balance;
  });

  // Recent activity showing strictly only CASH WALLET transactions
  readonly recentWalletTransactions = computed<WalletActivityItem[]>(() => {
    const txList = this.transactions();
    return txList.slice(0, 10).map((t) => {
      const desc = (t.description || '').toLowerCase();
      const type = t.type;
      const isCredit = type !== 'DEBIT';
      let title = t.description || (isCredit ? 'Wallet Credit' : 'Wallet Debit');
      let icon = isCredit ? 'cash-outline' : 'pricetag-outline';
      let iconBgClass = isCredit ? 'icon-green' : 'icon-orange';

      if (desc.includes('add') || desc.includes('fund') || desc.includes('topup') || desc.includes('razorpay')) {
        title = 'Added Funds';
        icon = 'card-outline';
        iconBgClass = 'icon-blue';
      } else if (desc.includes('cashback')) {
        title = 'Cashback Received';
        icon = 'cash-outline';
        iconBgClass = 'icon-green';
      } else if (desc.includes('saving') || type === 'SAVING') {
        title = 'Voucher Savings';
        icon = 'gift-outline';
        iconBgClass = 'icon-green';
      } else if (type === 'DEBIT' || desc.includes('redeem') || desc.includes('voucher')) {
        title = 'Spent on Voucher';
        icon = 'pricetag-outline';
        iconBgClass = 'icon-orange';
      }

      return {
        id: t.id,
        title,
        dateText: this.formatRelativeTime(t.created_at),
        amount: Math.abs(t.amount),
        isCredit,
        icon,
        iconBgClass,
      };
    });
  });

  constructor() {
    addIcons({
      arrowBackOutline,
      walletOutline,
      cardOutline,
      documentTextOutline,
      timeOutline,
      shieldCheckmarkOutline,
      trendingUpOutline,
      arrowForwardOutline,
      cashOutline,
      briefcaseOutline,
      peopleOutline,
      sparklesOutline,
      lockClosedOutline,
      pricetagOutline,
      giftOutline,
      receiptOutline,
    });
  }

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

  goBack(): void {
    this.backButtonService.back('/home?tab=wallet');
  }

  async openAddFundsPrompt(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Add Money to Wallet',
      subHeader: 'Enter the amount you would like to add',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Amount (₹)',
          min: 1,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-cancel-btn',
        },
        {
          text: 'Proceed',
          cssClass: 'alert-proceed-btn',
          handler: (data) => {
            const amount = Number(data.amount);
            if (amount > 0) {
              this.walletService.initiateAddFundsPayment(amount);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  onTransactionHistory(): void {
    this.router.navigate(['/wallet/history']);
  }

  async onHowToSpend(): Promise<void> {
    const bal = this.availableBalance();
    const alert = await this.alertController.create({
      header: 'How to Spend Wallet Balance',
      subHeader: `Current Balance: ₹${bal.toFixed(2)}`,
      message:
        'Your wallet balance is automatically available to spend whenever you redeem a voucher at any participating BizzDeal partner business. Present your voucher at the counter, and your wallet balance will be applied directly towards your bill for instant savings!',
      buttons: [
        {
          text: 'View My Vouchers',
          handler: () => {
            this.router.navigate(['/home'], { queryParams: { tab: 'vouchers' } });
          },
        },
        {
          text: 'Got It',
          role: 'cancel',
        },
      ],
    });
    await alert.present();
  }

  async onSecureSafe(): Promise<void> {
    const alert = await this.alertController.create({
      header: '100% Secure & Safe',
      subHeader: 'RBI Compliant Payment Protection',
      message:
        'All your transactions on BizzDeal are encrypted with 256-bit bank-grade security protocols. Funds and cashback are safe and immediately accessible.',
      buttons: ['Understood'],
    });
    await alert.present();
  }
}
