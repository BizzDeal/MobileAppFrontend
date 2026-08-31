import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, output, signal } from '@angular/core';
import {
  IonBadge,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  documentTextOutline,
  imageOutline,
  micOutline,
  personOutline,
  searchOutline,
  peopleOutline
} from 'ionicons/icons';
import { ChatMessage } from '../../models/chat.model';
import { ChatService } from '../../services/chat.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { ProfileService } from '../../../profile/services/profile.service';

import { AuthSessionService } from '../../../../core/services/auth-session.service';

import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    DatePipe,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    CachedImgDirective,
    IonSkeletonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly toastService = inject(ToastService);
  private readonly profileService = inject(ProfileService);
  private readonly authSession = inject(AuthSessionService);

  readonly selectConversation = output<string>();

  readonly conversations = this.chatService.conversations;
  readonly contactsDirectory = this.chatService.contactsDirectory;
  readonly onlineUsers = this.chatService.onlineUsers;

  readonly searchFilter = signal<string>('');
  readonly displayedList = signal<any[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly hasMore = signal<boolean>(true);
  
  private currentPage = 1;
  private readonly pageSize = 20;

  constructor() {
    addIcons({
      chatbubbleEllipsesOutline,
      searchOutline,
      personOutline,
      imageOutline,
      documentTextOutline,
      micOutline,
      peopleOutline
    });
    
    // We listen to search filter changes to trigger backend search
    // Since we want debounce, we'll do it manually in onSearchChange, or we can just let it reload
  }

  ngOnInit(): void {
    this.refresh(true);
  }

  ionViewWillEnter(): void {
    this.refresh(true);
  }

  refresh(showLoading: boolean = false): void {
    this.currentPage = 1;
    this.hasMore.set(true);
    this.displayedList.set([]);
    this.loadData(null, showLoading);
    this.chatService.refreshContactsAndConversations().subscribe(); // Keep socket state fresh
  }

  handleRefresh(event: any): void {
    this.currentPage = 1;
    this.hasMore.set(true);
    this.displayedList.set([]);
    this.loadData(event, false);
    this.chatService.refreshContactsAndConversations().subscribe();
  }

  loadData(event?: any, showLoading: boolean = false): void {
    if (!this.hasMore()) {
      event?.target?.complete();
      return;
    }

    const query = this.searchFilter();
    const isInitial = this.currentPage === 1;
    if (isInitial && showLoading) {
      this.isLoading.set(true);
    }

    this.chatService.getChatList(this.currentPage, this.pageSize, query).subscribe({
      next: (res) => {
        let items = res?.data || [];
        // Deduplicate duplicate admin entries: prioritize 'System Administrator'
        const hasSystemAdmin = items.some((item: any) => item.contact?.full_name === 'System Administrator');
        if (hasSystemAdmin) {
          items = items.filter((item: any) => item.contact?.full_name !== 'Admin' || item.conversationId);
        }
        this.displayedList.update(prev => isInitial ? items : [...prev, ...items]);
        this.hasMore.set(res?.meta ? (res.meta.currentPage < res.meta.totalPages && items.length > 0) : false);
        this.isLoading.set(false);
        event?.target?.complete();
      },
      error: () => {
        this.isLoading.set(false);
        event?.target?.complete();
      }
    });
  }

  onIonInfinite(event: any): void {
    if (this.hasMore()) {
      this.currentPage++;
      this.loadData(event);
    } else {
      event.target.complete();
    }
  }

  onSearchChange(event: any): void {
    const val = event.target?.value ?? event.detail?.value ?? '';
    this.searchFilter.set(val);
    this.refresh(true);
  }



  onSelectUnified(item: any): void {
    if (this.profileService.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot use chat');
      return;
    }

    if (item.conversationId) {
      this.selectConversation.emit(item.conversationId);
    } else if (item.contact?.id) {
      this.chatService.createOrGetConversation(item.contact.id).subscribe({
        next: (conv) => {
          if (conv?.id) {
            this.selectConversation.emit(conv.id);
          }
        },
        error: () => {
          this.toastService.showError('Failed to start conversation');
        }
      });
    }
  }

  getLastMessage(conversationId: string | null): ChatMessage | null {
    if (!conversationId) return null;
    return this.chatService.getLastMessage(conversationId);
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers().has(userId);
  }

  getInitials(name: string): string {
    return getInitials(name);
  }

  getAvatarColor(name: string): string {
    return getAvatarColor(name);
  }
}
