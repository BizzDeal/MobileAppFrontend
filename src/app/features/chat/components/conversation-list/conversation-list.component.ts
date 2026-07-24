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
  IonToolbar
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
    CachedImgDirective
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

  readonly unifiedList = computed(() => {
    const convs = this.conversations();
    const contacts = this.contactsDirectory();
    const currentUserId = this.authSession.currentUser()?.id;

    const map = new Map<string, any>();
    contacts.forEach(contact => {
      if (contact.id === currentUserId) return;
      
      map.set(contact.id, {
        contact,
        conversationId: null,
        unread_count: 0,
        last_message_at: null,
        isGroup: false,
      });
    });

    convs.forEach(conv => {
      if (conv.type === 'GROUP') {
        map.set('group_' + conv.id, {
          contact: { full_name: conv.name || 'Community Group', role: 'GROUP', profile_pic_url: null, id: 'group_' + conv.id },
          conversationId: conv.id,
          unread_count: conv.unread_count,
          last_message_at: conv.last_message_at,
          isGroup: true,
          isDefaultGroup: conv.is_default_group,
        });
      } else if (conv.partner) {
        if (conv.partner.id === currentUserId) return;
        
        if (map.has(conv.partner.id)) {
          const item = map.get(conv.partner.id)!;
          item.conversationId = conv.id;
          item.unread_count = conv.unread_count;
          item.last_message_at = conv.last_message_at;
          if (conv.partner.profile_pic_url) {
            item.contact.profile_pic_url = conv.partner.profile_pic_url;
          }
        } else {
          map.set(conv.partner.id, {
            contact: conv.partner,
            conversationId: conv.id,
            unread_count: conv.unread_count,
            last_message_at: conv.last_message_at,
            isGroup: false,
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.isGroup && !b.isGroup) return -1;
      if (b.isGroup && !a.isGroup) return 1;

      if (a.contact.role === 'ADMIN' && b.contact.role !== 'ADMIN') return -1;
      if (b.contact.role === 'ADMIN' && a.contact.role !== 'ADMIN') return 1;
      
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });
  });

  readonly filteredUnifiedList = computed(() => {
    const list = this.unifiedList();
    const query = this.searchFilter().toLowerCase().trim();
    if (!query) return list;
    return list.filter(item =>
      item.contact.full_name.toLowerCase().includes(query) ||
      item.contact.phone.toLowerCase().includes(query)
    );
  });

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
  }

  ngOnInit(): void {
    this.refresh();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  refresh(): void {
    this.chatService.refreshContactsAndConversations().subscribe();
  }

  handleRefresh(event: any): void {
    this.chatService.refreshContactsAndConversations().subscribe({
      next: () => (event as any)?.target?.complete(),
      error: () => (event as any)?.target?.complete()
    });
  }

  onSearchChange(event: any): void {
    const val = event.target?.value ?? event.detail?.value ?? '';
    this.searchFilter.set(val);
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
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    const colors = [
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Purple
      'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald
      'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Amber
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
      'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', // Cyan
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
