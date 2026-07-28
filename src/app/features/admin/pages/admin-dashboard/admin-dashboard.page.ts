import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { 
  AdminDashboardService, 
  AdminAnalyticsDto, 
  User, 
  Offer 
} from '../../services/admin-dashboard.service';
import { Observable } from 'rxjs';
import { AdminMemberActionModalComponent } from '../../components/admin-member-action-modal/admin-member-action-modal.component';
import { AdminOfferActionModalComponent } from '../../components/admin-offer-action-modal/admin-offer-action-modal.component';
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
  barChartOutline,
  pulseOutline,
  refreshOutline
} from 'ionicons/icons';
import ApexCharts from 'apexcharts';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, NgApexchartsModule, DatePipe, DashboardSkeletonComponent]
})
export class AdminDashboardPage implements OnInit {
  analytics$!: Observable<AdminAnalyticsDto>;
  pendingMembers$!: Observable<User[]>;
  pendingOffers$!: Observable<Offer[]>;

  // Chart configuration
  public chartOptions: any;
  public chartType: 'area' | 'bar' = 'area';

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
      barChartOutline,
      pulseOutline,
      refreshOutline
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
    this.analytics$ = this.dashboardService.getPlatformAnalytics();
    this.pendingMembers$ = this.dashboardService.getPendingMembers();
    this.pendingOffers$ = this.dashboardService.getPendingOffers();

    // Subscribe to update the chart data whenever analytics refreshes
    this.analytics$.subscribe({
      next: (data) => {
        if (data && data.revenueHistory) {
          this.initChart(data);
        }
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

  initChart(data: AdminAnalyticsDto) {
    let dates = data.revenueHistory?.dates || [];
    let amounts = data.revenueHistory?.amounts || [];

    if (dates.length < 6) {
      const lastDate = dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().slice(0, 7);
      const parts = lastDate.split('-');
      const year = parseInt(parts[0], 10) || new Date().getFullYear();
      const month = (parseInt(parts[1], 10) || 1) - 1;

      const paddedDates: string[] = [];
      const paddedAmounts: number[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - i, 1);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${yStr}-${mStr}`;
        paddedDates.push(key);

        const existingIdx = dates.indexOf(key);
        if (existingIdx !== -1) {
          paddedAmounts.push(amounts[existingIdx] ?? 0);
        } else {
          paddedAmounts.push(0);
        }
      }

      dates = paddedDates;
      amounts = paddedAmounts;
    }

    this.chartOptions = {
      series: [
        {
          name: 'Revenue',
          data: amounts
        }
      ],
      chart: {
        id: 'revenue-analytics-chart',
        height: 300,
        type: this.chartType,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit'
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      markers: { size: 5, strokeWidth: 2, hover: { size: 7 } },
      grid: { show: true, strokeDashArray: 4, borderColor: '#e2e8f0' },
      tooltip: { shared: true, intersect: false },
      xaxis: {
        categories: dates,
      },
      colors: ['#3880ff'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
    };
  }

  toggleChartType() {
    this.chartType = this.chartType === 'area' ? 'bar' : 'area';
    if (this.chartOptions) {
      this.chartOptions = {
        ...this.chartOptions,
        chart: {
          ...this.chartOptions.chart,
          type: this.chartType,
          id: 'revenue-analytics-chart'
        }
      };
    }
  }

  resetChart(chartId: string) {
    try {
      ApexCharts.exec(chartId, 'resetSeries');
    } catch (e) {
      console.warn(`Could not reset chart ${chartId}`, e);
    }
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
