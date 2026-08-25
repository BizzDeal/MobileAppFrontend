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
    if (key.includes('food') || key.includes('restaurant') || key.includes('dining') || key.includes('cafe')) return 'food';
    if (key.includes('fashion') || key.includes('retail') || key.includes('shirt') || key.includes('cloth') || key.includes('wear') || key.includes('apparel')) return 'fashion';
    if (key.includes('mobile') || key.includes('phone') || key.includes('smartphone')) return 'mobiles';
    if (key.includes('electronic') || key.includes('tech') || key.includes('gadget') || key.includes('laptop') || key.includes('it')) return 'electronics';
    if (key.includes('beauty') || key.includes('spa') || key.includes('salon') || key.includes('cosmetic') || key.includes('makeup')) return 'beauty';
    if (key.includes('health') || key.includes('wellness') || key.includes('fitness') || key.includes('med')) return 'health';
    if (key.includes('hotel') || key.includes('stay') || key.includes('travel') || key.includes('resort')) return 'hotel';
    if (key.includes('real-estate') || key.includes('home') || key.includes('furniture') || key.includes('decor')) return 'home';
    if (key.includes('edu') || key.includes('school') || key.includes('learning')) return 'edu';
    if (key.includes('auto') || key.includes('car') || key.includes('vehicle')) return 'auto';
    if (key.includes('entertain') || key.includes('game') || key.includes('fun') || key.includes('movie')) return 'entertainment';
    if (key.includes('service') || key.includes('care')) return 'service';
    return 'sparkle';
  }
}
