import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-admin-businesses-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-businesses-list.component.html',
  styleUrls: ['./admin-businesses-list.component.scss']
})
export class AdminBusinessesListComponent implements OnInit, OnChanges {
  @Input() searchQuery = '';
  @Input() statusFilter: 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' = 'ALL';

  businesses: AdminBusiness[] = [];
  filteredBusinesses: AdminBusiness[] = [];
  isLoading = true;

  // Enum access for template
  BusinessStatus = BusinessStatus;

  constructor(
    private adminBusinessesService: AdminBusinessesService,
    private toastController: ToastController,
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
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery'] || changes['statusFilter']) {
      this.filterBusinesses();
    }
  }

  loadBusinesses() {
    this.isLoading = true;
    this.adminBusinessesService.getBusinesses().subscribe({
      next: (response) => {
        if (response.success) {
          this.businesses = response.data;
          this.filterBusinesses();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading businesses', err);
        this.showToast('Failed to load businesses', 'danger');
        this.isLoading = false;
      }
    });
  }

  filterBusinesses() {
    let filtered = [...this.businesses];

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(b => b.status === this.statusFilter);
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        (b.name && b.name.toLowerCase().includes(query)) ||
        (b.owner_name && b.owner_name.toLowerCase().includes(query)) ||
        (b.category_name && b.category_name.toLowerCase().includes(query))
      );
    }

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
                  this.showToast(res.message, 'success');
                }
              },
              error: (err) => {
                this.showToast('Failed to update business status', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  toggleFeature(business: AdminBusiness) {
    const newFeaturedStatus = !business.is_featured;
    this.adminBusinessesService.featureBusiness(business.id, newFeaturedStatus).subscribe({
      next: (res) => {
        if (res.success) {
          business.is_featured = newFeaturedStatus;
          this.showToast(res.message, 'success');
          this.loadBusinesses();
        }
      },
      error: (err) => {
        this.showToast('Failed to update featured status', 'danger');
      }
    });
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

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}
