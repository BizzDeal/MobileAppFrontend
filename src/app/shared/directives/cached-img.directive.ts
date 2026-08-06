import {
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';
import { ImageCacheService } from '../../core/platform/image-cache.service';

import { generateAvatarSvg } from '../utils/avatar.util';

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
  readonly fallbackName = input<string | null | undefined>('');

  private getFallbackUrl(): string {
    if (this.fallbackImg()) return this.fallbackImg();
    if (this.fallbackName()) {
      return generateAvatarSvg(this.fallbackName());
    }
    return '';
  }

  constructor() {
    effect(() => {
      const url = this.appCachedImg();
      const fallback = this.getFallbackUrl();

      if (!url) {
        this.setImageSrc(fallback || '');
        return;
      }

      // Show fallback instantly while loading
      if (fallback && this.getElSrc() !== url) {
        this.setImageSrc(fallback);
      }

      this.imageCacheService
        .getCachedImage(url)
        .then((cachedSrc) => {
          const finalSrc = cachedSrc || url;
          const img = new Image();
          img.onload = () => {
            this.setImageSrc(finalSrc);
          };
          img.onerror = () => {
            if (fallback) {
              this.setImageSrc(fallback);
            } else {
              this.setImageSrc(finalSrc);
            }
          };
          img.src = finalSrc;
        })
        .catch(() => {
          if (fallback) {
            this.setImageSrc(fallback);
          } else {
            this.setImageSrc(url);
          }
        });
    });

    const handleError = () => {
      const fallback = this.getFallbackUrl();
      if (fallback && this.getElSrc() !== fallback) {
        this.setImageSrc(fallback);
      } else if (!fallback) {
        this.setImageSrc('');
      }
    };

    this.renderer.listen(this.el.nativeElement, 'error', handleError);
    this.renderer.listen(this.el.nativeElement, 'ionError', handleError);
  }

  private setImageSrc(src: string): void {
    const nativeEl = this.el.nativeElement;
    const tagName = nativeEl.tagName.toUpperCase();

    if (!src) {
      this.renderer.setStyle(nativeEl, 'display', 'none');
      if (tagName === 'ION-IMG') {
        this.renderer.setAttribute(nativeEl, 'src', '');
      } else if ('src' in nativeEl) {
        this.renderer.setAttribute(nativeEl, 'src', '');
        (nativeEl as any).src = '';
      }
      return;
    }

    this.renderer.removeStyle(nativeEl, 'display');
    if (tagName === 'ION-IMG') {
      this.renderer.setAttribute(nativeEl, 'src', src);
      (nativeEl as any).src = src;
    } else {
      this.renderer.setAttribute(nativeEl, 'src', src);
      if ('src' in nativeEl) {
        (nativeEl as any).src = src;
      }
    }
  }

  private getElSrc(): string {
    const nativeEl = this.el.nativeElement;
    return nativeEl.getAttribute('src') || (nativeEl as any).src || '';
  }
}
