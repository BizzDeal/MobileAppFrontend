import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  closeOutline,
  copyOutline,
  giftOutline,
  locationOutline,
  personOutline,
  pricetagOutline,
  shareSocialOutline,
  sparklesOutline,
  ticketOutline,
  timeOutline,
  walletOutline
} from 'ionicons/icons';
import { ChatRoomComponent } from '../features/chat/components/chat-room/chat-room.component';
import { ConversationListComponent } from '../features/chat/components/conversation-list/conversation-list.component';
import { ChatService } from '../features/chat/services/chat.service';
import { BottomNavComponent, NavTab } from '../features/home/components/bottom-nav/bottom-nav.component';
import { SearchViewComponent } from '../features/home/components/search-view/search-view.component';
import { BusinessDTO, OfferDTO } from '../features/home/models/home.model';
import { HomeService } from '../features/home/services/home.service';
import { MemberDashboardService } from '../features/home/services/member-dashboard.service';
import { MeetingsService } from '../features/meetings/services/meetings.service';
import { NotificationsPageComponent } from '../features/notifications/components/notifications-page/notifications-page.component';
import { NotificationService } from '../features/notifications/services/notification.service';
import { ProfileViewComponent } from '../features/profile/components/profile-view/profile-view.component';
import { WalletViewComponent } from '../features/wallet/components/wallet-view/wallet-view.component';
import { ProfileService } from '../features/profile/services/profile.service';
import { CustomerHomeComponent } from '../features/home/components/customer-home/customer-home.component';
import { MemberHomeComponent } from '../features/home/components/member-home/member-home.component';
// Force reload referrals page components
import { ReferralsPageComponent } from '../features/referrals/pages/referrals-page/referrals-page.component';
import { MenuViewComponent } from '../features/menu/components/menu-view/menu-view.component';
import { MeetingsPageComponent } from '../features/meetings/pages/meetings-page/meetings-page.component';
import { VouchersViewComponent } from '../features/vouchers/components/vouchers-view/vouchers-view.component';
import { CustomerVouchersService } from '../features/vouchers/services/customer-vouchers.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { CachedImgDirective } from '../shared/directives/cached-img.directive';
import { CachedBgImgDirective } from '../shared/directives/cached-bg-img.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DatePipe,
    CachedImgDirective,
    CachedBgImgDirective,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonToast,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    BottomNavComponent,
    SearchViewComponent,
    ConversationListComponent,
    // Chat components
    ChatRoomComponent,
    WalletViewComponent,
    ProfileViewComponent,
    NotificationsPageComponent,
    CustomerHomeComponent,
    MemberHomeComponent,
    MeetingsPageComponent,
    ReferralsPageComponent,
    MenuViewComponent,
    VouchersViewComponent,
  ],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly homeService = inject(HomeService);
  private readonly memberDashboardService = inject(MemberDashboardService);
  private readonly meetingsService = inject(MeetingsService);
  private readonly chatService = inject(ChatService);
  private readonly notificationService = inject(NotificationService);
  private readonly profileService = inject(ProfileService);
  private readonly authSession = inject(AuthSessionService);
  private readonly customerVouchersService = inject(CustomerVouchersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly userRole = computed(() => this.authSession.userRole() || this.profileService.profile()?.role || 'CUSTOMER');

  readonly homeFeed = this.homeService.homeFeed;
  readonly loading = this.homeService.loading;
  readonly error = this.homeService.error;
  readonly selectedCategory = this.homeService.selectedCategory;
  readonly trendingOffers = computed(() => this.homeFeed()?.trendingOffers || []);
  readonly topBusinesses = computed(() => this.homeFeed()?.topBusinesses || []);
  readonly featuredBusinesses = computed(() => this.homeFeed()?.featuredBusinesses || []);
  readonly megaDeals = computed(() => this.homeFeed()?.megaDeals || []);

  readonly selectedConversationId = this.chatService.activeConversationId;
  readonly unreadNotificationsCount = this.notificationService.unreadCount;

  readonly activeNavTab = signal<NavTab>('home');
  readonly toastMessage = signal<string | null>(null);
  readonly isVouchersModalOpen = signal<boolean>(false);
  readonly isNotificationsModalOpen = signal<boolean>(false);
  readonly selectedDealModal = signal<OfferDTO | null>(null);
  readonly selectedBizModal = signal<BusinessDTO | null>(null);
  readonly searchQuery = signal<string>('');

  readonly filteredTrendingBySearch = computed(() => {
    const offers = this.trendingOffers();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return offers;
    return offers.filter(o => 
      o.title.toLowerCase().includes(query) || 
      o.description.toLowerCase().includes(query) ||
      (o.businessName && o.businessName.toLowerCase().includes(query))
    );
  });

  readonly filteredTopBizBySearch = computed(() => {
    const bizList = this.topBusinesses();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return bizList;
    return bizList.filter(b => 
      b.name.toLowerCase().includes(query) || 
      (b.description && b.description.toLowerCase().includes(query)) ||
      (b.categoryName && b.categoryName.toLowerCase().includes(query))
    );
  });

  readonly filteredFeaturedBySearch = computed(() => {
    const bizList = this.featuredBusinesses();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return bizList;
    return bizList.filter(b => 
      b.name.toLowerCase().includes(query) || 
      (b.description && b.description.toLowerCase().includes(query)) ||
      (b.categoryName && b.categoryName.toLowerCase().includes(query))
    );
  });

  readonly filteredMegaDealsBySearch = computed(() => {
    const deals = this.megaDeals();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return deals;
    return deals.filter(o => 
      o.title.toLowerCase().includes(query) || 
      o.description.toLowerCase().includes(query) ||
      (o.businessName && o.businessName.toLowerCase().includes(query))
    );
  });

  constructor() {
    addIcons({ 
      closeOutline, 
      ticketOutline, 
      giftOutline, 
      copyOutline, 
      sparklesOutline, 
      shareSocialOutline, 
      checkmarkCircleOutline, 
      alertCircleOutline,
      locationOutline,
      timeOutline,
      pricetagOutline,
      chatbubbleOutline,
      personOutline,
      walletOutline
    });

    // Handle tab query parameter for switching active nav tab
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab) {
        this.activeNavTab.set(tab as any);
      } else {
        this.activeNavTab.set('home');
      }
    });

    // Guard activeNavTab based on role: customer cannot access chat feature
    effect(() => {
      const role = this.userRole();
      const tab = this.activeNavTab();
      if (role === 'CUSTOMER' && tab === 'chat') {
        untracked(() => {
          this.activeNavTab.set('home');
        });
      }
    });

    // Ensure profile is loaded immediately when arriving on home screen
    this.profileService.loadProfile().subscribe();
  }

  onRefresh(event: any): void {
    const role = this.userRole();
    if (role === 'MEMBER') {
      forkJoin({
        profile: this.profileService.loadProfile().pipe(catchError(() => of(null))),
        dashboard: this.memberDashboardService.loadDashboardData().pipe(catchError(() => of(null))),
        meetings: this.meetingsService.loadMeetings().pipe(catchError(() => of(null)))
      }).subscribe(() => {
        if (event?.target?.complete) {
          event.target.complete();
        }
      });
    } else {
      forkJoin({
        profile: this.profileService.loadProfile().pipe(catchError(() => of(null))),
        feed: this.homeService.loadHomeFeed().pipe(catchError(() => of(null)))
      }).subscribe(() => {
        if (event?.target?.complete) {
          event.target.complete();
        }
      });
    }
  }

  retryRefresh(): void {
    this.onRefresh({ target: { complete: () => {} } });
  }

  onCategorySelect(catId: string): void {
    this.homeService.selectCategory(catId);
  }

  onClaimOffer(offer: OfferDTO): void {
    this.homeService.claimOffer(offer).subscribe({
      next: (voucher) => {
        this.customerVouchersService.addVoucher({
          id: voucher.id,
          voucher_code: voucher.voucher_code,
          offer_id: voucher.offer_id,
          customer_id: voucher.customer_id,
          business_id: voucher.business_id,
          status: 'ISSUED',
          issued_at: voucher.issued_at,
          redeemed_at: null,
          expires_at: voucher.expires_at,
          redeemed_by_id: null,
          created_at: voucher.created_at,
          updated_at: voucher.updated_at,
          offerTitle: voucher.offerTitle || 'Promotional Offer',
          businessName: voucher.businessName || 'BizzDeal Partner',
          discountText: voucher.discountText || 'Special Offer'
        });
        this.showToast(`🎉 Deal Claimed! Voucher ${voucher.voucher_code} added to your wallet.`);
      },
      error: (err) => {
        this.showToast(`❌ Could not claim deal: ${err.message}`);
      },
    });
  }

  onDealClick(deal: OfferDTO): void {
    this.selectedDealModal.set(deal);
  }

  onBusinessClick(biz: BusinessDTO): void {
    this.selectedBizModal.set(biz);
  }

  onTabSelect(tab: NavTab): void {
    if (this.userRole() === 'CUSTOMER' && tab === 'chat') {
      return;
    }
    this.activeNavTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSearchSubmit(query: string): void {
    this.searchQuery.set(query);
    this.activeNavTab.set('search');
  }

  getComingSoonIcon(tab: NavTab): string {
    switch (tab) {
      case 'chat': return 'chatbubble-outline';
      case 'wallet': return 'wallet-outline';
      case 'profile': return 'person-outline';
      default: return 'alert-circle-outline';
    }
  }

  openVouchersModal(): void {
    this.isVouchersModalOpen.set(true);
  }

  closeVouchersModal(): void {
    this.isVouchersModalOpen.set(false);
  }

  onWalletClick(): void {
    this.activeNavTab.set('wallet');
  }

  onNotificationClick(): void {
    this.isNotificationsModalOpen.set(true);
  }

  closeNotificationsModal(): void {
    this.isNotificationsModalOpen.set(false);
  }

  encodeUri(str: string): string {
    return encodeURIComponent(str || '');
  }

  copyVoucherCode(code: string): void {
    navigator.clipboard?.writeText(code);
    this.showToast(`📋 Code ${code} copied to clipboard!`);
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
  }

  onConversationSelect(id: string): void {
    this.chatService.setActiveConversation(id);
  }

  onCloseChatRoom(): void {
    this.chatService.setActiveConversation(null);
  }

  onChatWithBusiness(ownerId: string): void {
    if (this.userRole() === 'CUSTOMER') {
      return;
    }
    this.selectedBizModal.set(null);
    this.chatService.createOrGetConversation(ownerId);
    this.activeNavTab.set('chat');
  }
}
