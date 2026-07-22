import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexLegend,
  ApexDataLabels
} from 'ng-apexcharts';
import { AdminMeetingsService, AttendeeReportItem } from '../../services/admin-meetings.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
};

@Component({
  selector: 'app-admin-meeting-attendees-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, NgApexchartsModule, CachedImgDirective],
  templateUrl: './admin-meeting-attendees-modal.component.html',
  styleUrls: ['./admin-meeting-attendees-modal.component.scss']
})
export class AdminMeetingAttendeesModalComponent implements OnInit {
  @Input() meetingId!: string;
  @Input() meetingTitle!: string;

  private readonly modalCtrl = inject(ModalController);
  private readonly adminMeetingsService = inject(AdminMeetingsService);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly attendees = signal<AttendeeReportItem[]>([]);
  readonly selectedFilter = signal<'ALL' | 'ACCEPTED' | 'REJECTED' | 'PENDING'>('ALL');

  readonly filteredAttendees = computed(() => {
    const filter = this.selectedFilter();
    if (filter === 'ALL') return this.attendees();
    return this.attendees().filter(a => a.status === filter);
  });

  public chartOptions!: ChartOptions;

  ngOnInit() {
    this.loadAttendees();
  }

  loadAttendees() {
    this.loading.set(true);
    this.error.set(null);
    this.adminMeetingsService.getAttendeeReport(this.meetingId).subscribe({
      next: (res) => {
        this.attendees.set(res);
        this.updateChart(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load attendees.');
        this.loading.set(false);
      }
    });
  }

  updateChart(data: AttendeeReportItem[]) {
    const accepted = data.filter(d => d.status === 'ACCEPTED').length;
    const rejected = data.filter(d => d.status === 'REJECTED').length;
    const pending = data.filter(d => d.status === 'PENDING').length;

    this.chartOptions = {
      series: [accepted, rejected, pending],
      chart: {
        type: 'donut',
        height: 250,
        fontFamily: 'Inter, sans-serif'
      },
      labels: ['Accepted', 'Rejected', 'Pending'],
      colors: ['#10B981', '#EF4444', '#94A3B8'],
      dataLabels: {
        enabled: true,
        formatter: (val: number, opts: any) => opts.w.config.series[opts.seriesIndex]
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: { show: true },
              value: { show: true, fontSize: '24px', fontWeight: 'bold' },
              total: {
                show: true,
                showAlways: true,
                label: 'Total',
                fontSize: '14px',
                color: '#64748B',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0).toString();
                }
              }
            }
          }
        }
      },
      legend: {
        position: 'bottom'
      }
    };
  }

  onFilterChange(event: any) {
    this.selectedFilter.set(event.detail.value);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
