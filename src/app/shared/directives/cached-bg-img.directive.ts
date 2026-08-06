import {
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
  output,
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
  readonly bgImgError = output<void>();

  private currentTestImg: HTMLImageElement | null = null;

  constructor() {
    effect(() => {
      const url = this.appCachedBgImg();
      if (!url) {
        this.clearBgImage();
        return;
      }

      this.imageCacheService
        .getCachedImage(url)
        .then((cachedSrc) => {
          this.loadAndSetBgImage(cachedSrc || url);
        })
        .catch(() => {
          if (this.fallbackBgImg()) {
            this.loadAndSetBgImage(this.fallbackBgImg());
          } else {
            this.loadAndSetBgImage(url);
          }
        });
    });
  }

  private loadAndSetBgImage(src: string): void {
    if (!src) {
      this.clearBgImage();
      return;
    }

    if (this.currentTestImg) {
      this.currentTestImg.onload = null;
      this.currentTestImg.onerror = null;
    }

    const testImg = new Image();
    this.currentTestImg = testImg;

    testImg.onload = () => {
      if (this.currentTestImg !== testImg) return;
      this.renderer.setStyle(this.el.nativeElement, 'background-image', `url("${src}")`);
      this.renderer.addClass(this.el.nativeElement, 'has-bg-img');
      this.renderer.removeClass(this.el.nativeElement, 'bg-img-broken');
    };

    testImg.onerror = () => {
      if (this.currentTestImg !== testImg) return;
      if (this.fallbackBgImg() && src !== this.fallbackBgImg()) {
        this.loadAndSetBgImage(this.fallbackBgImg());
      } else {
        this.clearBgImage();
        this.renderer.addClass(this.el.nativeElement, 'bg-img-broken');
        this.bgImgError.emit();
        this.el.nativeElement.dispatchEvent(new CustomEvent('bgImgError', { bubbles: true }));
      }
    };

    testImg.src = src;
  }

  private clearBgImage(): void {
    if (this.currentTestImg) {
      this.currentTestImg.onload = null;
      this.currentTestImg.onerror = null;
      this.currentTestImg = null;
    }
    this.renderer.removeStyle(this.el.nativeElement, 'background-image');
    this.renderer.removeClass(this.el.nativeElement, 'has-bg-img');
  }
}

