import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, computed, signal, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline, checkmarkCircle, createOutline, hourglassOutline, calendarOutline, chevronForwardOutline, barChartOutline, flashOutline, closeOutline, ribbonOutline, walletOutline, sparklesOutline } from 'ionicons/icons';
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

import { AppSocketService } from '../../../../core/services/app-socket.service';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-member-home',
  standalone: true,
  imports: [CommonModule, IonIcon, MeetingCardComponent, CachedImgDirective, HeroCarouselComponent, DashboardSkeletonComponent],
  templateUrl: './member-home.component.html',
  styleUrls: ['./member-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('analyticsCarousel') analyticsCarousel!: ElementRef;
  private autoScrollInterval: any;

  @Output() notificationClick = new EventEmitter<void>();
  @Output() referralsClick = new EventEmitter<void>();

  private readonly dashboardService = inject(MemberDashboardService);
  private readonly profileService = inject(ProfileService);
  private readonly meetingsService = inject(MeetingsService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
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

  ngAfterViewInit() {
    this.startAutoScroll();
  }

  ngOnDestroy() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  startAutoScroll() {
    this.autoScrollInterval = setInterval(() => {
      const el = this.analyticsCarousel?.nativeElement;
      if (!el) return;

      const slideWidth = el.clientWidth;
      if (!slideWidth) return;

      const maxScroll = el.scrollWidth - slideWidth;
      if (maxScroll <= 0) return;

      if (el.scrollLeft >= maxScroll - 15) {
        // At the cloned slide end: instantly reset to 0 without backward animation
        el.scrollTo({ left: 0, behavior: 'instant' });
        // Then scroll left-to-right to next slide
        setTimeout(() => {
          el.scrollBy({ left: slideWidth, behavior: 'smooth' });
        }, 50);
      } else {
        // Scroll left-to-right
        el.scrollBy({ left: slideWidth, behavior: 'smooth' });

        // If landed on the cloned slide, reset position to 0 silently after transition
        setTimeout(() => {
          if (el.scrollLeft >= maxScroll - 15) {
            el.scrollTo({ left: 0, behavior: 'instant' });
          }
        }, 600);
      }
    }, 3000);
  }



  readonly approvedOffers = computed(() =>
    this.dashboardData()?.myOffers.filter(o => o.status === 'APPROVED') || []
  );

  readonly percentageDeals = computed(() => this.approvedOffers().filter(o => o.offer_type === 'DISCOUNT' && o.discount_type === 'PERCENTAGE'));
  readonly flatOffers = computed(() => this.approvedOffers().filter(o => o.offer_type === 'DISCOUNT' && o.discount_type === 'FIXED_AMOUNT'));
  readonly cashbackOffers = computed(() => this.approvedOffers().filter(o => o.offer_type === 'CASHBACK'));

  readonly bizzCoinOffer = computed(() =>
    this.dashboardData()?.myOffers.find(o => o.offer_type === 'BIZZ_COINS') || null
  );

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
    addIcons({ addCircleOutline, ticketOutline, notificationsOutline, businessOutline, scanOutline, checkmarkCircle, createOutline, hourglassOutline, calendarOutline, chevronForwardOutline, barChartOutline, flashOutline, closeOutline, ribbonOutline, walletOutline, sparklesOutline });
  }

  toggleActionsMenu() {
    this.isActionsMenuOpen.update(v => !v);
  }

  closeActionsMenu() {
    this.isActionsMenuOpen.set(false);
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

  onIssueBizzCoins() {
    this.router.navigate(['/vouchers/issue-bizz-coins']);
  }

  onRedeemVoucher() {
    this.router.navigate(['/vouchers/redeem']);
  }

  onRedeemBizzCoins() {
    this.router.navigate(['/vouchers/redeem-bizz-coins']);
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
