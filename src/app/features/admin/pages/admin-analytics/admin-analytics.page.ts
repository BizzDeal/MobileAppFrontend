import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AdminAnalyticsService, DetailedAnalyticsDto } from '../../services/admin-analytics.service';
import { Observable } from 'rxjs';

import { addIcons } from 'ionicons';
import { 
  peopleOutline, 
  businessOutline, 
  pricetagOutline, 
  walletOutline,
  trendingUpOutline,
  pieChartOutline,
  barChartOutline,
  refreshOutline,
  syncOutline
} from 'ionicons/icons';
import ApexCharts from 'apexcharts';

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.page.html',
  styleUrls: ['./admin-analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, NgApexchartsModule, CurrencyPipe, DecimalPipe]
})
export class AdminAnalyticsPage implements OnInit {
  analytics$!: Observable<DetailedAnalyticsDto>;
  isSyncing = false;

  public userGrowthChartOptions: any;
  public voucherPerformanceChartOptions: any;
  public businessDistributionChartOptions: any;
  public walletVolumeChartOptions: any;
  public referralConversionChartOptions: any;

  constructor(
    private analyticsService: AdminAnalyticsService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      peopleOutline,
      businessOutline,
      pricetagOutline,
      walletOutline,
      trendingUpOutline,
      pieChartOutline,
      barChartOutline,
      refreshOutline,
      syncOutline
    });
  }

  resetChart(chartId: string) {
    try {
      ApexCharts.exec(chartId, 'resetSeries');
    } catch (e) {
      console.warn(`Could not reset chart ${chartId}`, e);
    }
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.analytics$ = this.analyticsService.getDetailedAnalytics();
    this.analytics$.subscribe(data => {
      this.initCharts(data);
    });
  }

  async syncAnalytics() {
    this.isSyncing = true;
    this.analyticsService.syncAnalytics().subscribe({
      next: async (res) => {
        this.isSyncing = false;
        const toast = await this.toastCtrl.create({
          message: res.message || 'Analytics synced successfully.',
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
        this.loadData();
      },
      error: async (err) => {
        this.isSyncing = false;
        const toast = await this.toastCtrl.create({
          message: 'Failed to sync analytics.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
        console.error('Error syncing analytics:', err);
      }
    });
  }

  initCharts(data: DetailedAnalyticsDto) {
    // Shared common options for styling
    const commonChartOptions = {
      fontFamily: 'inherit',
      toolbar: { show: false }
    };

    this.userGrowthChartOptions = {
      series: [
        { name: 'Customers', data: data.userGrowth.customers },
        { name: 'Members', data: data.userGrowth.members }
      ],
      chart: { id: 'user-growth-chart', type: 'area', height: 350, ...commonChartOptions },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { categories: data.userGrowth.months },
      colors: ['#3880ff', '#2dd36f'],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 90, 100] }
      },
      legend: { position: 'top' }
    };

    this.voucherPerformanceChartOptions = {
      series: [
        { name: 'Issued', data: data.voucherPerformance.issued },
        { name: 'Redeemed', data: data.voucherPerformance.redeemed }
      ],
      chart: { id: 'voucher-performance-chart', type: 'bar', height: 350, ...commonChartOptions },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '55%', borderRadius: 5 }
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories: data.voucherPerformance.months },
      colors: ['#92949c', '#ffc409'],
      fill: { opacity: 1 },
      legend: { position: 'top' }
    };

    this.businessDistributionChartOptions = {
      series: data.businessDistribution.counts,
      chart: { id: 'business-distribution-chart', type: 'donut', height: 350, ...commonChartOptions },
      labels: data.businessDistribution.categories,
      colors: ['#3880ff', '#5260ff', '#2dd36f', '#ffc409', '#eb445a'],
      plotOptions: {
        pie: {
          donut: { size: '70%' }
        }
      },
      legend: { position: 'bottom' }
    };

    this.walletVolumeChartOptions = {
      series: [
        { name: 'Credits', data: data.walletVolume.credits },
        { name: 'Debits', data: data.walletVolume.debits }
      ],
      chart: { id: 'wallet-volume-chart', type: 'area', height: 350, ...commonChartOptions },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { categories: data.walletVolume.months },
      colors: ['#2dd36f', '#eb445a'],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 90, 100] }
      },
      legend: { position: 'top' }
    };

    this.referralConversionChartOptions = {
      series: [data.referralStats.conversionRate],
      chart: { id: 'referral-conversion-chart', type: 'radialBar', height: 350, ...commonChartOptions },
      plotOptions: {
        radialBar: {
          hollow: { size: '70%' },
          dataLabels: {
            name: { show: true, fontSize: '16px', color: '#888' },
            value: { show: true, fontSize: '24px', fontWeight: 'bold' }
          }
        }
      },
      labels: ['Conversion Rate'],
      colors: ['#5260ff']
    };
  }
}
