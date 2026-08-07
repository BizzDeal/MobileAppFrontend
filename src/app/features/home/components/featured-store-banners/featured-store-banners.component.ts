import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessDTO } from '../../models/home.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

@Component({
  selector: 'app-featured-store-banners',
  standalone: true,
  imports: [CommonModule, CachedImgDirective],
  templateUrl: './featured-store-banners.component.html',
  styleUrls: ['./featured-store-banners.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedStoreBannersComponent {
  stores = input<BusinessDTO[]>([]);
  storeClick = output<BusinessDTO>();

  activeSlide = signal<number>(0);

  @ViewChild('railContainer') railContainer?: ElementRef<HTMLDivElement>;

  getInitials(name: string): string {
    if (!name) return 'BD';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
    const colors = [
      'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
      'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7c3aed 100%)',
      'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
      'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #e11d48 100%)',
      'linear-gradient(135deg, #451a03 0%, #9a3412 50%, #ea580c 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el || !el.clientWidth) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 14 : el.clientWidth;
    const index = Math.round(scrollLeft / cardWidth);
    if (index !== this.activeSlide()) {
      this.activeSlide.set(index);
    }
  }

  scrollPrev(): void {
    if (this.railContainer?.nativeElement) {
      const container = this.railContainer.nativeElement;
      const scrollAmount = container.clientWidth * 0.85;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }

  scrollNext(): void {
    if (this.railContainer?.nativeElement) {
      const container = this.railContainer.nativeElement;
      const scrollAmount = container.clientWidth * 0.85;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}
