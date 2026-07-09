// Business Directory Page Standalone Component
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  searchOutline,
  callOutline,
  chatbubbleEllipsesOutline,
  globeOutline,
  optionsOutline
} from 'ionicons/icons';
import { ChatService } from '../../../chat/services/chat.service';
import { ProfileService } from '../../../profile/services/profile.service';

export interface DirectoryBusinessDTO {
  id: string;
  name: string;
  categoryName: string;
  description: string;
  phone: string;
  whatsapp: string; // keeps BE model compatibility, though redirected to chat
  website: string;
  initials: string;
  owner_id: string;
  logoUrl?: string;
}

const MOCK_DIRECTORY_BUSINESSES: DirectoryBusinessDTO[] = [
  {
    id: 'dir-biz-1',
    name: 'Ravi Technologies',
    categoryName: 'IT Services',
    description: 'Enterprise software, cloud solutions & digital transformation.',
    phone: '+91 98765 00004',
    whatsapp: '+91 98765 00004',
    website: 'https://ravitech.com',
    initials: 'RT',
    owner_id: 'owner-4', // TechZone owner in contactsDirectory
    logoUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'dir-biz-2',
    name: 'Spice Garden Restaurant',
    categoryName: 'Restaurant',
    description: 'Premium dining with authentic regional cuisine & catering.',
    phone: '+91 98765 00006',
    whatsapp: '+91 98765 00006',
    website: 'https://spicegarden.com',
    initials: 'SG',
    owner_id: 'owner-6', // Bistro owner in contactsDirectory
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'dir-biz-3',
    name: 'Grand Horizon Hotel',
    categoryName: 'Hotels',
    description: 'Luxury stays, conference halls & banquet services.',
    phone: '+91 98765 00003',
    whatsapp: '+91 98765 00003',
    website: 'https://grandhorizon.com',
    initials: 'GH',
    owner_id: 'owner-3', // Zenith owner in contactsDirectory
    logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'dir-biz-4',
    name: 'City Care Hospital',
    categoryName: 'Healthcare',
    description: 'Multi-specialty hospital with 24/7 emergency care.',
    phone: '+91 98765 00001',
    whatsapp: '+91 98765 00001',
    website: 'https://citycare.com',
    initials: 'CC',
    owner_id: 'owner-1', // Artisan Roast owner in contactsDirectory
    logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'dir-biz-5',
    name: 'Prime Realty',
    categoryName: 'Real Estate',
    description: 'Commercial & residential property consulting.',
    phone: '+91 98765 00002',
    whatsapp: '+91 98765 00002',
    website: 'https://primerealty.com',
    initials: 'PR',
    owner_id: 'owner-2', // Vogue Avenue owner in contactsDirectory
    logoUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'dir-biz-6',
    name: 'Bright Minds Academy',
    categoryName: 'Education',
    description: 'Professional courses, coaching & skill development.',
    phone: '+91 98765 00005',
    whatsapp: '+91 98765 00005',
    website: 'https://brightminds.com',
    initials: 'BM',
    owner_id: 'owner-5', // Glamour Lounge owner in contactsDirectory
    logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&auto=format&fit=crop&q=80'
  }
];

@Component({
  selector: 'app-business-directory',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonIcon,
    IonInput,
    IonButton
  ],
  templateUrl: './business-directory.page.html',
  styleUrl: './business-directory.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessDirectoryPage {
  private readonly chatService = inject(ChatService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly userRole = computed(() => this.profileService.profile()?.role || 'CUSTOMER');

  readonly businesses = signal<DirectoryBusinessDTO[]>(MOCK_DIRECTORY_BUSINESSES);
  readonly searchQuery = signal<string>('');

  readonly filteredBusinesses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.businesses();
    return this.businesses().filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query) ||
      b.categoryName.toLowerCase().includes(query)
    );
  });

  getCategoryTheme(category: string) {
    switch (category) {
      case 'IT Services':
        return { bg: 'rgba(30, 136, 229, 0.12)', color: '#1E88E5', border: 'rgba(30, 136, 229, 0.25)', gradient: 'linear-gradient(135deg, #1E88E5, #1565C0)' };
      case 'Restaurant':
        return { bg: 'rgba(244, 81, 30, 0.12)', color: '#F4511E', border: 'rgba(244, 81, 30, 0.25)', gradient: 'linear-gradient(135deg, #F4511E, #D84315)' };
      case 'Hotels':
        return { bg: 'rgba(142, 36, 170, 0.12)', color: '#8E24AA', border: 'rgba(142, 36, 170, 0.25)', gradient: 'linear-gradient(135deg, #8E24AA, #6A1B9A)' };
      case 'Healthcare':
        return { bg: 'rgba(0, 150, 136, 0.12)', color: '#009688', border: 'rgba(0, 150, 136, 0.25)', gradient: 'linear-gradient(135deg, #009688, #00695C)' };
      case 'Real Estate':
        return { bg: 'rgba(255, 179, 0, 0.12)', color: '#FFB300', border: 'rgba(255, 179, 0, 0.25)', gradient: 'linear-gradient(135deg, #FFB300, #FF8F00)' };
      case 'Education':
        return { bg: 'rgba(3, 169, 244, 0.12)', color: '#03A9F4', border: 'rgba(3, 169, 244, 0.25)', gradient: 'linear-gradient(135deg, #03A9F4, #0288D1)' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748B', border: 'rgba(100, 116, 139, 0.25)', gradient: 'linear-gradient(135deg, #64748B, #475569)' };
    }
  }

  constructor() {
    addIcons({
      arrowBackOutline,
      searchOutline,
      callOutline,
      chatbubbleEllipsesOutline,
      globeOutline,
      optionsOutline
    });
  }

  goBack(): void {
    this.location.back();
  }

  onSearchChange(event: any): void {
    const value = event.target.value;
    this.searchQuery.set(value || '');
  }

  callBusiness(phone: string): void {
    window.open(`tel:${phone.replace(/\s+/g, '')}`, '_system');
  }

  startChat(ownerId: string): void {
    if (this.userRole() === 'CUSTOMER') {
      return;
    }
    // Initialize the conversation in the ChatService
    this.chatService.createOrGetConversation(ownerId);
    
    // Redirect to home and set active nav tab to 'chat' via query parameters
    this.router.navigate(['/home'], { queryParams: { tab: 'chat' } });
  }

  openWebsite(url: string): void {
    const targetUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
    window.open(targetUrl, '_blank');
  }
}
