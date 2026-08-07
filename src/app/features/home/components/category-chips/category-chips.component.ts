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

  readonly categorySelect = output<string>();

  getCategoryIconType(slug?: string): string {
    const key = (slug || '').toLowerCase();
    if (key.includes('food') || key.includes('restaurant')) return 'food';
    if (key.includes('fashion') || key.includes('retail') || key.includes('shirt')) return 'fashion';
    if (key.includes('health') || key.includes('wellness') || key.includes('fitness')) return 'health';
    if (key.includes('tech') || key.includes('gadget') || key.includes('it')) return 'tech';
    if (key.includes('hotel') || key.includes('stay')) return 'hotel';
    if (key.includes('real-estate') || key.includes('home')) return 'home';
    if (key.includes('edu') || key.includes('school')) return 'edu';
    if (key.includes('service') || key.includes('care')) return 'service';
    return 'sparkle';
  }

  getCategoryColor(color?: string, slug?: string): string {
    if (color && color.startsWith('#')) return color;
    const key = (slug || '').toLowerCase();
    if (key.includes('food') || key.includes('restaurant')) return '#f97316';
    if (key.includes('fashion') || key.includes('retail')) return '#ec4899';
    if (key.includes('health') || key.includes('wellness')) return '#06b6d4';
    if (key.includes('tech') || key.includes('gadget')) return '#8b5cf6';
    if (key.includes('hotel')) return '#eab308';
    if (key.includes('real-estate') || key.includes('home')) return '#10b981';
    if (key.includes('edu')) return '#3b82f6';
    return '#2874f0';
  }
}
