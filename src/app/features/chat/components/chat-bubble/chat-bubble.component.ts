import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  IonActionSheet,
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
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

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
    IonContent,
    IonActionSheet,
    CachedImgDirective
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

  // State for action sheet toggle
  readonly showMenu = signal<boolean>(false);

  // State for image viewer modal
  readonly isImageOpen = signal<boolean>(false);

  // Voice playback states
  readonly isPlaying = signal<boolean>(false);
  readonly playbackProgress = signal<number>(0);
  private audio: HTMLAudioElement | null = null;
  private playbackInterval: any = null;

  readonly actionSheetButtons = computed(() => {
    const msg = this.message();
    const buttons: any[] = [];

    if (msg.message_type === 'TEXT') {
      buttons.push({
        text: 'Copy',
        icon: 'copy-outline',
        handler: () => this.copyMessageText()
      });
    }

    if (this.isMe() && msg.message_type === 'TEXT') {
      buttons.push({
        text: 'Edit',
        icon: 'create-outline',
        handler: () => {
          this.edit.emit(msg);
        }
      });
    }

    if (this.isMe()) {
      buttons.push({
        text: 'Delete',
        role: 'destructive',
        icon: 'trash-outline',
        handler: () => {
          this.delete.emit(msg);
        }
      });
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
      icon: 'close-outline',
      handler: () => {
        this.showMenu.set(false);
      }
    });

    return buttons;
  });

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
    if (this.actionSheetButtons().length <= 1) return;
    this.showMenu.update(v => !v);
  }

  copyMessageText(): void {
    if (this.message().message) {
      navigator.clipboard?.writeText(this.message().message || '');
    }
    this.showMenu.set(false);
  }

  closeMenu(event?: any): void {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
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
    const url = this.message().media_url;
    if (!url) return;

    if (!this.audio) {
      this.audio = new Audio(url);
      this.audio.addEventListener('ended', () => {
        this.pauseVoice();
        this.playbackProgress.set(0);
      });
      this.audio.addEventListener('timeupdate', () => {
        if (this.audio && this.audio.duration) {
          const progress = (this.audio.currentTime / this.audio.duration) * 100;
          this.playbackProgress.set(progress);
        }
      });
    }
    
    this.audio.play().then(() => {
      this.isPlaying.set(true);
    }).catch(err => {
      console.error('Audio playback failed', err);
    });
  }

  private pauseVoice(): void {
    this.isPlaying.set(false);
    if (this.audio) {
      this.audio.pause();
    }
  }

  downloadFile(event: Event): void {
    event.stopPropagation();
    const url = this.message().media_url;
    if (url) {
      window.open(url, '_blank');
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
