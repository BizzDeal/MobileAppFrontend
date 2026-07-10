import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
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
  barChartOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.page.html',
  styleUrls: ['./admin-analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, NgApexchartsModule, CurrencyPipe, DecimalPipe]
})
export class AdminAnalyticsPage implements OnInit {
  analytics$!: Observable<DetailedAnalyticsDto>;

  public userGrowthChartOptions: any;
  public voucherPerformanceChartOptions: any;
  public businessDistributionChartOptions: any;
  public walletVolumeChartOptions: any;
  public referralConversionChartOptions: any;

  constructor(private analyticsService: AdminAnalyticsService) {
    addIcons({
      peopleOutline,
      businessOutline,
      pricetagOutline,
      walletOutline,
      trendingUpOutline,
      pieChartOutline,
      barChartOutline
    });
  }

  ngOnInit() {
    this.analytics$ = this.analyticsService.getDetailedAnalytics();
    this.analytics$.subscribe(data => {
      this.initCharts(data);
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
      chart: { type: 'area', height: 350, ...commonChartOptions },
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
      chart: { type: 'bar', height: 350, ...commonChartOptions },
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
      chart: { type: 'donut', height: 350, ...commonChartOptions },
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
      chart: { type: 'area', height: 350, ...commonChartOptions },
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
      chart: { type: 'radialBar', height: 350, ...commonChartOptions },
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
