import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  play,
  playCircle,
  storefrontOutline,
  pricetagOutline,
  timeOutline,
  eyeOutline,
  heartOutline,
  heart,
  sparkles,
  checkmarkCircle,
  flashOutline,
  openOutline,
  ribbonOutline,
  shareSocialOutline,
} from 'ionicons/icons';
import { BizzdealVideo } from '../../models/video.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';

@Component({
  selector: 'app-video-card',
  standalone: true,
  imports: [CommonModule, IonIcon, CachedImgDirective],
  templateUrl: './video-card.component.html',
  styleUrl: './video-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCardComponent {
  readonly video = input.required<BizzdealVideo>();
  readonly isShort = input<boolean>(false);
  readonly videoClick = output<BizzdealVideo>();
  readonly tagClick = output<string>();
  readonly likeClick = output<BizzdealVideo>();

  readonly getAvatarColor = getAvatarColor;
  readonly getInitials = getInitials;

  constructor() {
    addIcons({
      play,
      playCircle,
      storefrontOutline,
      pricetagOutline,
      timeOutline,
      eyeOutline,
      heartOutline,
      heart,
      sparkles,
      checkmarkCircle,
      flashOutline,
      openOutline,
      ribbonOutline,
      shareSocialOutline,
    });
  }

  onCardClick(): void {
    this.videoClick.emit(this.video());
  }

  onTagClick(event: Event, tag: string): void {
    event.stopPropagation();
    this.tagClick.emit(tag);
  }

  onLikeClick(event: Event): void {
    event.stopPropagation();
    this.likeClick.emit(this.video());
  }
}
