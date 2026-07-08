import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { BusinessCardComponent } from '../features/home/components/business-card/business-card.component';
import { CategoryChipsComponent } from '../features/home/components/category-chips/category-chips.component';
import { HeroCarouselComponent } from '../features/home/components/hero-carousel/hero-carousel.component';
import { HomeHeaderComponent } from '../features/home/components/home-header/home-header.component';
import { OfferCardComponent } from '../features/home/components/offer-card/offer-card.component';
import { QuickActionsComponent } from '../features/home/components/quick-actions/quick-actions.component';
import { SearchViewComponent } from '../features/home/components/search-view/search-view.component';
import { BusinessDTO, OfferDTO } from '../features/home/models/home.model';
import { HomeService } from '../features/home/services/home.service';
import { NotificationsPageComponent } from '../features/notifications/components/notifications-page/notifications-page.component';
import { NotificationService } from '../features/notifications/services/notification.service';
import { ProfileViewComponent } from '../features/profile/components/profile-view/profile-view.component';
import { WalletViewComponent } from '../features/wallet/components/wallet-view/wallet-view.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DatePipe,
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
    HomeHeaderComponent,
    HeroCarouselComponent,
    CategoryChipsComponent,
    OfferCardComponent,
    BusinessCardComponent,
    QuickActionsComponent,
    BottomNavComponent,
    SearchViewComponent,
    ConversationListComponent,
    ChatRoomComponent,
    WalletViewComponent,
    ProfileViewComponent,
    NotificationsPageComponent,
  ],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly homeService = inject(HomeService);
  private readonly chatService = inject(ChatService);
  private readonly notificationService = inject(NotificationService);

  readonly homeFeed = this.homeService.homeFeed;
  readonly loading = this.homeService.loading;
  readonly error = this.homeService.error;
  readonly selectedCategory = this.homeService.selectedCategory;
  readonly trendingOffers = this.homeService.filteredTrendingOffers;
  readonly recommendedBusinesses = this.homeService.filteredRecommendedBusinesses;

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

  readonly filteredBizBySearch = computed(() => {
    const bizList = this.recommendedBusinesses();
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
      walletOutline
    });
  }

  onRefresh(event: any): void {
    this.homeService.loadHomeFeed().subscribe({
      next: () => event.target.complete(),
      error: () => event.target.complete(),
    });
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
    this.activeNavTab.set(tab);
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
    this.selectedBizModal.set(null);
    this.chatService.createOrGetConversation(ownerId);
    this.activeNavTab.set('chat');
  }
}
