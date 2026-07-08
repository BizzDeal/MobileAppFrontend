import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline } from 'ionicons/icons';
import { MemberDashboardService } from '../../services/member-dashboard.service';

import { ProfileService } from '../../../profile/services/profile.service';

@Component({
  selector: 'app-member-home',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './member-home.component.html',
  styleUrls: ['./member-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberHomeComponent {
  @Output() notificationClick = new EventEmitter<void>();

  private readonly dashboardService = inject(MemberDashboardService);
  private readonly profileService = inject(ProfileService);

  readonly dashboardData = this.dashboardService.dashboardData;
  readonly profile = this.profileService.profile;
  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;

  constructor() {
    addIcons({ addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline });
  }

  getFirstName(name?: string): string {
    return name ? name.split(' ')[0] : 'Member';
  }

  onCreateOffer() {
    console.log('Create offer clicked');
  }

  onIssueVoucher() {
    console.log('Issuing voucher...');
  }

  onRedeemVoucher() {
    console.log('Redeeming customer voucher...');
  }
}
