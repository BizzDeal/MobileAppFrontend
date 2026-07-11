import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  trendingUpOutline,
  peopleOutline,
  ticketOutline,
  pricetagOutline,
  refreshOutline
} from 'ionicons/icons';
import ApexCharts from 'apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    NgApexchartsModule
  ],
  templateUrl: './analytics-dashboard.page.html',
  styleUrls: ['./analytics-dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDashboardPage {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  // Toggle view for referrals statistic: 'trend' or 'status'
  readonly referralView = signal<'trend' | 'status'>('trend');

  // Growth Trend Chart Options
  readonly growthChartOptions = {
    series: [
      {
        name: 'Growth Rate',
        data: [10, 16, 13, 20, 18, 24] // Mock monthly growth trends
      }
    ],
    chart: {
      id: 'growth-trends-chart',
      type: 'bar' as const,
      height: 220,
      toolbar: { show: false },
      sparkline: { enabled: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '50%',
        colors: {
          ranges: []
        }
      }
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        type: 'vertical',
        shadeIntensity: 0.1,
        opacityFrom: 0.95,
        opacityTo: 0.6,
        colorStops: [
          {
            offset: 0,
            color: '#1565C0', // Deep brand blue
            opacity: 1
          },
          {
            offset: 100,
            color: '#42A5F5', // Light blue
            opacity: 0.6
          }
        ]
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#F1F5F9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px',
          fontFamily: 'Roboto'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px',
          fontFamily: 'Roboto'
        },
        formatter: (val: number) => `${val}%`
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val}% Growth`
      }
    }
  };

  // Referral Trend Chart Options
  readonly referralTrendChartOptions = {
    series: [
      {
        name: 'Referrals',
        data: [15, 28, 42, 35, 38] // Mock weekly referrals
      }
    ],
    chart: {
      id: 'referral-trends-chart',
      type: 'bar' as const,
      height: 220,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '45%'
      }
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        type: 'vertical',
        shadeIntensity: 0.1,
        opacityFrom: 0.95,
        opacityTo: 0.6,
        colorStops: [
          {
            offset: 0,
            color: '#0D47A1', // Very dark/rich blue
            opacity: 1
          },
          {
            offset: 100,
            color: '#1E88E5', // Accent blue
            opacity: 0.6
          }
        ]
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#F1F5F9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    xaxis: {
      categories: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px',
          fontFamily: 'Roboto'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px',
          fontFamily: 'Roboto'
        },
        formatter: (val: number) => Math.round(val).toString()
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} Referrals`
      }
    }
  };

  // Referral Status Distribution Donut Options (Best breakdown representation)
  readonly referralStatusChartOptions = {
    series: [83, 32, 13], // 83 Successful, 32 Pending, 13 Expired
    labels: ['Successful', 'Pending', 'Expired'],
    chart: {
      id: 'referral-status-chart',
      type: 'donut' as const,
      height: 220
    },
    colors: ['#10B981', '#F59E0B', '#EF4444'], // Green, Yellow, Red
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'Roboto',
              color: '#64748B',
              offsetY: -5
            },
            value: {
              show: true,
              fontSize: '20px',
              fontFamily: 'Roboto',
              fontWeight: 'bold',
              color: '#0F172A',
              offsetY: 5,
              formatter: (val: string) => val
            },
            total: {
              show: true,
              label: 'Total',
              color: '#64748B',
              formatter: () => '128'
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: true,
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      fontSize: '12px',
      fontFamily: 'Roboto',
      labels: {
        colors: '#64748B'
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} Referrals`
      }
    }
  };

  constructor() {
    addIcons({
      arrowBackOutline,
      trendingUpOutline,
      peopleOutline,
      ticketOutline,
      pricetagOutline,
      refreshOutline
    });
  }

  resetChart(chartId: string): void {
    try {
      ApexCharts.exec(chartId, 'resetSeries');
    } catch (e) {
      console.warn(`Could not reset chart ${chartId}`, e);
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  onSegmentChange(event: any): void {
    const val = event.detail.value;
    if (val === 'trend' || val === 'status') {
      this.referralView.set(val);
    }
  }
}
