import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, model, output, signal } from '@angular/core';
import { IonIcon, IonSearchbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  chevronForwardOutline,
  globeOutline,
  locationOutline,
  pricetagOutline,
  receiptOutline,
  searchOutline,
  sparklesOutline,
  star,
  timeOutline
} from 'ionicons/icons';
import { BusinessDTO, OfferDTO } from '../../models/home.model';

@Component({
  selector: 'app-search-view',
  standalone: true,
  imports: [IonIcon, IonSearchbar, DatePipe],
  templateUrl: './search-view.component.html',
  styleUrl: './search-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchViewComponent {
  readonly searchQuery = model<string>('');
  
  readonly businessClick = output<BusinessDTO>();
  readonly offerClick = output<OfferDTO>();

  readonly activeTab = signal<'businesses' | 'offers'>('businesses');

  readonly fakeBusinesses = signal<BusinessDTO[]>([
    {
      id: 'biz-1',
      owner_id: 'owner-1',
      category_id: 'cat-1',
      name: 'Gourmet Garden',
      description: 'Experience organic, farm-to-table fine dining with exquisite continental cuisines and refreshing beverages.',
      website: 'https://gourmetgarden.com',
      gst_number: '36AAAAA1111A1Z1',
      logo_id: 'logo-1',
      status: 'ACTIVE',
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categoryName: 'Restaurant',
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'biz-2',
      owner_id: 'owner-2',
      category_id: 'cat-2',
      name: 'Trendy Threads',
      description: 'Your ultimate destination for curated premium casualwear, seasonal fashion collections, and customized outfits.',
      website: 'https://trendythreads.in',
      gst_number: '36AAAAA2222A1Z2',
      logo_id: 'logo-2',
      status: 'ACTIVE',
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categoryName: 'Retail',
      logoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'biz-3',
      owner_id: 'owner-3',
      category_id: 'cat-3',
      name: 'Wellness Care Pharmacy',
      description: 'Providing comprehensive healthcare support, prescription medicines, diagnostic reports, and fitness counseling.',
      website: 'https://wellnesscare.org',
      gst_number: '36AAAAA3333A1Z3',
      logo_id: 'logo-3',
      status: 'ACTIVE',
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categoryName: 'Healthcare',
      logoUrl: 'https://images.unsplash.com/photo-1607619056574-7b8f304b3b8a?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1607619056574-7b8f304b3b8a?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'biz-4',
      owner_id: 'owner-4',
      category_id: 'cat-4',
      name: 'ByteCode Technologies',
      description: 'Leading IT consulting agency specializing in full-stack web applications, cloud migrations, and artificial intelligence.',
      website: 'https://bytecodetech.com',
      gst_number: '36AAAAA4444A1Z4',
      logo_id: 'logo-4',
      status: 'ACTIVE',
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categoryName: 'IT Services',
      logoUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'biz-5',
      owner_id: 'owner-5',
      category_id: 'cat-5',
      name: 'Grand Palace Resorts',
      description: 'Five-star heritage resort offering premium luxury suites, dynamic meeting spaces, and multi-cuisine dine-ins.',
      website: 'https://grandpalaceresorts.com',
      gst_number: '36AAAAA5555A1Z5',
      logo_id: 'logo-5',
      status: 'ACTIVE',
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categoryName: 'Hotels',
      logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
    }
  ]);

  readonly fakeOffers = signal<OfferDTO[]>([
    {
      id: 'offer-1',
      business_id: 'biz-1',
      title: 'Flat 50% Off First Dinner',
      description: 'Indulge in our exquisite organic farm-to-table menu. Applicable on total bill for new customers.',
      offer_type: 'DISCOUNT',
      discount_value: 50,
      discount_type: 'PERCENTAGE',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      image_id: 'img-1',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      businessName: 'Gourmet Garden',
      businessLogoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'offer-2',
      business_id: 'biz-2',
      title: 'Buy 1 Get 1 Free (BOGO)',
      description: 'Purchase any premium outerwear dress and get another completely free. Limited period stock.',
      offer_type: 'DISCOUNT',
      discount_value: 100,
      discount_type: 'PERCENTAGE',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      image_id: 'img-2',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      businessName: 'Trendy Threads',
      businessLogoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'offer-3',
      business_id: 'biz-3',
      title: '₹250 Flat Discount on Medicines',
      description: 'Get an instant flat discount on ordering generic or prescription medicines above ₹1,000.',
      offer_type: 'DISCOUNT',
      discount_value: 250,
      discount_type: 'FIXED_AMOUNT',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      image_id: 'img-3',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      businessName: 'Wellness Care Pharmacy',
      businessLogoUrl: 'https://images.unsplash.com/photo-1607619056574-7b8f304b3b8a?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'offer-4',
      business_id: 'biz-4',
      title: 'Free 30-Min Tech Consultation',
      description: 'Get a free, detailed software architecture review and cloud optimization roadmap session.',
      offer_type: 'DISCOUNT',
      discount_value: 0,
      discount_type: 'FIXED_AMOUNT',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      image_id: 'img-4',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      businessName: 'ByteCode Technologies',
      businessLogoUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'offer-5',
      business_id: 'biz-5',
      title: '15% Off Luxury Staycations',
      description: 'Enjoy 15% discount on double-deluxe rooms including free buffet breakfasts and spa access.',
      offer_type: 'DISCOUNT',
      discount_value: 15,
      discount_type: 'PERCENTAGE',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      image_id: 'img-5',
      status: 'APPROVED',
      approved_by_id: 'admin-1',
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      businessName: 'Grand Palace Resorts',
      businessLogoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80'
    }
  ]);

  readonly filteredBusinesses = computed(() => {
    const list = this.fakeBusinesses();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter(b => 
      b.name.toLowerCase().includes(query) || 
      (b.description && b.description.toLowerCase().includes(query)) ||
      (b.categoryName && b.categoryName.toLowerCase().includes(query))
    );
  });

  readonly filteredOffers = computed(() => {
    const list = this.fakeOffers();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter(o => 
      o.title.toLowerCase().includes(query) || 
      o.description.toLowerCase().includes(query) ||
      (o.businessName && o.businessName.toLowerCase().includes(query))
    );
  });

  constructor() {
    addIcons({
      businessOutline,
      pricetagOutline,
      chevronForwardOutline,
      sparklesOutline,
      searchOutline,
      star,
      locationOutline,
      globeOutline,
      receiptOutline,
      timeOutline
    });
  }

  setTab(tab: 'businesses' | 'offers'): void {
    this.activeTab.set(tab);
  }

  onSearchInput(event: Event): void {
    const customEvent = event as CustomEvent;
    const value = (customEvent.detail?.value || '') as string;
    this.searchQuery.set(value);
  }

  onSearchClear(): void {
    this.searchQuery.set('');
  }
}
