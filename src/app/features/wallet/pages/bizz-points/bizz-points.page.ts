import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonButton,
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
  ribbonOutline,
  giftOutline,
  documentTextOutline,
  clipboardOutline,
  sparkles,
  sparklesOutline,
  peopleOutline,
  bagHandleOutline,
  briefcaseOutline,
  starOutline,
  checkmarkCircle,
  informationCircleOutline,
  pricetagOutline,
} from 'ionicons/icons';
import { WalletService } from '../../services/wallet.service';

export interface PointsActivityItem {
  id: string;
  title: string;
  dateText: string;
  points: number;
  isCredit: boolean;
  icon: string;
  iconBgClass: string;
}

@Component({
  selector: 'app-bizz-points',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
  ],
  templateUrl: './bizz-points.page.html',
  styleUrls: ['./bizz-points.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BizzPointsPage {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly alertController = inject(AlertController);
  readonly walletService = inject(WalletService);

  readonly pointsBalance = this.walletService.bizzCoinsBalance;
  readonly transactions = this.walletService.bizzCoinsTransactions;

  // Format activities showing strictly only Bizz Points transactions
  readonly recentActivities = computed<PointsActivityItem[]>(() => {
    const coinTx = this.transactions();
    return coinTx.slice(0, 10).map((t) => {
      const desc = (t.description || '').toLowerCase();
      const isCredit = t.type !== 'DEBIT';
      let title = t.description || (isCredit ? 'Points Earned' : 'Points Redeemed');
      let icon = isCredit ? 'sparkles' : 'pricetag-outline';
      let iconBgClass = isCredit ? 'icon-blue' : 'icon-orange';

      if (desc.includes('business') || desc.includes('partner') || desc.includes('done')) {
        title = 'Business Done';
        icon = 'briefcase-outline';
        iconBgClass = 'icon-blue';
      } else if (desc.includes('referral') || desc.includes('refer') || desc.includes('invite')) {
        title = 'Referral Added';
        icon = 'people-outline';
        iconBgClass = 'icon-green';
      } else if (desc.includes('purchase') || desc.includes('voucher') || desc.includes('order')) {
        title = isCredit ? 'Purchase Reward' : 'Purchase Made';
        icon = 'bag-handle-outline';
        iconBgClass = 'icon-orange';
      } else if (desc.includes('signup') || desc.includes('welcome')) {
        title = 'Signup Bonus';
        icon = 'gift-outline';
        iconBgClass = 'icon-green';
      }

      return {
        id: t.id,
        title,
        dateText: this.formatRelativeTime(t.created_at),
        points: Math.abs(t.amount),
        isCredit,
        icon,
        iconBgClass,
      };
    });
  });

  constructor() {
    addIcons({
      arrowBackOutline,
      ribbonOutline,
      giftOutline,
      documentTextOutline,
      clipboardOutline,
      sparkles,
      sparklesOutline,
      peopleOutline,
      bagHandleOutline,
      briefcaseOutline,
      starOutline,
      checkmarkCircle,
      informationCircleOutline,
      pricetagOutline,
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
    this.router.navigate(['/home'], { queryParams: { tab: 'wallet' } });
  }

  onEarnPoints(): void {
    this.router.navigate(['/wallet/earn-bizz-coins']);
  }

  async onMyPoints(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'My Bizz Points',
      subHeader: `Current Balance: ${this.pointsBalance()} Points`,
      message: 'Earn more points by referring friends, conducting business with member stores, and completing offers.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  onHistory(): void {
    this.router.navigate(['/wallet/history']);
  }

  onRedeem(): void {
    this.router.navigate(['/wallet/my-redemptions']);
  }
}
