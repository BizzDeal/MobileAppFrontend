import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  output,
  signal,
  ViewChild
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, personOutline, timeOutline } from 'ionicons/icons';
import { ChatMessage, MessageType } from '../../models/chat.model';
import { ChatService } from '../../services/chat.service';
import { ChatBubbleComponent } from '../chat-bubble/chat-bubble.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    NgClass,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonButtons,
    ChatBubbleComponent,
    ChatInputComponent
  ],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatRoomComponent {
  private readonly chatService = inject(ChatService);

  readonly closeChat = output<void>();

  @ViewChild('scrollContainer', { static: false }) private scrollContainer!: ElementRef;

  readonly activeConversation = this.chatService.activeConversation;
  readonly activeMessages = this.chatService.activeMessages;
  readonly typingStates = this.chatService.typingStates;
  readonly onlineUsers = this.chatService.onlineUsers;

  // Editing state
  readonly editingMessage = signal<ChatMessage | null>(null);

  readonly isPartnerTyping = computed(() => {
    const conv = this.activeConversation();
    if (!conv) return false;
    return this.typingStates().get(conv.id) || false;
  });

  readonly isPartnerOnline = computed(() => {
    const conv = this.activeConversation();
    if (!conv) return false;
    return this.onlineUsers().has(conv.partner.id);
  });

  constructor() {
    addIcons({ arrowBackOutline, personOutline, timeOutline });

    // Scroll to bottom automatically whenever messages update
    effect(() => {
      const msgs = this.activeMessages();
      if (msgs.length > 0) {
        this.scrollToBottom();
      }
    });

    // Scroll to bottom when partner starts/stops typing
    effect(() => {
      const typing = this.isPartnerTyping();
      if (typing) {
        this.scrollToBottom();
      }
    });
  }

  onBack(): void {
    this.chatService.setActiveConversation(null);
    this.closeChat.emit();
  }

  onSendMessage(event: {
    text: string | null;
    type: MessageType;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: string;
  }): void {
    const editMsg = this.editingMessage();

    if (editMsg) {
      // Handle Message Editing
      if (event.text) {
        this.chatService.editMessage(editMsg.id, event.text);
      }
      this.editingMessage.set(null);
    } else {
      // Handle normal message send
      this.chatService.sendMessage(
        event.text,
        event.type,
        event.mediaUrl,
        event.mediaName,
        event.mediaSize
      );
    }

    this.scrollToBottom();
  }

  onEditMessage(msg: ChatMessage): void {
    this.editingMessage.set(msg);
  }

  onDeleteMessage(msg: ChatMessage): void {
    this.chatService.deleteMessage(msg.id);
  }

  onCancelEdit(): void {
    this.editingMessage.set(null);
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.scrollContainer && this.scrollContainer.nativeElement) {
          this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        }
      }, 80);
    } catch (err) { }
  }

  // Group messages helper for separating by date in html template
  shouldShowDateDivider(index: number, messages: ChatMessage[]): boolean {
    if (index === 0) return true;

    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    const currDate = new Date(messages[index].created_at).toDateString();

    return prevDate !== currDate;
  }

  getDateDividerText(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
}
