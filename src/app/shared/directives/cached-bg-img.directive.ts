import {
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';
import { ImageCacheService } from '../../core/platform/image-cache.service';

@Directive({
  selector: '[appCachedBgImg]',
  standalone: true,
})
export class CachedBgImgDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly imageCacheService = inject(ImageCacheService);

  readonly appCachedBgImg = input<string | null | undefined>('');
  readonly fallbackBgImg = input<string>('');

  constructor() {
    effect(() => {
      const url = this.appCachedBgImg();
      if (!url) {
        if (this.fallbackBgImg()) {
          this.setBgImage(this.fallbackBgImg());
        } else {
          this.clearBgImage();
        }
        return;
      }

      if (!this.el.nativeElement.style.backgroundImage && this.fallbackBgImg()) {
        this.setBgImage(this.fallbackBgImg());
      }

      this.imageCacheService
        .getCachedImage(url)
        .then((cachedSrc) => {
          this.setBgImage(cachedSrc || url);
        })
        .catch(() => {
          if (this.fallbackBgImg()) {
            this.setBgImage(this.fallbackBgImg());
          } else {
            this.setBgImage(url);
          }
        });
    });
  }

  private setBgImage(src: string): void {
    if (!src) {
      this.clearBgImage();
      return;
    }
    this.renderer.setStyle(this.el.nativeElement, 'background-image', `url("${src}")`);
  }

  private clearBgImage(): void {
    this.renderer.removeStyle(this.el.nativeElement, 'background-image');
  }
}
