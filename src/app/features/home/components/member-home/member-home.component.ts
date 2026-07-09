import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline, checkmarkCircle, createOutline, hourglassOutline, calendarOutline, chevronForwardOutline, barChartOutline } from 'ionicons/icons';
import { MemberDashboardService } from '../../services/member-dashboard.service';

import { ProfileService } from '../../../profile/services/profile.service';
import { OfferCardComponent } from '../offer-card/offer-card.component';
import { OfferDTO } from '../../models/home.model';
import { CommonModule } from '@angular/common';
import { MeetingsService, AttendeeStatus } from '../../../meetings/services/meetings.service';
import { MeetingCardComponent } from '../../../meetings/components/meeting-card/meeting-card.component';

@Component({
  selector: 'app-member-home',
  standalone: true,
  imports: [CommonModule, IonIcon, OfferCardComponent, MeetingCardComponent],
  templateUrl: './member-home.component.html',
  styleUrls: ['./member-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberHomeComponent {
  @Output() notificationClick = new EventEmitter<void>();
  @Output() showToast = new EventEmitter<string>();

  private readonly dashboardService = inject(MemberDashboardService);
  private readonly profileService = inject(ProfileService);
  private readonly meetingsService = inject(MeetingsService);
  private readonly router = inject(Router);

  readonly dashboardData = this.dashboardService.dashboardData;
  readonly profile = this.profileService.profile;
  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;

  readonly approvedOffers = computed(() => 
    this.dashboardData()?.myOffers.filter(o => o.status === 'APPROVED') || []
  );

  readonly pendingOffers = computed(() => 
    this.dashboardData()?.myOffers.filter(o => o.status === 'PENDING') || []
  );

  readonly upcomingMeetings = computed(() => {
    const all = this.meetingsService.getMyMeetings();
    const now = new Date();
    return all.filter(m => new Date(m.meeting_date) >= now && m.status !== 'CANCELLED');
  });

  constructor() {
    addIcons({ addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline, checkmarkCircle, createOutline, hourglassOutline, calendarOutline, chevronForwardOutline, barChartOutline });
  }

  getFirstName(name?: string): string {
    return name ? name.split(' ')[0] : 'Member';
  }

  onCreateOffer() {
    this.router.navigate(['/offers/new']);
  }

  onDealClick(offer: OfferDTO) {
    this.router.navigate(['/offers', offer.id, 'edit']);
  }

  onIssueVoucher() {
    this.router.navigate(['/vouchers/issue']);
  }

  onRedeemVoucher() {
    this.router.navigate(['/vouchers/redeem']);
  }

  onViewAnalytics() {
    this.router.navigate(['/analytics']);
  }

  onViewDirectory() {
    this.router.navigate(['/business-directory']);
  }

  handleRsvp(event: { meetingId: string, status: AttendeeStatus }) {
    this.meetingsService.updateRSVP(event.meetingId, event.status);
  }
}
