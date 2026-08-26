import { ChangeDetectionStrategy, Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  shareSocialOutline,
  storefrontOutline,
  ticketOutline,
  copyOutline,
  checkmarkCircleOutline,
  openOutline,
  playCircleOutline,
} from 'ionicons/icons';
import { BizzdealVideo } from '../../models/video.model';
import { SafeVideoPipe } from '../../../../shared/pipes/safe-video.pipe';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-video-player-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    SafeVideoPipe,
    CachedImgDirective,
  ],
  templateUrl: './video-player-modal.component.html',
  styleUrl: './video-player-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoPlayerModalComponent {
  private readonly toastService = inject(ToastService);

  readonly video = input<BizzdealVideo | null>(null);
  readonly isOpen = input<boolean>(false);

  readonly closeModal = output<void>();
  readonly viewSource = output<BizzdealVideo>();

  readonly getAvatarColor = getAvatarColor;
  readonly getInitials = getInitials;

  constructor() {
    addIcons({
      closeOutline,
      shareSocialOutline,
      storefrontOutline,
      ticketOutline,
      copyOutline,
      checkmarkCircleOutline,
      openOutline,
      playCircleOutline,
    });
  }

  isNativeVideo(url: string | undefined | null): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.includes('.mp4?') ||
      lower.includes('.webm?')
    );
  }

  onDismiss(): void {
    this.closeModal.emit();
  }

  onActionClick(): void {
    const v = this.video();
    if (!v) return;

    if (v.cta_url) {
      window.open(v.cta_url, '_blank');
      return;
    }

    this.viewSource.emit(v);
  }

  onShareVideo(): void {
    const v = this.video();
    if (!v) return;

    if (navigator.share) {
      navigator
        .share({
          title: v.title,
          text: `Check out ${v.title} on BizzDeal!`,
          url: v.video_url,
        })
        .catch(() => {
          this.copyVideoLink(v.video_url);
        });
    } else {
      this.copyVideoLink(v.video_url);
    }
  }

  private copyVideoLink(url: string): void {
    navigator.clipboard?.writeText(url);
    this.toastService.showSuccess('📋 Video link copied to clipboard!');
  }
}
