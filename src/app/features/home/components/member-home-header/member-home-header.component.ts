import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { callOutline, mailOutline, globeOutline, shareSocialOutline } from 'ionicons/icons';
import { ProfileDTO } from '../../../profile/models/profile.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { ShareService } from '../../../../core/platform/share.service';
import { UserInviteService } from '../../../auth/services/user-invite.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-member-home-header',
  standalone: true,
  imports: [IonIcon, CachedImgDirective],
  templateUrl: './member-home-header.component.html',
  styleUrl: './member-home-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberHomeHeaderComponent {
  private readonly shareService = inject(ShareService);
  private readonly userInviteService = inject(UserInviteService);

  readonly profile = input<ProfileDTO | null>(null);
  readonly unreadCount = input<number>(0);
  readonly isScrolled = input<boolean>(false);

  readonly notificationClick = output<void>();
  readonly locationClick = output<void>();

  readonly showSupportDialog = signal<boolean>(false);

  constructor() {
    addIcons({ callOutline, mailOutline, globeOutline, shareSocialOutline });
  }

  getDisplayName(profile: ProfileDTO | null): string {
    if (!profile) return 'Member';
    return profile.business_name || profile.full_name || 'Member';
  }

  getDistrictName(profile: ProfileDTO | null): string {
    if (!profile) return 'Location';
    return profile.district_name || profile.primary_business_district_name || 'Location';
  }

  getPincode(profile: ProfileDTO | null): string {
    if (!profile) return '';
    return profile.pincode || profile.business_pincode || '';
  }

  onNotificationClick(): void {
    this.notificationClick.emit();
  }

  onLocationClick(): void {
    this.locationClick.emit();
    this.showSupportInfo();
  }

  showSupportInfo(): void {
    this.showSupportDialog.set(true);
  }

  closeSupportInfo(): void {
    this.showSupportDialog.set(false);
  }

  async shareApp(): Promise<void> {
    try {
      const res = await firstValueFrom(this.userInviteService.getInviteDetails());
      if (res?.data) {
        await this.shareService.shareAppInvite({
          inviteCode: res.data.invite_code,
          appUrl: res.data.app_url,
          joinerRewardCoins: res.data.joiner_reward_coins,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to get invite details for share:', err);
      await this.shareService.shareAppInvite({
        inviteCode: 'BIZZDEAL',
        appUrl: 'https://play.google.com/store/apps/details?id=com.bizzdeal.app',
        joinerRewardCoins: 50,
      });
    }
  }
}
