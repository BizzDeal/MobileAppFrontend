import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { 
  AdminDashboardService, 
  AdminAnalyticsDto, 
  User, 
  Offer 
} from '../../services/admin-dashboard.service';
import { Observable } from 'rxjs';
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
  pulseOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, NgApexchartsModule, DatePipe]
})
export class AdminDashboardPage implements OnInit {
  analytics$!: Observable<AdminAnalyticsDto>;
  pendingMembers$!: Observable<User[]>;
  pendingOffers$!: Observable<Offer[]>;

  // Chart configuration
  public chartOptions: any;
  public chartType: 'area' | 'bar' = 'area';

  constructor(private dashboardService: AdminDashboardService) {
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
      pulseOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.analytics$ = this.dashboardService.getPlatformAnalytics();
    this.pendingMembers$ = this.dashboardService.getPendingMembers();
    this.pendingOffers$ = this.dashboardService.getPendingOffers();

    // Subscribe once to set up the chart data
    this.analytics$.subscribe(data => {
      this.initChart(data);
    });
  }

  initChart(data: AdminAnalyticsDto) {
    this.chartOptions = {
      series: [
        {
          name: 'Revenue',
          data: data.revenueHistory.amounts
        }
      ],
      chart: {
        height: 300,
        type: this.chartType,
        toolbar: { show: false },
        fontFamily: 'inherit'
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: data.revenueHistory.dates,
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
          type: this.chartType
        }
      };
    }
  }

  approveMember(id: string) {
    this.dashboardService.approveMember(id).subscribe(() => {
      this.pendingMembers$ = this.dashboardService.getPendingMembers(); // Reload
    });
  }

  rejectMember(id: string) {
    this.dashboardService.rejectMember(id).subscribe(() => {
      this.pendingMembers$ = this.dashboardService.getPendingMembers(); // Reload
    });
  }

  approveOffer(id: string) {
    this.dashboardService.approveOffer(id).subscribe(() => {
      this.pendingOffers$ = this.dashboardService.getPendingOffers(); // Reload
    });
  }

  rejectOffer(id: string) {
    this.dashboardService.rejectOffer(id).subscribe(() => {
      this.pendingOffers$ = this.dashboardService.getPendingOffers(); // Reload
    });
  }
}
