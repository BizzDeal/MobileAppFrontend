import { ChangeDetectionStrategy, Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { IonContent } from '@ionic/angular/standalone';
import { ConversationListComponent } from '../../../chat/components/conversation-list/conversation-list.component';
import { ChatRoomComponent } from '../../../chat/components/chat-room/chat-room.component';
import { ChatService } from '../../../chat/services/chat.service';

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [
    IonContent,
    ConversationListComponent,
    ChatRoomComponent
],
  templateUrl: './admin-chat.page.html',
  styleUrl: './admin-chat.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminChatPage {
  private readonly chatService = inject(ChatService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  
  readonly selectedConversationId = this.chatService.activeConversationId;

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const conversationId = params['conversation_id'];
      if (conversationId) {
        this.chatService.setActiveConversation(conversationId);
      }
    });
  }

  ionViewWillEnter(): void {
    this.chatService.refreshContactsAndConversations().subscribe();
  }

  onConversationSelect(id: string): void {
    this.chatService.setActiveConversation(id);
  }

  onCloseChatRoom(): void {
    this.chatService.setActiveConversation(null);
  }
}
