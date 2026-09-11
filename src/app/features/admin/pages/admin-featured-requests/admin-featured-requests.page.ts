import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  star,
  starOutline,
  timeOutline,
  calendarOutline,
  businessOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  hourglassOutline,
  personOutline,
  openOutline,
  filterOutline,
  imageOutline,
  chevronForwardOutline,
  checkmarkOutline,
  closeOutline,
  informationCircleOutline
} from 'ionicons/icons';

import { FeaturedBusinessService } from '../../../business/services/featured-business.service';
import {
  FeaturedBusinessRequestDTO,
  FeaturedRequestStatus,
  CategoryLiveStatusDTO
} from '../../../business/models/featured-business.model';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { ToastService } from '../../../../core/services/toast.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { AppBackButtonService } from '../../../../core/platform/app-back-button.service';

@Component({
  selector: 'app-admin-featured-requests',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, CardSkeletonComponent, CachedImgDirective],
  templateUrl: './admin-featured-requests.page.html',
  styleUrls: ['./admin-featured-requests.page.scss']
})
export class AdminFeaturedRequestsPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly featuredService = inject(FeaturedBusinessService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastService = inject(ToastService);
  private readonly appBackButtonService = inject(AppBackButtonService);
  private readonly route = inject(ActivatedRoute);

  readonly requests = signal<FeaturedBusinessRequestDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly selectedStatus = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly categoryLiveMap = signal<Record<string, CategoryLiveStatusDTO>>({});
  readonly previewImage = signal<string | null>(null);

  isDesktop = window.innerWidth >= 992;

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private unregisterOverlayHandler?: () => void;

  readonly filteredRequests = computed(() => {
    let list = this.requests();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(r =>
        (r.title && r.title.toLowerCase().includes(query)) ||
        (r.business?.name && r.business.name.toLowerCase().includes(query)) ||
        (r.category?.name && r.category.name.toLowerCase().includes(query))
      );
    }
    return list;
  });

  constructor() {
    addIcons({
      star,
      starOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      informationCircleOutline,
      calendarOutline,
      businessOutline,
      filterOutline,
      imageOutline,
      chevronForwardOutline,
      checkmarkOutline,
      closeOutline
    });
  }

  ngOnInit(): void {
    this.unregisterOverlayHandler = this.appBackButtonService.registerCustomOverlayDismissHandler(() => {
      if (this.previewImage()) {
        this.closeBannerPreview();
        return true;
      }
      return false;
    });

    const statusParam = this.route.snapshot.queryParamMap.get('status');
    if (statusParam) {
      this.selectedStatus.set(statusParam);
    }
    this.loadRequests();

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => {
        this.searchQuery.set(q);
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.unregisterOverlayHandler?.();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isDesktop = window.innerWidth >= 992;
  }

  onSearch(event: any): void {
    const q = event.target?.value || '';
    this.searchSubject.next(q);
  }

  onStatusSegmentChange(event: any): void {
    this.selectedStatus.set(event.detail?.value || 'ALL');
    this.loadRequests();
  }

  loadRequests(event?: any): void {
    this.loading.set(true);
    const query: { status?: string } = {};
    if (this.selectedStatus() !== 'ALL') {
      query.status = this.selectedStatus();
    }

    this.featuredService.getAllRequests(query).subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
        if (event) event.target.complete();

        // Check category live exclusivity for pending requests
        this.checkCategoryExclusivities(data);
      },
      error: () => {
        this.loading.set(false);
        if (event) event.target.complete();
      }
    });
  }

  private checkCategoryExclusivities(requests: FeaturedBusinessRequestDTO[]): void {
    const uniqueCategoryIds = Array.from(
      new Set(requests.filter(r => r.status === 'PENDING').map(r => r.category_id))
    );

    const currentMap = { ...this.categoryLiveMap() };
    for (const catId of uniqueCategoryIds) {
      if (!catId) continue;
      this.featuredService.getCategoryLiveStatus(catId).subscribe({
        next: (status) => {
          currentMap[catId] = status;
          this.categoryLiveMap.set({ ...currentMap });
        },
        error: () => {}
      });
    }
  }

  getConflict(request: FeaturedBusinessRequestDTO): CategoryLiveStatusDTO | null {
    if (request.status !== 'PENDING') return null;
    const catStatus = this.categoryLiveMap()[request.category_id];
    if (catStatus && catStatus.is_live && catStatus.live_request) {
      // If the live request belongs to another business or is a different request
      if (catStatus.live_request.id !== request.id) {
        return catStatus;
      }
    }
    return null;
  }

  async onApprove(request: FeaturedBusinessRequestDTO): Promise<void> {
    const conflict = this.getConflict(request);
    if (conflict && conflict.live_request) {
      const alert = await this.alertCtrl.create({
        header: 'Category Exclusivity Conflict',
        subHeader: `Category "${request.category?.name || 'Current Category'}" is Busy`,
        message: `Business "${conflict.live_request.business_name}" already has an ACTIVE live featured slot in this category until ${new Date(conflict.live_request.end_date).toLocaleDateString()}.\n\nUnder exclusivity rules, each category can only have ONE live featured business. You cannot approve another request until the current one ends.`,
        buttons: [{ text: 'Understood', role: 'cancel' }]
      });
      await alert.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Approve Featured Request',
      message: `Approve "${request.title}" for business "${request.business?.name || 'Unknown'}"?\n\nValidity: ${new Date(request.start_date).toLocaleDateString()} to ${new Date(request.end_date).toLocaleDateString()}.\n\nThis business will be marked as Featured in its category for this timeframe.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: () => {
            this.executeApprove(request.id);
          }
        }
      ]
    });
    await alert.present();
  }

  private executeApprove(id: string): void {
    this.featuredService.approveRequest(id).subscribe({
      next: (updated) => {
        this.toastService.showSuccess('Featured request approved successfully!');
        this.requests.update(list => list.map(r => r.id === id ? { ...r, status: 'APPROVED' as FeaturedRequestStatus, approved_at: new Date().toISOString() } : r));
        // Refresh to update category statuses
        this.loadRequests();
      },
      error: () => {}
    });
  }

  async onReject(request: FeaturedBusinessRequestDTO): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Reject Featured Request',
      message: `Please specify the reason for rejecting "${request.title}".`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for rejection (mandatory)...'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          role: 'destructive',
          handler: (data: { reason?: string }) => {
            const reason = data.reason?.trim();
            if (!reason) {
              this.toastService.showError('Rejection reason is required.');
              return false;
            }
            this.executeReject(request.id, reason);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private executeReject(id: string, reason: string): void {
    this.featuredService.rejectRequest(id, reason).subscribe({
      next: () => {
        this.toastService.showSuccess('Featured request rejected.');
        this.requests.update(list => list.map(r => r.id === id ? { ...r, status: 'REJECTED' as FeaturedRequestStatus, rejection_reason: reason } : r));
      },
      error: () => {}
    });
  }

  getStatusBadgeColor(status: FeaturedRequestStatus): string {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      case 'EXPIRED':
      case 'CANCELLED':
      default:
        return 'medium';
    }
  }

  openBannerPreview(url?: string | null): void {
    if (url) {
      this.previewImage.set(url);
    }
  }

  closeBannerPreview(): void {
    this.previewImage.set(null);
  }

  viewRequestDetails(request: FeaturedBusinessRequestDTO): void {
    this.router.navigate(['/admin/featured-requests', request.id]);
  }
}
