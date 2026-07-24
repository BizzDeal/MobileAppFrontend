import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline, checkmarkCircle, createOutline, hourglassOutline, calendarOutline, chevronForwardOutline, barChartOutline } from 'ionicons/icons';
import { MemberDashboardService } from '../../services/member-dashboard.service';

import { ProfileService } from '../../../profile/services/profile.service';
import { OfferDTO } from '../../models/home.model';
import { CommonModule } from '@angular/common';
import { MeetingsService, AttendeeStatus } from '../../../meetings/services/meetings.service';
import { MeetingCardComponent } from '../../../meetings/components/meeting-card/meeting-card.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { NotificationService } from '../../../notifications/services/notification.service';
import { ToastService } from '../../../../core/services/toast.service';

import { HeroCarouselComponent } from '../hero-carousel/hero-carousel.component';
import { DashboardSkeletonComponent } from '../../../../shared/components/skeletons/dashboard-skeleton/dashboard-skeleton.component';

@Component({
  selector: 'app-member-home',
  standalone: true,
  imports: [CommonModule, IonIcon, MeetingCardComponent, CachedImgDirective, HeroCarouselComponent, DashboardSkeletonComponent],
  templateUrl: './member-home.component.html',
  styleUrls: ['./member-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberHomeComponent implements OnInit {
  @Output() notificationClick = new EventEmitter<void>();

  private readonly dashboardService = inject(MemberDashboardService);
  private readonly profileService = inject(ProfileService);
  private readonly meetingsService = inject(MeetingsService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly dashboardData = this.dashboardService.dashboardData;
  readonly profile = this.profileService.profile;
  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;
  readonly meetingsError = this.meetingsService.error;
  readonly unreadCount = this.notificationService.unreadCount;

  ngOnInit() {
    this.dashboardService.loadDashboardData().subscribe();
    this.meetingsService.loadMeetings().subscribe();
  }



  readonly approvedOffers = computed(() =>
    this.dashboardData()?.myOffers.filter(o => o.status === 'APPROVED') || []
  );

  readonly percentageDeals = computed(() => this.approvedOffers().filter(o => o.offer_type === 'DISCOUNT' && o.discount_type === 'PERCENTAGE'));
  readonly flatOffers = computed(() => this.approvedOffers().filter(o => o.offer_type === 'DISCOUNT' && o.discount_type === 'FIXED_AMOUNT'));
  readonly cashbackOffers = computed(() => this.approvedOffers().filter(o => o.offer_type === 'CASHBACK'));

  readonly pendingOffers = computed(() =>
    this.dashboardData()?.myOffers.filter(o => o.status === 'PENDING') || []
  );

  readonly upcomingMeetings = computed(() => {
    const all = this.meetingsService.getMyMeetings();
    const now = new Date();
    return all.filter(m => new Date(m.meeting_date) >= now && m.status !== 'CANCELLED');
  });

  readonly picLoadError = signal(false);
  readonly logoLoadError = signal(false);

  constructor() {
    addIcons({ addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline, checkmarkCircle, createOutline, hourglassOutline, calendarOutline, chevronForwardOutline, barChartOutline });
  }

  getFirstName(name?: string): string {
    if (!name) return 'Member';
    const first = name.trim().split(' ')[0];
    return first.length > 5 ? `${first.substring(0, 5)}...` : first;
  }

  getInitials(name?: string | null): string {
    if (!name || !name.trim()) return 'U';
    return name.trim().charAt(0).toUpperCase();
  }

  onCreateOffer() {
    if (this.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create offers');
      return;
    }
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
