import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ConversationListComponent } from '../../../chat/components/conversation-list/conversation-list.component';
import { ChatRoomComponent } from '../../../chat/components/chat-room/chat-room.component';
import { ChatService } from '../../../chat/services/chat.service';

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    ConversationListComponent,
    ChatRoomComponent
  ],
  templateUrl: './admin-chat.page.html',
  styleUrl: './admin-chat.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminChatPage {
  private readonly chatService = inject(ChatService);
  
  readonly selectedConversationId = this.chatService.activeConversationId;

  onConversationSelect(id: string): void {
    this.chatService.setActiveConversation(id);
  }

  onCloseChatRoom(): void {
    this.chatService.setActiveConversation(null);
  }
}
