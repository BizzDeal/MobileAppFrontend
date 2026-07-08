import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { 
  IonIcon, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonAvatar, 
  IonSearchbar, 
  IonFab, 
  IonFabButton,
  IonModal,
  IonBadge,
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  chatbubbleEllipsesOutline, 
  addOutline, 
  searchOutline, 
  personOutline,
  imageOutline,
  documentTextOutline,
  micOutline
} from 'ionicons/icons';
import { ChatService } from '../../services/chat.service';
import { ChatConversation, ChatMessage } from '../../models/chat.model';
import { StartChatModalComponent } from '../start-chat-modal/start-chat-modal.component';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
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
