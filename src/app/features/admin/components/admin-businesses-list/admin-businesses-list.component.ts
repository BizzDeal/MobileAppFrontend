import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminBusiness, BusinessStatus } from '../../models/admin-business.model';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  banOutline, 
  starOutline, 
  star, 
  refreshOutline,
  businessOutline
} from 'ionicons/icons';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

@Component({
  selector: 'app-admin-businesses-list',
  standalone: true,
  imports: [CommonModule, IonicModule, CachedImgDirective],
  templateUrl: './admin-businesses-list.component.html',
  styleUrls: ['./admin-businesses-list.component.scss']
})
export class AdminBusinessesListComponent implements OnInit, OnChanges {
  @Input() set searchQuery(val: string) {
    this._searchQuery = val;
    this.filterSubject.next();
  }
  get searchQuery(): string {
    return this._searchQuery;
  }
  
  @Input() set statusFilter(val: 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED') {
    this._statusFilter = val;
    this.filterSubject.next();
  }
  get statusFilter(): 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' {
    return this._statusFilter;
  }

  private _searchQuery = '';
  private _statusFilter: 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' = 'ALL';
  private filterSubject = new Subject<void>();
  private filterSubscription?: Subscription;

  businesses: AdminBusiness[] = [];
  filteredBusinesses: AdminBusiness[] = [];
  isLoading = true;
  page = 1;
  limit = 20;
  hasMore = true;

  // Enum access for template
  BusinessStatus = BusinessStatus;

  constructor(
    private adminBusinessesService: AdminBusinessesService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      banOutline,
      starOutline,
      star,
      refreshOutline,
      businessOutline
    });
  }

  ngOnInit() {
    this.loadBusinesses();

    this.filterSubscription = this.filterSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.page = 1;
      this.businesses = [];
      this.loadBusinesses();
    });
  }

  ngOnDestroy() {
    this.filterSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    // handled by setters
  }

  loadBusinesses(event?: any) {
    this.isLoading = true;
    
    const query: any = {
      page: this.page,
      limit: this.limit
    };
    if (this.searchQuery) query.search = this.searchQuery;
    if (this.statusFilter !== 'ALL') query.status = this.statusFilter;

    this.adminBusinessesService.getBusinesses(query).subscribe({
      next: (response) => {
        if (response.success) {
          this.businesses = [...this.businesses, ...response.data];
          if (response.meta) {
            this.page = response.meta.currentPage;
            this.hasMore = response.meta.currentPage < response.meta.totalPages;
          } else {
            this.hasMore = response.data.length === this.limit;
          }
          this.filterBusinesses();
        }
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Error loading businesses', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  loadMore(event: any) {
    if (this.hasMore) {
      this.page++;
      this.loadBusinesses(event);
    } else {
      event.target.complete();
    }
  }

  filterBusinesses() {
    // Local fallback filter if API didn't handle it
    let filtered = [...this.businesses];
    this.filteredBusinesses = filtered;
  }

  viewBusiness(business: AdminBusiness) {
    this.router.navigate(['/admin/businesses', business.id]);
  }

  async updateStatus(business: AdminBusiness, status: BusinessStatus) {
    const alert = await this.alertController.create({
      header: 'Confirm Status Change',
      message: `Are you sure you want to change the status of ${business.name} to ${status}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: () => {
            this.adminBusinessesService.updateBusinessStatus(business.id, status).subscribe({
              next: (res) => {
                if (res.success) {
                  business.status = status;
                  this.filterBusinesses();
                }
              },
              error: (err) => {
                // Handled by interceptor
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async toggleFeature(business: AdminBusiness) {
    const newFeaturedStatus = !business.is_featured;
    const actionText = newFeaturedStatus ? 'feature' : 'unfeature';
    
    const alert = await this.alertController.create({
      header: 'Confirm Action',
      message: `Are you sure you want to ${actionText} ${business.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: () => {
            this.adminBusinessesService.featureBusiness(business.id, newFeaturedStatus).subscribe({
              next: (res) => {
                if (res.success) {
                  business.is_featured = newFeaturedStatus;
                  this.loadBusinesses();
                }
              },
              error: (err) => {
                // Handled by interceptor
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  getStatusColor(status: BusinessStatus): string {
    switch (status) {
      case BusinessStatus.ACTIVE: return 'success';
      case BusinessStatus.PENDING: return 'warning';
      case BusinessStatus.SUSPENDED: return 'danger';
      case BusinessStatus.REJECTED: return 'danger';
      default: return 'medium';
    }
  }

  getFallbackAvatar(name: string): string {
    const fallbackName = name ? encodeURIComponent(name) : 'Business';
    return `https://ui-avatars.com/api/?name=${fallbackName}&background=random&color=fff`;
  }

  getInitials(name: string): string {
    if (!name) return 'B';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}
