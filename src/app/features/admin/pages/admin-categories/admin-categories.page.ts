import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminCategoryActionModalComponent } from '../../components/admin-category-action-modal/admin-category-action-modal.component';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { ToastService } from '../../../../core/services/toast.service';

import { addIcons } from 'ionicons';
import { addOutline, searchOutline, createOutline, listOutline, trashOutline, albumsOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, IonicModule, CardSkeletonComponent],
  templateUrl: './admin-categories.page.html',
  styleUrls: ['./admin-categories.page.scss']
})
export class AdminCategoriesPage implements OnInit {
  categories: any[] = [];
  filteredCategories: any[] = [];
  displayedCategories: any[] = [];
  loading = true;
  searchQuery = '';
  
  // Pagination
  page = 1;
  pageSize = 15;

  constructor(
    private adminBusinessesService: AdminBusinessesService,
    private modalCtrl: ModalController,
    private toastService: ToastService
  ) {
    addIcons({
      addOutline,
      searchOutline,
      createOutline,
      listOutline,
      trashOutline,
      albumsOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.adminBusinessesService.getCategories().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.categories = res.data;
          this.filterCategories();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.showError('Failed to load categories');
      }
    });
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value?.toLowerCase() || '';
    this.filterCategories();
  }

  filterCategories() {
    if (this.searchQuery.trim() !== '') {
      this.filteredCategories = this.categories.filter(cat => 
        cat.name.toLowerCase().includes(this.searchQuery) ||
        (cat.description && cat.description.toLowerCase().includes(this.searchQuery))
      );
    } else {
      this.filteredCategories = [...this.categories];
    }
    this.resetPagination();
  }

  resetPagination() {
    this.page = 1;
    this.displayedCategories = this.filteredCategories.slice(0, this.pageSize);
  }

  loadMore(event: any) {
    const nextCategories = this.filteredCategories.slice(
      this.page * this.pageSize, 
      (this.page + 1) * this.pageSize
    );
    
    if (nextCategories.length > 0) {
      this.displayedCategories = [...this.displayedCategories, ...nextCategories];
      this.page++;
    }
    
    if (event) {
      event.target.complete();
      
      if (this.displayedCategories.length >= this.filteredCategories.length) {
        event.target.disabled = true;
      }
    }
  }

  async openAddCategoryModal() {
    const modal = await this.modalCtrl.create({
      component: AdminCategoryActionModalComponent
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data && data.action === 'save') {
      this.adminBusinessesService.createCategory(data.data).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (err) => {
          this.toastService.showError(err.message || 'Failed to create category');
        }
      });
    }
  }

  async openEditCategoryModal(category: any) {
    const modal = await this.modalCtrl.create({
      component: AdminCategoryActionModalComponent,
      componentProps: { category }
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data) {
      if (data.action === 'save') {
        this.adminBusinessesService.updateCategory(category.id, data.data).subscribe({
          next: () => {
            this.loadCategories();
          },
          error: (err) => {
            this.toastService.showError(err.message || 'Failed to update category');
          }
        });
      } else if (data.action === 'delete') {
        this.adminBusinessesService.deleteCategory(category.id).subscribe({
          next: () => {
            this.loadCategories();
          },
          error: (err) => {
            this.toastService.showError(err.message || 'Failed to delete category');
          }
        });
      }
    }
  }
}
