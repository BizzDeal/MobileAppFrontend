import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BusinessCategoryDTO } from '../../models/home.model';

@Component({
  selector: 'app-category-chips',
  standalone: true,
  imports: [],
  templateUrl: './category-chips.component.html',
  styleUrl: './category-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChipsComponent {
  readonly categories = input.required<BusinessCategoryDTO[]>();
  readonly selectedCategoryId = input.required<string>();
  readonly isScrolled = input<boolean>(false);

  readonly categorySelect = output<string>();

  getCategoryIconType(slug?: string): string {
    const key = (slug || '').toLowerCase();
    if (key.includes('food') || key.includes('restaurant') || key.includes('dining')) return 'food';
    if (key.includes('fashion') || key.includes('retail') || key.includes('shirt') || key.includes('cloth')) return 'fashion';
    if (key.includes('beauty') || key.includes('spa') || key.includes('salon')) return 'beauty';
    if (key.includes('health') || key.includes('wellness') || key.includes('fitness')) return 'health';
    if (key.includes('tech') || key.includes('gadget') || key.includes('it') || key.includes('electronic')) return 'tech';
    if (key.includes('hotel') || key.includes('stay') || key.includes('travel')) return 'hotel';
    if (key.includes('real-estate') || key.includes('home')) return 'home';
    if (key.includes('edu') || key.includes('school') || key.includes('learning')) return 'edu';
    if (key.includes('auto') || key.includes('car') || key.includes('vehicle')) return 'auto';
    if (key.includes('entertain') || key.includes('game') || key.includes('fun') || key.includes('movie')) return 'entertainment';
    if (key.includes('service') || key.includes('care')) return 'service';
    return 'sparkle';
  }

  getCategoryColor(color?: string, slug?: string): string {
    if (color && color.startsWith('#')) return color;
    const key = (slug || '').toLowerCase();
    if (key.includes('food') || key.includes('restaurant')) return '#f97316';
    if (key.includes('fashion') || key.includes('retail')) return '#ec4899';
    if (key.includes('beauty') || key.includes('spa') || key.includes('salon')) return '#ec4899';
    if (key.includes('health') || key.includes('wellness')) return '#06b6d4';
    if (key.includes('tech') || key.includes('gadget')) return '#8b5cf6';
    if (key.includes('hotel') || key.includes('travel')) return '#eab308';
    if (key.includes('real-estate') || key.includes('home')) return '#10b981';
    if (key.includes('edu')) return '#3b82f6';
    if (key.includes('auto') || key.includes('car')) return '#ef4444';
    if (key.includes('entertain') || key.includes('fun')) return '#a855f7';
    return '#2874f0';
  }
}
