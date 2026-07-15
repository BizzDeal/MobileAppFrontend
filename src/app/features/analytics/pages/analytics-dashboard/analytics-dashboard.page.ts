import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  IonLabel,
  IonSpinner
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
import { ProfileService } from '../../../profile/services/profile.service';
import { environment } from '../../../../../environments/environment';

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
    IonSpinner,
    NgApexchartsModule
  ],
  templateUrl: './analytics-dashboard.page.html',
  styleUrls: ['./analytics-dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDashboardPage implements OnInit {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly profileService = inject(ProfileService);

  // Toggle view for referrals statistic: 'trend' or 'status'
  readonly referralView = signal<'trend' | 'status'>('trend');

  readonly growthPercent = signal<number>(0);
  readonly totalReferrals = signal<number>(0);
  readonly vouchersRedeemedValue = signal<number>(0);
  readonly activeOffersCount = signal<number>(0);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Growth Trend Chart Options
  readonly growthChartOptions = signal<any>({
    series: [
      {
        name: 'Vouchers Redeemed',
        data: [0, 0, 0, 0, 0, 0]
      }
    ],
    chart: {
      id: 'growth-trends-chart',
      type: 'bar',
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
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0.1,
        opacityFrom: 0.95,
        opacityTo: 0.6,
        colorStops: [
          {
            offset: 0,
            color: '#1565C0',
            opacity: 1
          },
          {
            offset: 100,
            color: '#42A5F5',
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
      categories: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
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
        formatter: (val: number) => `${val} Vouchers`
      }
    }
  });

  // Referral Trend Chart Options
  readonly referralTrendChartOptions = signal<any>({
    series: [
      {
        name: 'Referrals',
        data: [0, 0, 0, 0, 0]
      }
    ],
    chart: {
      id: 'referral-trends-chart',
      type: 'bar',
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
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0.1,
        opacityFrom: 0.95,
        opacityTo: 0.6,
        colorStops: [
          {
            offset: 0,
            color: '#0D47A1',
            opacity: 1
          },
          {
            offset: 100,
            color: '#1E88E5',
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
  });

  // Referral Status Distribution Donut Options
  readonly referralStatusChartOptions = signal<any>({
    series: [0, 0, 0],
    labels: ['Successful', 'Pending', 'Expired'],
    chart: {
      id: 'referral-status-chart',
      type: 'donut',
      height: 220
    },
    colors: ['#10B981', '#F59E0B', '#EF4444'],
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
              formatter: () => '0'
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
      position: 'bottom',
      horizontalAlign: 'center',
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
  });

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

  ngOnInit(): void {
    this.loadRealAnalytics();
  }

  loadRealAnalytics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      offersRes: this.http.get<any>(`${environment.apiUrl}/offers`).pipe(catchError(() => of([]))),
      vouchersRes: this.http.get<any>(`${environment.apiUrl}/vouchers/history`).pipe(catchError(() => of([]))),
      referralsRes: this.http.get<any>(`${environment.apiUrl}/referrals`).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        const rawOffers: any[] = Array.isArray(res.offersRes) ? res.offersRes : res.offersRes?.data || res.offersRes?.items || [];
        const rawVouchers: any[] = Array.isArray(res.vouchersRes) ? res.vouchersRes : res.vouchersRes?.data || res.vouchersRes?.items || [];
        const rawReferrals: any[] = Array.isArray(res.referralsRes) ? res.referralsRes : res.referralsRes?.data || res.referralsRes?.items || [];

        const profile = this.profileService.profile();
        const myBusinessId = profile?.business_id;

        const myOffers = rawOffers.filter(o => 
          !myBusinessId || o.business_id === myBusinessId || o.status === 'APPROVED' || o.status === 'PENDING'
        );
        const myVouchers = rawVouchers.filter(v =>
          !myBusinessId || v.business_id === myBusinessId || v.status === 'REDEEMED' || v.status === 'CLAIMED'
        );

        // 1. Stat Cards
        const approvedOffers = myOffers.filter(o => o.status === 'APPROVED');
        this.activeOffersCount.set(approvedOffers.length);

        const redeemedVouchers = myVouchers.filter(v => v.status === 'REDEEMED');
        const redeemedVal = redeemedVouchers.reduce((sum, v) => sum + Number(v.offer?.discount_value || 0), 0);
        this.vouchersRedeemedValue.set(redeemedVal > 0 ? redeemedVal : redeemedVouchers.length);

        this.totalReferrals.set(rawReferrals.length);

        const now = new Date();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);

        const lastMonthCount = myVouchers.filter(v => {
          const d = new Date(v.redeemed_at || v.created_at);
          return d >= thirtyDaysAgo && d <= now;
        }).length;

        const prevMonthCount = myVouchers.filter(v => {
          const d = new Date(v.redeemed_at || v.created_at);
          return d >= sixtyDaysAgo && d < thirtyDaysAgo;
        }).length;

        const growth = prevMonthCount > 0 
          ? Math.round(((lastMonthCount - prevMonthCount) / prevMonthCount) * 100)
          : (lastMonthCount > 0 ? 100 : 0);
        this.growthPercent.set(growth);

        // 2. Growth Trends Chart (Last 6 Months)
        const monthsData: number[] = [];
        const monthCategories: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleString('default', { month: 'short' });
          monthCategories.push(label);

          const count = myVouchers.filter(v => {
            const vDate = new Date(v.redeemed_at || v.created_at);
            return `${vDate.getFullYear()}-${String(vDate.getMonth() + 1).padStart(2, '0')}` === monthKey;
          }).length;
          monthsData.push(count);
        }

        const currGrowthOpt = { ...this.growthChartOptions() };
        currGrowthOpt.series = [{ name: 'Vouchers Redeemed', data: monthsData }];
        currGrowthOpt.xaxis = { ...currGrowthOpt.xaxis, categories: monthCategories };
        this.growthChartOptions.set(currGrowthOpt);

        // 3. Referral Trend Chart (Last 5 Weeks)
        const weeklyData: number[] = [];
        const weekLabels: string[] = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];
        for (let i = 4; i >= 0; i--) {
          const weekStart = new Date(Date.now() - (i + 1) * 7 * 86400000);
          const weekEnd = new Date(Date.now() - i * 7 * 86400000);
          const count = rawReferrals.filter(r => {
            const rDate = new Date(r.created_at);
            return rDate >= weekStart && rDate <= weekEnd;
          }).length;
          weeklyData.push(count);
        }

        const currRefOpt = { ...this.referralTrendChartOptions() };
        currRefOpt.series = [{ name: 'Referrals', data: weeklyData }];
        currRefOpt.xaxis = { ...currRefOpt.xaxis, categories: weekLabels };
        this.referralTrendChartOptions.set(currRefOpt);

        // 4. Referral Status Chart (Donut)
        const successfulCount = rawReferrals.filter(r => r.status === 'SUCCESSFUL' || r.status === 'CONVERTED').length;
        const pendingCount = rawReferrals.filter(r => r.status === 'PENDING').length;
        const expiredCount = rawReferrals.filter(r => r.status === 'EXPIRED' || r.status === 'REJECTED').length;
        const totalCount = successfulCount + pendingCount + expiredCount;

        const currStatOpt = { ...this.referralStatusChartOptions() };
        currStatOpt.series = [successfulCount, pendingCount, expiredCount];
        if (currStatOpt.plotOptions?.pie?.donut?.labels?.total) {
          currStatOpt.plotOptions.pie.donut.labels.total.formatter = () => String(totalCount);
        }
        this.referralStatusChartOptions.set(currStatOpt);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load real analytics:', err);
        this.errorMessage.set(err?.error?.message || 'Failed to load member analytics.');
      }
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
