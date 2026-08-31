// Business Directory / Member Search Standalone Component
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  searchOutline,
  call,
  callOutline,
  chatbubbleEllipses,
  chatbubbleEllipsesOutline,
  globe,
  globeOutline,
  closeOutline,
  chevronForwardOutline,
  alertCircleOutline,
  refreshOutline,
  mailOutline,
  locationOutline,
  logoWhatsapp,
  businessOutline,
  personOutline
} from 'ionicons/icons';
import { ChatService } from '../../../chat/services/chat.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { environment } from '../../../../../environments/environment';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';

export interface DirectoryBusinessDTO {
  id: string;
  name: string;
  owner_name: string;
  categoryName: string;
  description: string;
  phone: string;
  whatsapp: string;
  website: string;
  owner_email: string;
  district_id: string;
  district_name: string;
  state_name: string;
  address: string;
  initials: string;
  owner_id: string;
  logoUrl?: string | null;
  profile_pic_url?: string | null;
}

@Component({
  selector: 'app-business-directory',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    CachedImgDirective,
    CardSkeletonComponent
  ],
  templateUrl: './business-directory.page.html',
  styleUrl: './business-directory.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessDirectoryPage implements OnInit, OnDestroy {
  private readonly chatService = inject(ChatService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly http = inject(HttpClient);

  readonly userRole = this.profileService.userRole;
  readonly profile = this.profileService.profile;

  readonly activeTab = signal<'REGIONAL' | 'GLOBAL'>('REGIONAL');
  readonly businesses = signal<DirectoryBusinessDTO[]>([]);
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Pagination state
  readonly page = signal<number>(1);
  readonly hasMore = signal<boolean>(false);
  private readonly pageSize = 20;
  private isLoadingMore = false;

  readonly selectedBusiness = signal<DirectoryBusinessDTO | null>(null);
  readonly isDetailModalOpen = signal<boolean>(false);
  readonly failedImages = signal<Set<string>>(new Set<string>());

  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  readonly filteredBusinesses = computed(() => {
    return this.businesses();
  });

  constructor() {
    addIcons({
      arrowBackOutline,
      searchOutline,
      call,
      callOutline,
      chatbubbleEllipses,
      chatbubbleEllipsesOutline,
      globe,
      globeOutline,
      closeOutline,
      chevronForwardOutline,
      alertCircleOutline,
      refreshOutline,
      mailOutline,
      locationOutline,
      logoWhatsapp,
      businessOutline,
      personOutline
    });
  }

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(query => {
        this.loadBusinesses(1, query);
      });

    this.loadBusinesses(1);
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  setTab(tab: 'REGIONAL' | 'GLOBAL'): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.loadBusinesses(1, this.searchQuery());
  }

  loadBusinesses(page = 1, search?: string, event?: any): void {
    if (this.isLoadingMore) {
      event?.target?.complete();
      return;
    }

    const isInitial = page === 1;
    if (isInitial && !event) {
      this.isLoading.set(true);
    }
    if (isInitial) {
      this.errorMessage.set(null);
    }
    this.isLoadingMore = true;

    const queryParams: string[] = [
      `page=${page}`,
      `limit=${this.pageSize}`
    ];

    if (search && search.trim()) {
      queryParams.push(`q=${encodeURIComponent(search.trim())}`);
    }

    // Regional district filter
    const userDistrict = this.profile()?.district_id || this.profile()?.business_district_id;
    if (this.activeTab() === 'REGIONAL' && userDistrict) {
      queryParams.push(`district=${encodeURIComponent(userDistrict)}`);
    }

    const myProfile = this.profile();
    if (myProfile?.id) {
      queryParams.push(`exclude_owner_id=${encodeURIComponent(myProfile.id)}`);
    }

    const queryString = `?${queryParams.join('&')}`;
    const endpoint = search && search.trim() 
      ? `${environment.apiUrl}/businesses/search${queryString}` 
      : `${environment.apiUrl}/businesses${queryString}`;

    this.http.get<any>(endpoint).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.isLoadingMore = false;
        if (event?.target?.complete) {
          event.target.complete();
        }

        const items = Array.isArray(res) ? res : res?.data || res?.items || [];
        const myBusinessId = myProfile?.business_id;
        const myOwnerId = myProfile?.id;
        const myBusinessName = myProfile?.business_name;

        const filteredList = items.filter((b: any) => {
          if (myBusinessId && b.id === myBusinessId) return false;
          if (myOwnerId && (b.owner_id === myOwnerId || b.owner?.id === myOwnerId)) return false;
          if (myBusinessName && b.name?.toLowerCase() === myBusinessName?.toLowerCase()) return false;
          return true;
        });

        const mapped: DirectoryBusinessDTO[] = filteredList.map((b: any) => {
          const ownerName = b.owner_name || b.owner?.profile?.full_name || b.owner?.full_name || b.name || 'Member';
          const initials = getInitials(ownerName) || getInitials(b.name) || 'BD';
          return {
            id: b.id,
            name: b.name || 'Unnamed Business',
            owner_name: ownerName,
            categoryName: b.categoryName || b.category_name || b.category?.name || 'General',
            description: b.description || 'No description provided.',
            phone: b.phone || b.owner_phone || b.owner?.phone || '',
            whatsapp: b.whatsapp || b.owner?.whatsapp || b.phone || '',
            website: b.website || '',
            owner_email: b.owner_email || b.owner?.email || '',
            district_id: b.district_id || b.owner?.profile?.district_id || '',
            district_name: b.district_name || b.owner?.profile?.district_name || '',
            state_name: b.state_name || b.owner?.profile?.state_name || '',
            address: b.address || b.owner?.profile?.address || '',
            initials,
            owner_id: b.owner_id || b.owner?.id || '',
            logoUrl: b.logoUrl || b.logo_url || b.logo?.file_url || null,
            profile_pic_url: b.profile_pic_url || b.owner?.profile_pic_url || null
          };
        });

        if (isInitial) {
          this.businesses.set(mapped);
        } else {
          this.businesses.update(prev => [...prev, ...mapped]);
        }

        this.page.set(page);

        // Update pagination meta
        const meta = res?.meta;
        if (meta && typeof meta.currentPage === 'number' && typeof meta.totalPages === 'number') {
          this.hasMore.set(meta.currentPage < meta.totalPages);
        } else {
          this.hasMore.set(mapped.length === this.pageSize);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.isLoadingMore = false;
        this.hasMore.set(false);
        if (event?.target?.complete) {
          event.target.complete();
        }
        console.error('Failed to load businesses:', err);
        if (isInitial) {
          this.errorMessage.set(extractFriendlyErrorMessage(err, 'Failed to load member directory.'));
        }
      }
    });
  }

  loadMore(event: any): void {
    if (!this.hasMore() || this.isLoadingMore) {
      event?.target?.complete();
      return;
    }
    this.loadBusinesses(this.page() + 1, this.searchQuery(), event);
  }

  getAvatarGradient(biz: DirectoryBusinessDTO): string {
    return getAvatarColor(biz.owner_name || biz.name);
  }

  handleImageError(id: string): void {
    this.failedImages.update(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  }

  isImageFailed(id: string): boolean {
    return this.failedImages().has(id);
  }

  openBusinessDetail(biz: DirectoryBusinessDTO): void {
    this.selectedBusiness.set(biz);
    this.isDetailModalOpen.set(true);
  }

  closeBusinessDetail(): void {
    this.isDetailModalOpen.set(false);
    this.selectedBusiness.set(null);
  }

  onSearchChange(event: any): void {
    const value = event.target.value || '';
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.loadBusinesses(1, '');
  }

  handleRefresh(event: any): void {
    this.loadBusinesses(1, this.searchQuery(), event);
  }

  callBusiness(phone?: string): void {
    if (!phone) return;
    window.open(`tel:${phone.replace(/\s+/g, '')}`, '_system');
  }

  startChat(ownerId?: string): void {
    if (this.userRole() === 'CUSTOMER' || !ownerId) {
      return;
    }
    this.closeBusinessDetail();
    this.chatService.createOrGetConversation(ownerId).subscribe({
      next: (conv) => {
        if (conv?.id) {
          this.chatService.setActiveConversation(conv.id);
          this.router.navigate(['/home'], {
            queryParams: { tab: 'chat', conversation_id: conv.id }
          });
        } else {
          this.router.navigate(['/home'], { queryParams: { tab: 'chat' } });
        }
      },
      error: (err) => {
        console.error('Failed to create/get conversation for chat:', err);
        this.router.navigate(['/home'], { queryParams: { tab: 'chat' } });
      }
    });
  }

  openWebsite(url?: string): void {
    if (!url) return;
    const targetUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
    window.open(targetUrl, '_blank');
  }

  openMail(email?: string): void {
    if (!email) return;
    window.open(`mailto:${email}`, '_system');
  }

  openWhatsApp(phone?: string): void {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_system');
  }
}
