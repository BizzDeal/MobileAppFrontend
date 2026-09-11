import { Router } from '@angular/router';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, ModalController, AlertController, SegmentCustomEvent } from '@ionic/angular';

import { 
  AdminDashboardService, 
  AdminAnalyticsDto, 
  User, 
  Offer 
} from '../../services/admin-dashboard.service';
import { FeaturedBusinessRequestDTO } from '../../../business/models/featured-business.model';
import { Observable } from 'rxjs';
import { AdminMemberActionModalComponent } from '../../components/admin-member-action-modal/admin-member-action-modal.component';
import { AdminOfferActionModalComponent } from '../../components/admin-offer-action-modal/admin-offer-action-modal.component';
import { AdminRegionFilterModalComponent } from '../../components/admin-region-filter-modal/admin-region-filter-modal.component';
import { DashboardSkeletonComponent } from '../../../../shared/components/skeletons/dashboard-skeleton/dashboard-skeleton.component';

import { addIcons } from 'ionicons';
import { 
  peopleOutline, 
  pricetagsOutline, 
  cashOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  megaphoneOutline, 
  documentTextOutline, 
  shieldCheckmarkOutline,
  filterOutline,
  starOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, DatePipe, DashboardSkeletonComponent, AdminRegionFilterModalComponent]
})
export class AdminDashboardPage implements OnInit {
  private readonly dashboardService = inject(AdminDashboardService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);
  private readonly router = inject(Router);

  analytics$!: Observable<AdminAnalyticsDto>;
  pendingMembers$!: Observable<User[]>;
  pendingOffers$!: Observable<Offer[]>;
  pendingFeaturedRequests$!: Observable<FeaturedBusinessRequestDTO[]>;

  // Tab state: 'members' | 'offers' | 'featured'
  readonly selectedQueueTab = signal<'members' | 'offers' | 'featured'>('members');

  // Queue data signals
  private readonly _pendingMembers = signal<User[] | null>(null);
  private readonly _pendingOffers = signal<Offer[] | null>(null);
  private readonly _pendingFeaturedRequests = signal<FeaturedBusinessRequestDTO[] | null>(null);

  readonly pendingMembers = this._pendingMembers.asReadonly();
  readonly pendingOffers = this._pendingOffers.asReadonly();
  readonly pendingFeaturedRequests = this._pendingFeaturedRequests.asReadonly();

  // Tab numbers
  readonly pendingMembersCount = computed(() => this._pendingMembers()?.length ?? 0);
  readonly pendingOffersCount = computed(() => this._pendingOffers()?.length ?? 0);
  readonly pendingFeaturedCount = computed(() => this._pendingFeaturedRequests()?.length ?? 0);

  stateId = '';
  districtId = '';
  isFilterOpen = false;

