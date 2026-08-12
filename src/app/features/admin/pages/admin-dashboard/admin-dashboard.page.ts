import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

import { 
  AdminDashboardService, 
  AdminAnalyticsDto, 
  User, 
  Offer 
} from '../../services/admin-dashboard.service';
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
  filterOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, DatePipe, DashboardSkeletonComponent, AdminRegionFilterModalComponent]
})
export class AdminDashboardPage implements OnInit {
  analytics$!: Observable<AdminAnalyticsDto>;
  pendingMembers$!: Observable<User[]>;
  pendingOffers$!: Observable<Offer[]>;


  stateId = '';
  districtId = '';

  constructor(
    private dashboardService: AdminDashboardService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      peopleOutline,
      pricetagsOutline,
      cashOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      megaphoneOutline,
      documentTextOutline,
      shieldCheckmarkOutline,
      filterOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.refreshDashboard();
  }

  handleRefresh(event: any) {
    this.refreshDashboard(event);
  }

  refreshDashboard(event?: any) {
    this.analytics$ = this.dashboardService.getPlatformAnalytics(this.stateId, this.districtId);
    this.pendingMembers$ = this.dashboardService.getPendingMembers(this.stateId, this.districtId);
    this.pendingOffers$ = this.dashboardService.getPendingOffers(this.stateId, this.districtId);

    // Subscribe to update the chart data whenever analytics refreshes
    this.analytics$.subscribe({
      next: (data) => {
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


  async openMemberModal(member: User) {
    const modal = await this.modalCtrl.create({
      component: AdminMemberActionModalComponent,
      componentProps: { member }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.action) {
      if (data.action === 'approve') {
        this.approveMember(data.memberId, true);
      } else if (data.action === 'reject') {
        this.rejectMember(data.memberId, true);
      }
    }
  }

  async openOfferModal(offer: Offer) {
    const modal = await this.modalCtrl.create({
      component: AdminOfferActionModalComponent,
      componentProps: { offer: offer as any }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.action) {
      if (data.action === 'approve') {
        this.approveOffer(data.offerId, true);
      } else if (data.action === 'reject') {
        this.rejectOffer(data.offerId, true);
      }
    }
  }

  isFilterOpen = false;

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

  rejectMember(id: string, fromModal: boolean = false, event?: Event) {
    if (event) event.stopPropagation();
    this.dashboardService.rejectMember(id).subscribe(() => {
      this.refreshDashboard();
    });
  }

  approveOffer(id: string, fromModal: boolean = false, event?: Event) {
    if (event) event.stopPropagation();
    this.dashboardService.approveOffer(id).subscribe(() => {
      this.refreshDashboard();
    });
  }

  rejectOffer(id: string, fromModal: boolean = false, event?: Event) {
    if (event) event.stopPropagation();
    this.dashboardService.rejectOffer(id).subscribe(() => {
      this.refreshDashboard();
    });
  }
}
