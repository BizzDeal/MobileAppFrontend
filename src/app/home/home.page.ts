import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, DestroyRef, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
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
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  calendarOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  closeOutline,
  copyOutline,
  giftOutline,
  locationOutline,
  personOutline,
  pricetagOutline,
  ribbonOutline,
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
import { WalletService } from '../features/wallet/services/wallet.service';
import { ProfileService } from '../features/profile/services/profile.service';
import { ToastService } from '../core/services/toast.service';
import { CustomerHomeComponent } from '../features/home/components/customer-home/customer-home.component';
import { MemberHomeComponent } from '../features/home/components/member-home/member-home.component';
// Force reload referrals page components
import { ReferralsPageComponent } from '../features/referrals/pages/referrals-page/referrals-page.component';
import { MenuViewComponent } from '../features/menu/components/menu-view/menu-view.component';
import { MeetingsPageComponent } from '../features/meetings/pages/meetings-page/meetings-page.component';
import { VouchersViewComponent } from '../features/vouchers/components/vouchers-view/vouchers-view.component';
import { CustomerVouchersService } from '../features/vouchers/services/customer-vouchers.service';
import { CategoriesViewComponent } from '../features/categories/components/categories-view/categories-view.component';
import { VideosViewComponent } from '../features/videos/components/videos-view/videos-view.component';
import { AuthSessionService } from '../core/services/auth-session.service';
import { CachedImgDirective } from '../shared/directives/cached-img.directive';
import { getInitials, getAvatarColor } from '../shared/utils/avatar.util';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DatePipe,
    TitleCasePipe,
    CachedImgDirective,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
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
    CategoriesViewComponent,
    VideosViewComponent,
  ],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly homeService = inject(HomeService);
  private readonly memberDashboardService = inject(MemberDashboardService);
  private readonly meetingsService = inject(MeetingsService);
  private readonly chatService = inject(ChatService);
  private readonly notificationService = inject(NotificationService);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);
  private readonly authSession = inject(AuthSessionService);
  private readonly customerVouchersService = inject(CustomerVouchersService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly walletService = inject(WalletService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  
  
  readonly getInitials = getInitials;
  readonly getAvatarColor = getAvatarColor;

  readonly userRole = computed(() => this.authSession.userRole() || this.profileService.profile()?.role || 'CUSTOMER');

  readonly customerProfile = computed(() => {
    const p = this.profileService.profile();
    return {
      id: p?.id || 'unknown',
      name: p?.full_name || 'Customer',
      phone: p?.phone || '',
      address: p?.address || '',
      district_name: p?.district_name || p?.primary_business_district_name || null,
      pincode: p?.pincode || p?.business_pincode || null,
      profile_pic_url: p?.profile_pic_url || null,
    };
  });

  readonly fallbackWallet = { id: '', user_id: '', balance: 0, total_savings: 0, created_at: '', updated_at: '' };

  readonly showSearchBar = computed(() => ['home', 'search', 'vouchers'].includes(this.activeNavTab()));

  // Scroll state for collapsible header
  readonly isHeaderScrolled = signal<boolean>(false);

  readonly activeVouchers = computed(() => this.customerVouchersService.vouchers().filter(v => v.status === 'ISSUED'));

  readonly homeFeed = this.homeService.homeFeed;
  readonly loading = this.homeService.loading;
  readonly error = this.homeService.error;
  readonly selectedCategory = this.homeService.selectedCategory;
  readonly topBusinesses = computed(() => this.homeFeed()?.topBusinesses || []);
  readonly featuredBusinesses = computed(() => this.homeFeed()?.featuredBusinesses || []);
  readonly allOffers = computed(() => {
    const deals = this.homeFeed()?.megaDeals || [];
    const trending = this.homeFeed()?.trendingOffers || [];
    const map = new Map<string, OfferDTO>();
    deals.forEach(o => map.set(o.id, o));
    trending.forEach(o => map.set(o.id, o));
    return Array.from(map.values());
  });

  readonly percentageDeals = computed(() => this.allOffers().filter(o => o.offer_type === 'DISCOUNT' && o.discount_type === 'PERCENTAGE'));
  readonly flatOffers = computed(() => this.allOffers().filter(o => o.offer_type === 'DISCOUNT' && o.discount_type === 'FIXED_AMOUNT'));
  readonly cashbackOffers = computed(() => this.allOffers().filter(o => o.offer_type === 'CASHBACK'));

  readonly selectedConversationId = this.chatService.activeConversationId;
  readonly unreadNotificationsCount = this.notificationService.unreadCount;

  readonly activeNavTab = signal<NavTab>('home');
  readonly isVouchersModalOpen = signal<boolean>(false);
  readonly selectedVoucherModal = signal<any>(null);
  readonly isNotificationsModalOpen = signal<boolean>(false);
  readonly selectedDealModal = signal<OfferDTO | null>(null);
  readonly selectedBizModal = signal<BusinessDTO | null>(null);
  readonly selectedBizCoinsOffer = signal<OfferDTO | null>(null);
  readonly loadingBizCoinsOffer = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  private filterOffers = (offers: OfferDTO[]) => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return offers;
    return offers.filter(o => 
      o.title.toLowerCase().includes(query) || 
      o.description.toLowerCase().includes(query) ||
      (o.businessName && o.businessName.toLowerCase().includes(query))
    );
  };

  readonly filteredPercentageDealsBySearch = computed(() => this.filterOffers(this.percentageDeals()));
  readonly filteredFlatOffersBySearch = computed(() => this.filterOffers(this.flatOffers()));
  readonly filteredCashbackOffersBySearch = computed(() => this.filterOffers(this.cashbackOffers()));

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
      walletOutline,
      ribbonOutline,
      calendarOutline
    });

    // Handle tab query parameter for switching active nav tab
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const tab = params['tab'];
      if (tab) {
        this.activeNavTab.set(tab as any);
        if (tab === 'chat' && params['conversation_id']) {
          this.chatService.setActiveConversation(params['conversation_id']);
        }
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

    // Ensure profile and customer vouchers are loaded immediately when arriving on home screen
    this.profileService.loadProfile().subscribe();
    if (this.authSession.isAuthenticated()) {
      this.customerVouchersService.loadVouchers().subscribe({
        error: (err) => console.error('HomePage initial customer vouchers load error:', err)
      });
    }
  }

  ionViewWillEnter(): void {
    if (this.authSession.isAuthenticated() && this.userRole() !== 'CUSTOMER') {
      this.chatService.refreshContactsAndConversations().subscribe();
    }
  }
  ngAfterViewInit(): void {
    // Observer removed as per user request to keep header constant
  }

  ngOnDestroy(): void {
  }

  onRefresh(event: any): void {
    const role = this.userRole();
    if (role === 'MEMBER') {
      forkJoin({
        profile: this.profileService.loadProfile(true).pipe(catchError(() => of(null))),
        dashboard: this.memberDashboardService.loadDashboardData().pipe(catchError(() => of(null))),
        meetings: this.meetingsService.loadMeetings().pipe(catchError(() => of(null))),
        wallet: this.walletService.refreshWallet().pipe(catchError(() => of(null))),
        notifications: this.notificationService.getNotifications().pipe(catchError(() => of(null))),
        chat: this.chatService.refreshContactsAndConversations().pipe(catchError(() => of(null)))
      }).subscribe(() => {
        if (event?.target?.complete) {
          event.target.complete();
        }
      });
    } else {
      forkJoin({
        profile: this.profileService.loadProfile(true).pipe(catchError(() => of(null))),
        feed: this.homeService.loadHomeFeed().pipe(catchError(() => of(null))),
        wallet: this.walletService.refreshWallet().pipe(catchError(() => of(null))),
        notifications: this.notificationService.getNotifications().pipe(catchError(() => of(null))),
        vouchers: this.customerVouchersService.loadVouchers().pipe(catchError(() => of(null))),
        chat: this.chatService.refreshContactsAndConversations().pipe(catchError(() => of(null)))
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
          redeemed_by_id: null,
          created_at: voucher.created_at,
          updated_at: voucher.updated_at,
          offerTitle: voucher.offerTitle || 'Promotional Offer',
          businessName: voucher.businessName || 'BizzDeal Partner',
          discountText: voucher.discountText || 'Special Offer',
          offer_type: offer.offer_type,
          discount_type: (offer.discount_type as any) || undefined
        });
        
        // Refresh wallet state after claiming an offer which could affect savings or cashback balance
        this.walletService.refreshWallet().subscribe({
          error: (err) => console.error('Failed to refresh wallet after claim', err)
        });
      },
      error: (err) => {
        // Interceptor handles error
      },
    });
  }

  onDealClick(deal: OfferDTO): void {
    this.selectedDealModal.set(deal);
  }

  onBusinessClick(biz: BusinessDTO): void {
    this.selectedBizModal.set(biz);
    this.fetchBizzCoinsOfferForBusiness(biz.id);
  }

  onVideoBusinessClick(businessId: string): void {
    const found = this.topBusinesses().find(b => b.id === businessId) || this.featuredBusinesses().find(b => b.id === businessId);
    if (found) {
      this.onBusinessClick(found);
    } else {
      this.http.get<any>(`${environment.apiUrl}/businesses/${businessId}`).subscribe({
        next: (res) => {
          const b = res?.data || res;
          if (b) {
            const bizDto: BusinessDTO = {
              id: b.id,
              owner_id: b.owner_id,
              category_id: b.category_id,
              name: b.name,
              description: b.description || null,
              website: b.website || null,
              gst_number: b.gst_number || null,
              logo_id: b.logo_id || null,
              status: b.status || 'ACTIVE',
              district_id: b.district_id || '',
              is_featured: b.is_featured ?? false,
              video_url: b.video_url || null,
              created_at: b.created_at || new Date().toISOString(),
              updated_at: b.updated_at || new Date().toISOString(),
              categoryName: b.categoryName || b.category?.name || 'Partner Business',
              logoUrl: b.logoUrl || b.business_logo_url || null,
              bannerUrl: b.bannerUrl || b.banner_url || b.logoUrl || b.business_logo_url || null,
            };
            this.onBusinessClick(bizDto);
          }
        },
        error: (err) => console.error('Error loading business from video:', err),
      });
    }
  }

  onVideoDealClick(dealId: string): void {
    const found = this.allOffers().find(o => o.id === dealId);
    if (found) {
      this.onDealClick(found);
    } else {
      this.http.get<any>(`${environment.apiUrl}/offers/${dealId}`).subscribe({
        next: (res) => {
          const o = res?.data || res;
          if (o) {
            const offerDto: OfferDTO = {
              id: o.id,
              business_id: o.business_id,
              title: o.title,
              description: o.description || '',
              offer_type: o.offer_type || 'DISCOUNT',
              discount_value: o.discount_value ?? null,
              discount_type: o.discount_type || null,
              start_date: o.start_date || new Date().toISOString(),
              end_date: o.end_date || new Date().toISOString(),
              image_id: o.image_id || null,
              status: o.status || 'APPROVED',
              approved_by_id: o.approved_by_id || null,
              approved_at: o.approved_at || null,
              created_at: o.created_at || new Date().toISOString(),
              updated_at: o.updated_at || new Date().toISOString(),
              businessName: o.businessName || o.business?.name || 'Partner Business',
              businessLogoUrl: o.businessLogoUrl || o.business?.business_logo_url || null,
              imageUrl: o.imageUrl || o.image_url || null,
              isClaimed: this.customerVouchersService.vouchers().some(v => v.offer_id === o.id),
            };
            this.onDealClick(offerDto);
          }
        },
        error: (err) => console.error('Error loading offer from video:', err),
      });
    }
  }

  private fetchBizzCoinsOfferForBusiness(businessId: string): void {
    this.selectedBizCoinsOffer.set(null);
    this.loadingBizCoinsOffer.set(true);
    this.http.get<any>(`${environment.apiUrl}/offers?business_id=${businessId}&offer_type=BIZZ_COINS`).subscribe({
      next: (res) => {
        this.loadingBizCoinsOffer.set(false);
        const offers: OfferDTO[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        const activeOffer = offers.find(o => o.offer_type === 'BIZZ_COINS' && o.status === 'APPROVED');
        this.selectedBizCoinsOffer.set(activeOffer || null);
      },
      error: (err) => {
        this.loadingBizCoinsOffer.set(false);
        this.selectedBizCoinsOffer.set(null);
      }
    });
  }

  onTabSelect(tab: NavTab): void {
    if (this.userRole() === 'CUSTOMER' && tab === 'chat') {
      return;
    }
    this.activeNavTab.set(tab);
    if (tab === 'chat') {
      this.chatService.refreshContactsAndConversations().subscribe();
    }
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
      case 'videos': return 'play-circle-outline';
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

  openSingleVoucherModal(voucher: any): void {
    this.selectedVoucherModal.set(voucher);
  }

  getQrData(v: any): string {
    return encodeURIComponent(v.voucher_code);
  }

  copyVoucherCode(code: string): void {
    navigator.clipboard?.writeText(code);
    this.toastService.showSuccess(`📋 Code ${code} copied to clipboard!`);
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

  getVoucherTypeClass(v: any): string {
    const offerType = v.offer_type || v.offer?.offer_type;
    const discountType = v.discount_type || v.offer?.discount_type;
    const text = (v.discountText || '').toLowerCase();

    if (offerType === 'CASHBACK' || text.includes('cashback')) {
      return 'type-cashback';
    }
    if (discountType === 'PERCENTAGE' || text.includes('%')) {
      return 'type-percentage';
    }
    if (discountType === 'FIXED_AMOUNT' || discountType === 'FIXED' || text.includes('₹') || text.includes('off')) {
      return 'type-fixed';
    }

    return 'type-fixed'; // default fallback for colored items
  }
}
