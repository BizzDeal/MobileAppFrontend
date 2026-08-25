import { BusinessCategoryDTO } from '../../home/models/home.model';

export type CategoryFilterType = 'ALL' | 'PERCENTAGE' | 'FIXED' | 'CASHBACK';
export type CategorySortType = 'NEWEST' | 'DISCOUNT_DESC' | 'TITLE_ASC';

export interface CategoryItemViewModel extends BusinessCategoryDTO {
  offersCount?: number;
}
