import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  cutOutline,
  fastFoodOutline,
  fitnessOutline,
  gridOutline,
  hardwareChipOutline,
  homeOutline,
  schoolOutline,
  shirtOutline,
  sparklesOutline
} from 'ionicons/icons';
import { BusinessCategoryDTO } from '../../models/home.model';

@Component({
  selector: 'app-category-chips',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './category-chips.component.html',
  styleUrl: './category-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChipsComponent {
  readonly categories = input.required<BusinessCategoryDTO[]>();
  readonly selectedCategoryId = input.required<string>();

  readonly categorySelect = output<string>();

  constructor() {
    addIcons({ 
      gridOutline, 
      fastFoodOutline, 
      shirtOutline, 
      fitnessOutline, 
      hardwareChipOutline, 
      cutOutline,
      sparklesOutline,
      businessOutline,
      homeOutline,
      schoolOutline
    });
  }

  getIconName(icon?: string, slug?: string): string {
    const key = (icon || slug || '').toLowerCase();
    switch (key) {
      case 'restaurant':
      case 'fast-food': 
      case 'food-dining': return 'fast-food-outline';
      case 'retail':
      case 'shirt': 
      case 'fashion-retail': return 'shirt-outline';
      case 'healthcare':
      case 'fitness': 
      case 'health-wellness': return 'fitness-outline';
      case 'it-services':
      case 'hardware-chip': 
      case 'tech-gadgets': return 'hardware-chip-outline';
      case 'hotels':
      case 'business': return 'business-outline';
      case 'real-estate':
      case 'home': return 'home-outline';
      case 'education':
      case 'school': return 'school-outline';
      case 'cut': 
      case 'services-care': return 'cut-outline';
      default: return 'sparkles-outline';
    }
  }

  getCategoryColor(color?: string, slug?: string): string {
    if (color && color.startsWith('#')) return color;
    const key = (slug || '').toLowerCase();
    switch (key) {
      case 'restaurant':
      case 'food-dining': return '#F97316'; // orange
      case 'retail':
      case 'fashion-retail': return '#EC4899'; // pink
      case 'healthcare':
      case 'health-wellness': return '#38BDF8'; // blue
      case 'it-services':
      case 'tech-gadgets': return '#A78BFA'; // purple
      case 'hotels': return '#EAB308'; // yellow
      case 'real-estate': return '#10B981'; // green
      case 'education': return '#3B82F6'; // indigo
      default: return '#38BDF8';
    }
  }
}
