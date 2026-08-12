import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminCategoryActionModalComponent } from '../../components/admin-category-action-modal/admin-category-action-modal.component';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { ToastService } from '../../../../core/services/toast.service';

import { addIcons } from 'ionicons';
import { addOutline, searchOutline, createOutline, listOutline, trashOutline, albumsOutline, chevronForwardOutline, chevronBackOutline } from 'ionicons/icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, IonicModule, CardSkeletonComponent],
  templateUrl: './admin-categories.page.html',
  styleUrls: ['./admin-categories.page.scss']
})
export class AdminCategoriesPage implements OnInit, OnDestroy {
  categories: any[] = [];
  filteredCategories: any[] = [];
  displayedCategories: any[] = [];
  loading = true;
  searchQuery = '';

  // Pagination
  page = 1;
  pageSize = 15;
  totalPages = 1;

  isDesktop = window.innerWidth >= 992;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

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
      chevronForwardOutline,
      chevronBackOutline
    });
  }

  @HostListener('window:resize')
  onResize() {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth >= 992;
    if (this.isDesktop !== wasDesktop) {
      this.pageSize = this.isDesktop ? 5 : 15;
      this.page = 1;
      this.loadCategories();
    }
  }

  ngOnInit() {
    this.pageSize = this.isDesktop ? 5 : 15;
    this.loadCategories();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      if (this.isDesktop) {
        this.loadCategories();
      } else {
        this.filterCategories();
      }
    });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  loadCategories(event?: any) {
    this.loading = true;
    if (this.isDesktop) {
      this.adminBusinessesService.getCategories({ page: this.page, limit: this.pageSize, search: this.searchQuery }).subscribe({
        next: (res: any) => {
          this.displayedCategories = res.data || [];
          this.totalPages = res.meta?.totalPages || 1;
          this.loading = false;
          if (event) event.target.complete();
        },
        error: () => {
          this.loading = false;
          this.toastService.showError('Failed to load categories');
          if (event) event.target.complete();
        }
      });
    } else {
      this.adminBusinessesService.getCategories().subscribe({
        next: (res: any) => {
          if (res && res.data) {
            this.categories = res.data;
            this.filterCategories();
          }
          this.loading = false;
          if (event) event.target.complete();
        },
        error: () => {
          this.loading = false;
          this.toastService.showError('Failed to load categories');
          if (event) event.target.complete();
        }
      });
    }
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value || '';
    if (this.isDesktop) {
      this.searchSubject.next(this.searchQuery);
    } else {
      this.filterCategories();
    }
  }

  filterCategories() {
    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      this.filteredCategories = this.categories.filter(cat =>
        cat.name.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
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
    if (this.isDesktop) return;

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

  changePageSize(event: any) {
    this.pageSize = parseInt(event.target.value, 10);
    this.page = 1;
    this.loadCategories();
  }

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadCategories();
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
