import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import {
  IonBadge,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
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
  searchOutline
} from 'ionicons/icons';
import { ChatMessage } from '../../models/chat.model';
import { ChatService } from '../../services/chat.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { ProfileService } from '../../../profile/services/profile.service';

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
    CachedImgDirective
  ],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent {
  private readonly chatService = inject(ChatService);
  private readonly toastService = inject(ToastService);
  private readonly profileService = inject(ProfileService);

  readonly selectConversation = output<string>();

  readonly conversations = this.chatService.conversations;
  readonly contactsDirectory = this.chatService.contactsDirectory;
  readonly onlineUsers = this.chatService.onlineUsers;

  readonly searchFilter = signal<string>('');

  readonly unifiedList = computed(() => {
    const convs = this.conversations();
    const contacts = this.contactsDirectory();

    const map = new Map<string, any>();
    contacts.forEach(contact => {
      map.set(contact.id, {
        contact,
        conversationId: null,
        unread_count: 0,
        last_message_at: null,
      });
    });

    convs.forEach(conv => {
      if (map.has(conv.partner.id)) {
        const item = map.get(conv.partner.id)!;
        item.conversationId = conv.id;
        item.unread_count = conv.unread_count;
        item.last_message_at = conv.last_message_at;
      } else {
        map.set(conv.partner.id, {
          contact: conv.partner,
          conversationId: conv.id,
          unread_count: conv.unread_count,
          last_message_at: conv.last_message_at,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
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
      micOutline
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
    } else {
      this.chatService.createOrGetConversation(item.contact.id);
    }
  }

  getLastMessage(conversationId: string | null): ChatMessage | null {
    if (!conversationId) return null;
    return this.chatService.getLastMessage(conversationId);
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers().has(userId);
  }
}