  constructor() {
    addIcons({
      peopleOutline,
      pricetagsOutline,
      cashOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      megaphoneOutline,
      documentTextOutline,
      shieldCheckmarkOutline,
      filterOutline,
      starOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.refreshDashboard();
  }

  handleRefresh(event: { target: { complete: () => void } }) {
    this.refreshDashboard(event);
  }

  refreshDashboard(event?: { target: { complete: () => void } }) {
    this.analytics$ = this.dashboardService.getPlatformAnalytics(this.stateId, this.districtId);
    this.pendingMembers$ = this.dashboardService.getPendingMembers(this.stateId, this.districtId);
    this.pendingOffers$ = this.dashboardService.getPendingOffers(this.stateId, this.districtId);
    this.pendingFeaturedRequests$ = this.dashboardService.getPendingFeaturedRequests();

    this.pendingMembers$.subscribe({
      next: (data) => this._pendingMembers.set(data),
      error: (err) => {
        console.error('Failed to load pending members', err);
        this._pendingMembers.set([]);
      }
    });

    this.pendingOffers$.subscribe({
      next: (data) => this._pendingOffers.set(data),
      error: (err) => {
        console.error('Failed to load pending offers', err);
        this._pendingOffers.set([]);
      }
    });

    this.pendingFeaturedRequests$.subscribe({
      next: (data) => this._pendingFeaturedRequests.set(data),
      error: (err) => {
        console.error('Failed to load pending featured requests', err);
        this._pendingFeaturedRequests.set([]);
      }
    });

    // Subscribe to complete refresher whenever analytics completes
    this.analytics$.subscribe({
      next: () => {
        if (event) {
          event.target.complete();
        }
      },
      error: () => {
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  onQueueTabChange(event: SegmentCustomEvent) {
    const val = event.detail.value;
    if (val === 'members' || val === 'offers' || val === 'featured') {
      this.selectedQueueTab.set(val);
    }
  }

  viewMemberApplication(member: User) {
    this.router.navigate(['/admin/member-applications', member.id]);
  }

  viewOfferDetails(offer: Offer) {
    this.router.navigate(['/admin/offers', offer.id]);
  }

  viewFeaturedRequests() {
    this.router.navigate(['/admin/featured-requests'], { queryParams: { status: 'PENDING' } });
  }

  viewFeaturedRequestDetails(request: FeaturedBusinessRequestDTO) {
    this.router.navigate(['/admin/featured-requests', request.id]);
  }

  async openMemberModal(member: User) {
    const modal = await this.modalCtrl.create({
      component: AdminMemberActionModalComponent,
      componentProps: { member },
      cssClass: 'admin-modal-theme'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.action) {
      if (data.action === 'approve') {
        this.approveMember(data.memberId, true);
      } else if (data.action === 'reject') {
        this.rejectMember(data.memberId, true, undefined, data.reason);
      }
    }
  }

  async openOfferModal(offer: Offer) {
    const modal = await this.modalCtrl.create({
      component: AdminOfferActionModalComponent,
      componentProps: { offer: offer as any },
      cssClass: 'admin-modal-theme'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.action) {
      if (data.action === 'approve') {
        this.approveOffer(data.offerId, true);
      } else if (data.action === 'reject') {
        this.rejectOffer(data.offerId, true, undefined, data.reason);
      }
    }
  }

  openFilter() {
    this.isFilterOpen = true;
  }

  onFilterApplied(data: { stateId: string; districtId: string }) {
    this.stateId = data.stateId;
    this.districtId = data.districtId;
    this.refreshDashboard();
  }

  approveMember(id: string, fromModal: boolean = false, event?: Event) {
    if (event) event.stopPropagation();
    this.dashboardService.approveMember(id).subscribe(() => {
      this.refreshDashboard();
    });
  }

  async rejectMember(id: string, fromModal: boolean = false, event?: Event, reason?: string) {
    if (event) event.stopPropagation();

    if (reason && reason.trim()) {
      this.dashboardService.rejectMember(id, reason.trim()).subscribe(() => {
        this.refreshDashboard();
      });
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Reject Member',
      message: 'Please provide the reason for rejecting this member registration.',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Enter rejection reason (min 3 chars)...',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (alertData) => {
            const entered = (alertData?.reason || '').trim();
            if (entered.length < 3) {
              return false;
            }
            this.dashboardService.rejectMember(id, entered).subscribe(() => {
              this.refreshDashboard();
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  approveOffer(id: string, fromModal: boolean = false, event?: Event) {
    if (event) event.stopPropagation();
    this.dashboardService.approveOffer(id).subscribe(() => {
      this.refreshDashboard();
    });
  }

  async rejectOffer(id: string, fromModal: boolean = false, event?: Event, reason?: string) {
    if (event) event.stopPropagation();

    if (reason && reason.trim()) {
      this.dashboardService.rejectOffer(id, reason.trim()).subscribe(() => {
        this.refreshDashboard();
      });
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Reject Offer',
      message: 'Please provide the reason for rejecting this offer.',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Enter rejection reason (min 3 chars)...',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (alertData) => {
            const entered = (alertData?.reason || '').trim();
            if (entered.length < 3) {
              return false;
            }
            this.dashboardService.rejectOffer(id, entered).subscribe(() => {
              this.refreshDashboard();
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }
}
