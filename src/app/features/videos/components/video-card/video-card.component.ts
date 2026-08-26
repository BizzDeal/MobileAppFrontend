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
  sparkles,
  checkmarkCircle,
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
      sparkles,
      checkmarkCircle,
    });
  }

  onCardClick(): void {
    this.videoClick.emit(this.video());
  }
}
