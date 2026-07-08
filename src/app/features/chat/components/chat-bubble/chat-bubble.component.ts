import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkDoneOutline,
  checkmarkOutline,
  closeOutline,
  copyOutline,
  createOutline,
  documentOutline,
  downloadOutline,
  pauseOutline,
  playOutline,
  trashOutline
} from 'ionicons/icons';
import { ChatMessage, MessageStatus } from '../../models/chat.model';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [
    DatePipe, 
    NgClass, 
    DecimalPipe,
    IonIcon, 
    IonButton,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent
  ],
  templateUrl: './chat-bubble.component.html',
  styleUrl: './chat-bubble.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatBubbleComponent {
  readonly message = input.required<ChatMessage>();
  readonly isMe = input.required<boolean>();

  readonly edit = output<ChatMessage>();
  readonly delete = output<ChatMessage>();

  // State for popover/menu toggle
  readonly showMenu = signal<boolean>(false);

  // State for image viewer modal
  readonly isImageOpen = signal<boolean>(false);

  // Voice playback simulation states
  readonly isPlaying = signal<boolean>(false);
  readonly playbackProgress = signal<number>(0);
  private playbackInterval: any = null;

  constructor() {
    addIcons({
      checkmarkOutline,
      checkmarkDoneOutline,
      documentOutline,
      downloadOutline,
      playOutline,
      pauseOutline,
      createOutline,
      trashOutline,
      copyOutline,
      closeOutline
    });
  }

  toggleMenu(): void {
    if (this.message().is_deleted) return;
    this.showMenu.update(v => !v);
  }

  copyText(event: Event): void {
    event.stopPropagation();
    if (this.message().message) {
      navigator.clipboard?.writeText(this.message().message || '');
    }
    this.showMenu.set(false);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.message());
    this.showMenu.set(false);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.message());
    this.showMenu.set(false);
  }

  closeMenu(event: Event): void {
    event.stopPropagation();
    this.showMenu.set(false);
  }

  togglePlayVoice(): void {
    if (this.isPlaying()) {
      this.pauseVoice();
    } else {
      this.playVoice();
    }
  }

  private playVoice(): void {
    this.isPlaying.set(true);
    
    // Simulate audio progress
    const duration = 100; // Simulated steps
    this.playbackInterval = setInterval(() => {
      this.playbackProgress.update(p => {
        if (p >= 100) {
          this.pauseVoice();
          return 0;
        }
        return p + 2;
      });
    }, 100);
  }

  private pauseVoice(): void {
    this.isPlaying.set(false);
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  openImage(): void {
    if (this.message().is_deleted) return;
    this.isImageOpen.set(true);
  }

  closeImage(): void {
    this.isImageOpen.set(false);
  }

  getTickIconName(status: MessageStatus): string {
    if (status === MessageStatus.SENT) {
      return 'checkmark-outline';
    }
    return 'checkmark-done-outline';
  }

  getTickColorClass(status: MessageStatus): string {
    if (status === MessageStatus.READ) {
      return 'ticks-blue';
    }
    return 'ticks-grey';
  }
}
