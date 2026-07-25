import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonActionSheet,
  IonIcon,
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  attachOutline,
  cameraOutline,
  closeCircleOutline,
  closeOutline,
  documentTextOutline,
  ellipse,
  imageOutline,
  micOutline,
  sendOutline,
  cloudUploadOutline
} from 'ionicons/icons';
import { ChatMessage, MessageType } from '../../models/chat.model';
import { ChatService } from '../../services/chat.service';
import { PermissionsService } from '../../../../core/platform/permissions.service';
import { compressImageClientSide } from '../../../../shared/utils/image-compressor.util';
import { validateFileSize } from '../../../../shared/utils/file-validator.util';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    IonIcon,
    IonTextarea,
    IonActionSheet
  ],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent {
  private readonly chatService = inject(ChatService);
  private readonly permissionsService = inject(PermissionsService);

  readonly editModeMessage = input<ChatMessage | null>(null);

  readonly send = output<{
    text: string | null;
    type: MessageType;
    mediaFileId?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: string;
  }>();
  readonly cancelEdit = output<void>();

  readonly inputText = signal<string>('');

  // Native recording state
  readonly isRecording = signal<boolean>(false);
  readonly recordingSeconds = signal<number>(0);
  private recordingInterval: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  // Uploading state
  readonly isUploading = signal<boolean>(false);

  // Attachment Action Sheet toggle
  readonly isActionSheetOpen = signal<boolean>(false);
  readonly actionSheetButtons = [
    {
      text: 'Send Camera Photo',
      icon: 'camera-outline',
      handler: () => this.triggerCameraInput()
    },
    {
      text: 'Send Photo',
      icon: 'image-outline',
      handler: () => this.triggerImageInput()
    },
    {
      text: 'Send Document',
      icon: 'document-text-outline',
      handler: () => this.triggerFileInput()
    },
    {
      text: 'Cancel',
      role: 'cancel',
      icon: 'close-outline'
    }
  ];

  @ViewChild('cameraInput', { static: false }) cameraInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('imageInput', { static: false }) imageInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  constructor() {
    addIcons({
      attachOutline,
      micOutline,
      sendOutline,
      closeCircleOutline,
      cameraOutline,
      imageOutline,
      documentTextOutline,
      closeOutline,
      ellipse,
      cloudUploadOutline
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
    if (this.isUploading()) return;
    this.isActionSheetOpen.set(true);
  }

  closeActionSheet(): void {
    this.isActionSheetOpen.set(false);
  }

  // File selection triggering
  private async triggerCameraInput(): Promise<void> {
    this.closeActionSheet();
    const hasCamera = await this.permissionsService.ensurePermission('camera');
    if (hasCamera) {
      setTimeout(() => this.cameraInputRef?.nativeElement.click(), 300);
    }
  }

  private triggerImageInput(): void {
    this.closeActionSheet();
    setTimeout(() => this.imageInputRef?.nativeElement.click(), 300);
  }

  private triggerFileInput(): void {
    this.closeActionSheet();
    setTimeout(() => this.fileInputRef?.nativeElement.click(), 300);
  }

  // Real media upload processing
  async onFileSelected(event: Event, type: 'IMAGE' | 'FILE'): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const rawFile = input.files[0];
    
    // Clear input so same file can be selected again
    input.value = '';

    const validation = validateFileSize(rawFile, 10);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    this.isUploading.set(true);

    const file = type === 'IMAGE' ? await compressImageClientSide(rawFile) : rawFile;

    this.chatService.uploadMedia(file).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.send.emit({
          text: type === 'IMAGE' ? (this.inputText().trim() || 'Sent a photo') : (this.inputText().trim() || 'Sent a document'),
          type: type === 'IMAGE' ? MessageType.IMAGE : MessageType.FILE,
          mediaFileId: res.id,
          mediaUrl: res.file_url,
          mediaName: file.name,
          mediaSize: `${Math.round(file.size / 1024)} KB`
        });
        this.inputText.set('');
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Failed to upload file', err);
        alert(err?.error?.message || 'File upload failed. Please try again.');
      }
    });
  }

  // Voice Note Recording with MediaRecorder API
  toggleRecording(): void {
    if (this.isUploading()) return;

    if (this.isRecording()) {
      this.stopRecordingAndSend();
    } else {
      this.startRecording();
    }
  }

  async startRecording(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support audio recording.');
      return;
    }

    const hasPermission = await this.permissionsService.ensurePermission(
      'microphone',
      'BizzDeal needs microphone access so you can record and send voice notes in chat.'
    );

    if (!hasPermission) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processAudioRecording();
        // Stop microphone tracks
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      
      this.isRecording.set(true);
      this.recordingSeconds.set(0);
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds.update(s => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone permission denied or error', err);
      await this.permissionsService.ensurePermission('microphone');
    }
  }


  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = null; // Prevent sending
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    this.cleanupRecording();
  }

  stopRecordingAndSend(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop(); // Triggers onstop -> processAudioRecording
    }
    this.cleanupRecording();
  }

  private processAudioRecording(): void {
    if (this.audioChunks.length === 0) return;
    
    // Create a blob and then a File
    const blob = new Blob(this.audioChunks, { type: 'audio/webm' }); // Use webm as it's common for MediaRecorder
    const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
    const duration = this.recordingSeconds();

    const validation = validateFileSize(file, 5);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    this.isUploading.set(true);
    this.chatService.uploadMedia(file).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.send.emit({
          text: null,
          type: MessageType.VOICE,
          mediaFileId: res.id,
          mediaUrl: res.file_url,
          mediaName: file.name,
          mediaSize: `${duration}s` // Keeping duration in mediaSize for simplicity as UI reads it
        });
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Failed to upload voice note', err);
        alert(err?.error?.message || 'Voice note upload failed. Please try again.');
      }
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
