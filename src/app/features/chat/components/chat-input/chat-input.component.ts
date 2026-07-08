import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';
import { 
  IonIcon, 
  IonButton,
  IonTextarea,
  IonActionSheet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  attachOutline, 
  micOutline, 
  sendOutline, 
  closeCircleOutline, 
  imageOutline, 
  documentTextOutline, 
  closeOutline,
  ellipse
} from 'ionicons/icons';
import { ChatMessage, MessageType } from '../../models/chat.model';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    DecimalPipe,
    IonIcon,
    IonButton,
    IonTextarea,
    IonActionSheet
  ],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent {
  readonly editModeMessage = input<ChatMessage | null>(null);

  readonly send = output<{ 
    text: string | null; 
    type: MessageType; 
    mediaUrl?: string; 
    mediaName?: string; 
    mediaSize?: string; 
  }>();
  readonly cancelEdit = output<void>();

  readonly inputText = signal<string>('');
  
  // Simulated recording state
  readonly isRecording = signal<boolean>(false);
  readonly recordingSeconds = signal<number>(0);
  private recordingInterval: any = null;

  // Attachment Action Sheet toggle
  readonly isActionSheetOpen = signal<boolean>(false);
  readonly actionSheetButtons = [
    {
      text: 'Send Camera Photo',
      icon: 'image-outline',
      handler: () => this.sendFakeImage()
    },
    {
      text: 'Send PDF Document',
      icon: 'document-text-outline',
      handler: () => this.sendFakeFile()
    },
    {
      text: 'Cancel',
      role: 'cancel',
      icon: 'close-outline'
    }
  ];

  constructor() {
    addIcons({
      attachOutline,
      micOutline,
      sendOutline,
      closeCircleOutline,
      imageOutline,
      documentTextOutline,
      closeOutline,
      ellipse
    });

    // Sync input text when editModeMessage changes
    effect(() => {
      const editMsg = this.editModeMessage();
      if (editMsg) {
        this.inputText.set(editMsg.message || '');
      } else {
        this.inputText.set('');
      }
    });
  }

  onSendClick(): void {
    const text = this.inputText().trim();
    if (!text && !this.editModeMessage()) return;

    if (this.editModeMessage()) {
      // If editing, send text back
      this.send.emit({ text, type: MessageType.TEXT });
    } else {
      // Normal send
      this.send.emit({ text, type: MessageType.TEXT });
    }
    
    this.inputText.set('');
  }

  onCancelEditClick(): void {
    this.cancelEdit.emit();
    this.inputText.set('');
  }

  openAttachments(): void {
    this.isActionSheetOpen.set(true);
  }

  closeActionSheet(): void {
    this.isActionSheetOpen.set(false);
  }

  // Simulated Media Sending
  private sendFakeImage(): void {
    const fakeImages = [
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80'
    ];
    const randomImg = fakeImages[Math.floor(Math.random() * fakeImages.length)];
    
    this.send.emit({
      text: 'Check this out!',
      type: MessageType.IMAGE,
      mediaUrl: randomImg
    });
  }

  private sendFakeFile(): void {
    const fakeFiles = [
      { name: 'bizzdeal_membership_receipt.pdf', size: '1.2 MB' },
      { name: 'store_address_directions.pdf', size: '340 KB' },
      { name: 'exclusive_coupons_couponlist.pdf', size: '890 KB' }
    ];
    const randomFile = fakeFiles[Math.floor(Math.random() * fakeFiles.length)];

    this.send.emit({
      text: 'I attached the requested file.',
      type: MessageType.FILE,
      mediaUrl: 'http://localhost/dummy-pdf',
      mediaName: randomFile.name,
      mediaSize: randomFile.size
    });
  }

  // Voice Note Recording Simulation
  toggleRecording(): void {
    if (this.isRecording()) {
      this.stopRecordingAndSend();
    } else {
      this.startRecording();
    }
  }

  startRecording(): void {
    this.isRecording.set(true);
    this.recordingSeconds.set(0);
    this.recordingInterval = setInterval(() => {
      this.recordingSeconds.update(s => s + 1);
    }, 1000);
  }

  cancelRecording(): void {
    this.cleanupRecording();
  }

  stopRecordingAndSend(): void {
    const duration = this.recordingSeconds();
    this.cleanupRecording();
    
    this.send.emit({
      text: null,
      type: MessageType.VOICE,
      mediaUrl: 'http://localhost/dummy-audio',
      mediaName: `Voice Note (${duration}s)`,
      mediaSize: `${duration}s`
    });
  }

  private cleanupRecording(): void {
    this.isRecording.set(false);
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }
}
