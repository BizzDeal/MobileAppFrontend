import { inject, Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { ToastService } from '../services/toast.service';

export interface AppShareOptions {
  inviteCode: string;
  appUrl: string;
  joinerRewardCoins: number;
}

@Injectable({
  providedIn: 'root',
})
export class ShareService {
  private readonly toastService = inject(ToastService);

  async shareAppInvite(options: AppShareOptions): Promise<void> {
    const { inviteCode, appUrl, joinerRewardCoins } = options;
    const shareTitle = 'Join me on BizzDeal!';
    const shareText = `🎉 Join me on BizzDeal!\nDiscover the best local deals, businesses, and offers near you.\n\n🎁 Use my Invite Code: ${inviteCode} (Earn ${joinerRewardCoins} Bizz Points on signup!)\n\n📱 Download App: ${appUrl}`;

    try {
      // Check if native Share can share
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: appUrl,
          dialogTitle: 'Share BizzDeal App',
        });
        return;
      }
    } catch {
      // Ignore native share check errors and attempt fallback
    }

    // Web fallback using Web Share API or Clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        this.toastService.showSuccess('App invite message copied to clipboard!');
      } else {
        this.toastService.showSuccess(`Invite Code: ${inviteCode}`);
      }
    } catch (err: unknown) {
      const errorObj = err as { name?: string };
      if (errorObj?.name !== 'AbortError') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          this.toastService.showSuccess('App invite message copied to clipboard!');
        }
      }
    }
  }
}
