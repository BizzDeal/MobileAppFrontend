import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import {
  IonBadge,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chatbubbleEllipsesOutline,
  documentTextOutline,
  imageOutline,
  micOutline,
  personOutline,
  searchOutline
} from 'ionicons/icons';
import { ChatConversation, ChatMessage } from '../../models/chat.model';
import { ChatService } from '../../services/chat.service';
import { StartChatModalComponent } from '../start-chat-modal/start-chat-modal.component';

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
    IonFab,
    IonFabButton,
    IonModal,
    IonBadge,
    IonHeader,
    IonToolbar,
    IonTitle,
    StartChatModalComponent
  ],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent {
  private readonly chatService = inject(ChatService);

  readonly selectConversation = output<string>();

  readonly conversations = this.chatService.conversations;
  readonly onlineUsers = this.chatService.onlineUsers;

  readonly searchFilter = signal<string>('');
  readonly isNewChatOpen = signal<boolean>(false);

  readonly filteredConversations = computed(() => {
    const list = this.conversations();
    const query = this.searchFilter().toLowerCase().trim();
    if (!query) return list;
    return list.filter(c =>
      c.partner.full_name.toLowerCase().includes(query) ||
      c.partner.phone.toLowerCase().includes(query)
    );
  });

  constructor() {
    addIcons({
      chatbubbleEllipsesOutline,
      addOutline,
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

  onSelectConversation(conv: ChatConversation): void {
    this.selectConversation.emit(conv.id);
  }

  openNewChat(): void {
    this.isNewChatOpen.set(true);
  }

  closeNewChat(): void {
    this.isNewChatOpen.set(false);
  }

  onSelectContact(partnerId: string): void {
    const convId = this.chatService.createOrGetConversation(partnerId);
    this.selectConversation.emit(convId);
    this.closeNewChat();
  }

  getLastMessage(conversationId: string): ChatMessage | null {
    return this.chatService.getLastMessage(conversationId);
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers().has(userId);
  }
}
