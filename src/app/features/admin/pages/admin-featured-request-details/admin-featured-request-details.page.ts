import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonItem,
  IonLabel,
  IonTextarea,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  star,
  starOutline,
  pricetagOutline,
  calendarOutline,
  timeOutline,
  businessOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  openOutline,
  closeOutline,
  createOutline,
  trashOutline,
  callOutline,
  mailOutline,
  logoWhatsapp,
  locationOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

import {
  FeaturedBusinessRequestDTO,
  FeaturedRequestStatus,
  CategoryLiveStatusDTO,
} from '../../../business/models/featured-business.model';
import { FeaturedBusinessService } from '../../../business/services/featured-business.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AppBackButtonService } from '../../../../core/platform/app-back-button.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';
import { AdminLogoutButtonComponent } from '../../components/admin-logout-button/admin-logout-button.component';
import { AdminFeaturedRequestEditModalComponent } from '../../components/admin-featured-request-edit-modal/admin-featured-request-edit-modal.component';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';

@Component({
  selector: 'app-admin-featured-request-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonItem,
    IonLabel,
    IonTextarea,
    CachedImgDirective,
    CardSkeletonComponent,
    AdminLogoutButtonComponent,
  ],
  templateUrl: './admin-featured-request-details.page.html',
  styleUrls: ['./admin-featured-request-details.page.scss'],
})
export class AdminFeaturedRequestDetailsPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly featuredService = inject(FeaturedBusinessService);
  private readonly alertCtrl = inject(AlertController);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);
  private readonly appBackButtonService = inject(AppBackButtonService);

  readonly request = signal<FeaturedBusinessRequestDTO | null>(null);
  readonly loading = signal<boolean>(true);
  readonly actionLoading = signal<boolean>(false);
  readonly categoryLiveStatus = signal<CategoryLiveStatusDTO | null>(null);
  readonly previewImage = signal<string | null>(null);
  readonly showRejectInput = signal<boolean>(false);

  rejectionReason = '';

  private unregisterOverlayHandler?: () => void;

  readonly isCurrentlyLive = computed(() => {
    const req = this.request();
    if (!req || req.status !== 'APPROVED') return false;
    const now = new Date();
    return new Date(req.start_date) <= now && new Date(req.end_date) >= now;
  });

  readonly hasConflict = computed(() => {
    const req = this.request();
    const liveStatus = this.categoryLiveStatus();
    if (!req || !liveStatus || !liveStatus.is_live || !liveStatus.live_request) {
      return false;
    }
    // Conflict exists if another request is active in this category
    return liveStatus.live_request.id !== req.id;
  });

  constructor() {
    addIcons({
      arrowBackOutline,
      star,
      starOutline,
      pricetagOutline,
      calendarOutline,
      timeOutline,
      businessOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      openOutline,
      closeOutline,
      createOutline,
      trashOutline,
      callOutline,
      mailOutline,
      logoWhatsapp,
      locationOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    this.unregisterOverlayHandler =
      this.appBackButtonService.registerCustomOverlayDismissHandler(() => {
        if (this.previewImage()) {
          this.closeBannerPreview();
          return true;
        }
        return false;
      });

    this.loadData();
  }

  ngOnDestroy(): void {
    this.unregisterOverlayHandler?.();
  }

  goBack(): void {
    this.appBackButtonService.back('/admin/featured-requests');
  }

  loadData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.featuredService.getById(id).subscribe({
      next: (data) => {
        this.request.set(data);
        this.loading.set(false);
        if (data.category_id) {
          this.checkCategoryLiveStatus(data.category_id);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.showError(
          extractFriendlyErrorMessage(err, 'Failed to load featured request details.'),
        );
      },
    });
  }

  private checkCategoryLiveStatus(categoryId: string): void {
    this.featuredService.getCategoryLiveStatus(categoryId).subscribe({
      next: (status) => {
        this.categoryLiveStatus.set(status);
      },
      error: () => {},
    });
  }

  getStatusColor(status?: FeaturedRequestStatus): string {
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

  async openEditModal(): Promise<void> {
    const req = this.request();
    if (!req) return;

    const modal = await this.modalCtrl.create({
      component: AdminFeaturedRequestEditModalComponent,
      componentProps: { request: req },
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.success && data.updated) {
      this.request.set(data.updated);
      if (data.updated.category_id) {
        this.checkCategoryLiveStatus(data.updated.category_id);
      }
    }
  }

  async approve(): Promise<void> {
    const req = this.request();
    if (!req) return;

    if (this.hasConflict()) {
      const liveReq = this.categoryLiveStatus()?.live_request;
      const alert = await this.alertCtrl.create({
        header: 'Category Exclusivity Conflict',
        message: `Business "${liveReq?.business_name || 'Partner'}" is currently active as the Featured Business in this category until ${new Date(
          liveReq?.end_date || '',
        ).toLocaleDateString()}. Only one live featured business is permitted per category.`,
        buttons: [{ text: 'Understood', role: 'cancel' }],
      });
      await alert.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Approve Featured Request',
      message: `Approve "${req.title}" for business "${req.business?.name || 'Partner'}"?\n\nValidity: ${new Date(
        req.start_date,
      ).toLocaleDateString()} to ${new Date(req.end_date).toLocaleDateString()}.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: () => {
            this.executeApprove(req.id);
          },
        },
      ],
    });
    await alert.present();
  }

  private executeApprove(id: string): void {
    this.actionLoading.set(true);
    this.featuredService.approveRequest(id).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.request.set(updated);
        this.toastService.showSuccess('Featured request approved successfully!');
        if (updated.category_id) {
          this.checkCategoryLiveStatus(updated.category_id);
        }
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.showError(
          extractFriendlyErrorMessage(err, 'Failed to approve featured request.'),
        );
      },
    });
  }

  toggleRejectInput(): void {
    this.showRejectInput.set(true);
  }

  cancelReject(): void {
    this.showRejectInput.set(false);
    this.rejectionReason = '';
  }

  reject(): void {
    const req = this.request();
    if (!req) return;

    const reason = this.rejectionReason.trim();
    if (reason.length < 3) {
      this.toastService.showError('Rejection reason must be at least 3 characters.');
      return;
    }

    this.actionLoading.set(true);
    this.featuredService.rejectRequest(req.id, reason).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.request.set(updated);
        this.showRejectInput.set(false);
        this.rejectionReason = '';
        this.toastService.showSuccess('Featured request rejected.');
        if (updated.category_id) {
          this.checkCategoryLiveStatus(updated.category_id);
        }
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.showError(
          extractFriendlyErrorMessage(err, 'Failed to reject request.'),
        );
      },
    });
  }

  async confirmCancelRequest(): Promise<void> {
    const req = this.request();
    if (!req) return;

    const isApproved = req.status === 'APPROVED';
    const alert = await this.alertCtrl.create({
      header: isApproved ? 'Revoke / Cancel Approved Request' : 'Cancel Request',
      message: isApproved
        ? `Are you sure you want to cancel the approved featured status for "${req.business?.name || 'Partner'}"? This will immediately remove its spotlight banner and free up the category spot.`
        : 'Are you sure you want to cancel this pending featured request?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: isApproved ? 'Yes, Revoke Spotlight' : 'Yes, Cancel',
          role: 'destructive',
          handler: () => {
            this.executeCancel(req.id);
          },
        },
      ],
    });
    await alert.present();
  }

  private executeCancel(id: string): void {
    this.actionLoading.set(true);
    this.featuredService.cancelRequest(id).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.request.set(updated);
        this.toastService.showSuccess('Featured request cancelled successfully.');
        if (updated.category_id) {
          this.checkCategoryLiveStatus(updated.category_id);
        }
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.showError(
          extractFriendlyErrorMessage(err, 'Failed to cancel request.'),
        );
      },
    });
  }

  navigateToBusiness(businessId?: string): void {
    if (businessId) {
      this.router.navigate(['/admin/businesses', businessId]);
    }
  }
}
