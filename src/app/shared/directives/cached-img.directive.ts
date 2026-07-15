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
  selector: '[appCachedImg]',
  standalone: true,
})
export class CachedImgDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly imageCacheService = inject(ImageCacheService);

  readonly appCachedImg = input<string | null | undefined>('');
  readonly fallbackImg = input<string>('');

  constructor() {
    effect(() => {
      const url = this.appCachedImg();
      if (!url) {
        if (this.fallbackImg()) {
          this.setImageSrc(this.fallbackImg());
        } else {
          this.setImageSrc('');
        }
        return;
      }

      this.imageCacheService
        .getCachedImage(url)
        .then((cachedSrc) => {
          this.setImageSrc(cachedSrc || url);
        })
        .catch(() => {
          if (this.fallbackImg()) {
            this.setImageSrc(this.fallbackImg());
          } else {
            this.setImageSrc(url);
          }
        });
    });

    // Handle image loading failure
    this.renderer.listen(this.el.nativeElement, 'error', () => {
      const fallback = this.fallbackImg();
      if (fallback && this.getElSrc() !== fallback) {
        this.setImageSrc(fallback);
      }
    });
  }

  private setImageSrc(src: string): void {
    const nativeEl = this.el.nativeElement;
    const tagName = nativeEl.tagName.toUpperCase();

    if (tagName === 'ION-IMG') {
      this.renderer.setAttribute(nativeEl, 'src', src);
      (nativeEl as any).src = src;
    } else {
      this.renderer.setAttribute(nativeEl, 'src', src);
    }
  }

  private getElSrc(): string {
    const nativeEl = this.el.nativeElement;
    return nativeEl.getAttribute('src') || (nativeEl as any).src || '';
  }
}
