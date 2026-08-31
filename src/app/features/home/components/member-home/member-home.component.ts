import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, computed, signal, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon, IonSpinner, NavController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline, checkmarkCircle, createOutline, hourglassOutline, calendarOutline, chevronForwardOutline, barChartOutline, flashOutline, closeOutline, ribbonOutline, walletOutline, sparklesOutline, videocamOutline, trendingUpOutline, pricetagOutline, chatbubblesOutline, globeOutline, paperPlaneOutline } from 'ionicons/icons';
import { MemberDashboardService } from '../../services/member-dashboard.service';

import { ProfileService } from '../../../profile/services/profile.service';
import { OfferDTO } from '../../models/home.model';
import { CommonModule } from '@angular/common';
import { MeetingsService, AttendeeStatus } from '../../../meetings/services/meetings.service';
import { MeetingCardComponent } from '../../../meetings/components/meeting-card/meeting-card.component';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { NotificationService } from '../../../notifications/services/notification.service';
import { ToastService } from '../../../../core/services/toast.service';
import { WalletService } from '../../../wallet/services/wallet.service';

import { DashboardSkeletonComponent } from '../../../../shared/components/skeletons/dashboard-skeleton/dashboard-skeleton.component';
import { MemberHomeHeaderComponent } from '../member-home-header/member-home-header.component';

import { AppSocketService } from '../../../../core/services/app-socket.service';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-member-home',
  standalone: true,
  imports: [CommonModule, IonIcon, MeetingCardComponent, CachedImgDirective, DashboardSkeletonComponent, MemberHomeHeaderComponent],
  templateUrl: './member-home.component.html',
  styleUrls: ['./member-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberHomeComponent implements OnInit {
  @Output() notificationClick = new EventEmitter<void>();
  @Output() referralsClick = new EventEmitter<void>();
  @Output() chatClick = new EventEmitter<void>();
  @Output() walletClick = new EventEmitter<void>();
  @Output() searchClick = new EventEmitter<void>();
  @Output() receivedBusinessClick = new EventEmitter<void>();
  @Output() givenBusinessClick = new EventEmitter<void>();

  private readonly dashboardService = inject(MemberDashboardService);
  private readonly profileService = inject(ProfileService);
  private readonly meetingsService = inject(MeetingsService);
  private readonly notificationService = inject(NotificationService);
  readonly walletService = inject(WalletService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly ngZone = inject(NgZone);
  private readonly toastService = inject(ToastService);
  private readonly appSocket = inject(AppSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dashboardData = this.dashboardService.dashboardData;
  readonly profile = this.profileService.profile;
  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;
  readonly meetingsError = this.meetingsService.error;
  readonly unreadCount = this.notificationService.unreadCount;

  readonly isActionsMenuOpen = signal(false);

  ngOnInit() {
    this.dashboardService.loadDashboardData().subscribe();
    this.meetingsService.loadMeetings().subscribe();
    this.walletService.loadWalletData().subscribe();
    this.appSocket.connect();

    this.appSocket.onEvent('OFFER_STATUS_UPDATED')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt: any) => {
        const payload = evt?.payload;
        if (payload) {
          this.dashboardService.loadDashboardData().subscribe();
          this.profileService.loadProfile().subscribe();
          this.notificationService.getNotifications().subscribe();

          if (payload.status === 'APPROVED') {
            this.toastService.showSuccess(`🎉 Your ${payload.offer_type === 'BIZZ_COINS' ? 'Bizz Coin offer' : 'offer'} "${payload.title || ''}" was approved by Admin!`);
          } else if (payload.status === 'REJECTED') {
            this.toastService.showError(`Your ${payload.offer_type === 'BIZZ_COINS' ? 'Bizz Coin offer' : 'offer'} request was rejected by Admin.`);
          }
        }
      });
  }



  readonly bizzCoinOffer = computed(() =>
    this.dashboardData()?.bizzCoinOffer ||
    this.dashboardData()?.myOffers.find(o => o.offer_type === 'BIZZ_COINS') ||
    null
  );

  readonly regionalStats = computed(() => this.dashboardData()?.analytics?.districtStats);
  readonly regionalName = computed(() => {
    const stats = this.regionalStats();
    if (stats?.districtName && stats.districtName !== 'Region') return stats.districtName;
    return this.profile()?.primary_business_district_name || this.profile()?.district_name || 'Your';
  });

  readonly isBusinessFeatured = computed(() => {
    return !!this.profile()?.is_featured;
  });

  readonly hasActiveBizzCoinOffer = computed(() => {
    const offer = this.bizzCoinOffer();
    if (!offer || offer.status !== 'APPROVED') return false;
    const now = new Date();
    const start = new Date(offer.start_date);
    const end = new Date(offer.end_date);
    return start <= now && end >= now;
  });

  readonly canRedeemBizzCoins = computed(() => {
    return this.isBusinessFeatured() || this.hasActiveBizzCoinOffer();
  });

  readonly pendingOffers = computed(() =>
    this.dashboardData()?.myOffers.filter(o => o.status === 'PENDING') || []
  );

  readonly upcomingMeetings = computed(() => {
    const all = this.meetingsService.getMyMeetings();
    const now = new Date();
    return all.filter(m => new Date(m.meeting_date) >= now && m.status !== 'CANCELLED');
  });

    
  constructor() {
    addIcons({ addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline, checkmarkCircle, createOutline, hourglassOutline, calendarOutline, chevronForwardOutline, barChartOutline, flashOutline, closeOutline, ribbonOutline, walletOutline, sparklesOutline, videocamOutline, trendingUpOutline, pricetagOutline, chatbubblesOutline, globeOutline, paperPlaneOutline });
  }

  toggleActionsMenu() {
    this.isActionsMenuOpen.update(v => !v);
  }

  closeActionsMenu() {
    this.isActionsMenuOpen.set(false);
  }

  getFirstName(name?: string): string {
    if (!name) return 'Member';
    return name.trim().split(' ')[0];
  }

  getInitials(name?: string | null): string {
    if (!name || !name.trim()) return 'U';
    return name.trim().charAt(0).toUpperCase();
  }

  onGiveReferral() {
    if (this.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create referrals');
      return;
    }
    this.ngZone.run(() => {
      this.navCtrl.navigateForward('/referrals/new');
    });
  }

  onPostVideo() {
    this.router.navigate(['/videos/new']);
  }

  onOpenChat() {
    this.chatClick.emit();
  }

  onCreateOffer() {
    if (this.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create offers');
      return;
    }
    this.router.navigate(['/offers/new']);
  }

  onViewMyDeals() {
    this.router.navigate(['/offers/my-deals']);
  }

  onBizzCoinsOffer() {
    if (this.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create offers');
      return;
    }
    this.router.navigate(['/offers/bizz-coins']);
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

  onRedeemBizzCoins() {
    this.router.navigate(['/vouchers/redeem-bizz-coins']);
  }

  handleRsvp(event: { meetingId: string, status: AttendeeStatus }) {
    this.meetingsService.updateRSVP(event.meetingId, event.status);
  }
}
