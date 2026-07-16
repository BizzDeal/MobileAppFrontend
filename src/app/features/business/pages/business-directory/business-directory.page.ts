// Business Directory Page Standalone Component
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon,
  IonInput,
  IonButton,
  IonSpinner
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
import { environment } from '../../../../../environments/environment';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

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
    IonButton,
    IonSpinner,
    CachedImgDirective
  ],
  templateUrl: './business-directory.page.html',
  styleUrl: './business-directory.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessDirectoryPage implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly http = inject(HttpClient);

  readonly userRole = this.profileService.userRole;

  readonly businesses = signal<DirectoryBusinessDTO[]>([]);
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly filteredBusinesses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.businesses();
    return this.businesses().filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query) ||
      b.categoryName.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadBusinesses();
  }

  loadBusinesses(search?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const queryParams: string[] = [];
    if (search && search.trim()) {
      queryParams.push(`q=${encodeURIComponent(search.trim())}`);
    }
    const profile = this.profileService.profile();
    if (profile?.id) {
      queryParams.push(`exclude_owner_id=${encodeURIComponent(profile.id)}`);
    }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const endpoint = search && search.trim() ? `${environment.apiUrl}/businesses/search${queryString}` : `${environment.apiUrl}/businesses${queryString}`;

    this.http.get<any>(endpoint).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const items = Array.isArray(res) ? res : res?.data || res?.items || [];
        const myBusinessId = profile?.business_id;
        const myOwnerId = profile?.id;
        const myBusinessName = profile?.business_name;

        const filteredList = items.filter((b: any) => {
          if (myBusinessId && b.id === myBusinessId) return false;
          if (myOwnerId && (b.owner_id === myOwnerId || b.owner?.id === myOwnerId)) return false;
          if (myBusinessName && b.name?.toLowerCase() === myBusinessName?.toLowerCase()) return false;
          return true;
        });

        const mapped: DirectoryBusinessDTO[] = filteredList.map((b: any) => ({
          id: b.id,
          name: b.name || 'Unnamed Business',
          categoryName: b.categoryName || b.category_name || b.category?.name || 'General',
          description: b.description || 'No description provided.',
          phone: b.phone || b.owner?.phone || '',
          whatsapp: b.whatsapp || b.owner?.whatsapp || b.phone || b.owner?.phone || '',
          website: b.website || '',
          initials: b.initials || (b.name ? b.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : 'BI'),
          owner_id: b.owner_id || b.owner?.id || '',
          logoUrl: b.logoUrl || b.logo_url || b.logo?.file_url || null
        }));

        this.businesses.set(mapped);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load business directory:', err);
        this.errorMessage.set(err?.error?.message || 'Failed to load business directory.');
      }
    });
  }

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
    const value = event.target.value || '';
    this.searchQuery.set(value);
    this.loadBusinesses(value);
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
