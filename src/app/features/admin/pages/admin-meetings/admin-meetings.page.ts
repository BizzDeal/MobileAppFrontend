import { Component, OnInit, computed, inject, signal, HostListener } from '@angular/core';

import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, addOutline, filterOutline, locationOutline, linkOutline, createOutline, peopleOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { MeetingCardComponent } from '../../../meetings/components/meeting-card/meeting-card.component';
import { AdminMeetingsService } from '../../services/admin-meetings.service';
import { AdminRegionFilterModalComponent } from '../../components/admin-region-filter-modal/admin-region-filter-modal.component';
import { AdminMeetingActionModalComponent } from '../../components/admin-meeting-action-modal/admin-meeting-action-modal.component';
import { AdminMeetingAttendeesModalComponent } from '../../components/admin-meeting-attendees-modal/admin-meeting-attendees-modal.component';
import { MeetingWithAttendee } from '../../../meetings/services/meetings.service';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-meetings',
  templateUrl: './admin-meetings.page.html',
  styleUrls: ['./admin-meetings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, MeetingCardComponent, CardSkeletonComponent, AdminRegionFilterModalComponent]
})
export class AdminMeetingsPage implements OnInit {
  private readonly adminMeetingsService = inject(AdminMeetingsService);
  private readonly modalCtrl = inject(ModalController);

  readonly selectedTab = signal<'upcoming' | 'past'>('upcoming');
  readonly loading = this.adminMeetingsService.loading;
  
  stateId = '';
  districtId = '';

  isDesktop = window.innerWidth >= 992;
  page = 1;
  limit = this.isDesktop ? 5 : 20;
  hasMore = true;
  totalPages = 1;

  readonly meetings = computed(() => {
    const all = this.adminMeetingsService.meetings();
    const now = new Date();

    if (this.selectedTab() === 'upcoming') {
      return all.filter(m => new Date(m.meeting_date) >= now && m.status !== 'CANCELLED');
    } else {
      return all.filter(m => new Date(m.meeting_date) < now || m.status === 'CANCELLED');
    }
  });

  constructor() {
    addIcons({ calendarOutline, addOutline, filterOutline, locationOutline, linkOutline, createOutline, peopleOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit() {
    this.loadMeetings();
  }

  loadMeetings(event?: any, append = false) {
    this.adminMeetingsService.loadMeetings(this.stateId, this.districtId, this.page, this.limit, append).subscribe((res) => {
      if (res.meta) {
        this.page = res.meta.currentPage;
        this.totalPages = res.meta.totalPages;
        this.hasMore = res.meta.currentPage < res.meta.totalPages;
      } else {
        this.hasMore = false; // Fallback if no meta
      }
      if (event) {
        event.target.complete();
      }
    }, () => {
      if (event) event.target.complete();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth >= 992;
    if (this.isDesktop !== wasDesktop) {
      this.limit = this.isDesktop ? 5 : 20;
      this.page = 1;
      this.loadMeetings();
    }
  }

  loadMore(event: any) {
    if (this.hasMore) {
      this.page++;
      this.loadMeetings(event, true);
    } else {
      event.target.complete();
    }
  }

  changePageSize(event: any) {
    this.limit = parseInt(event.target.value, 10);
    this.page = 1;
    this.loadMeetings();
  }

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadMeetings();
    }
  }

  isFilterOpen = false;

  openFilter() {
    this.isFilterOpen = true;
  }

  onFilterApplied(data: { stateId: string; districtId: string }) {
    this.stateId = data.stateId;
    this.districtId = data.districtId;
    this.page = 1;
    this.loadMeetings();
  }

  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value as 'upcoming' | 'past');
  }

  async openMeetingModal(meeting?: MeetingWithAttendee) {
    const modal = await this.modalCtrl.create({
      component: AdminMeetingActionModalComponent,
      componentProps: { meeting },
      backdropDismiss: false,
      cssClass: 'admin-modal-theme'
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data) {
      if (meeting) {
        this.adminMeetingsService.updateMeeting(meeting.id, data).subscribe();
      } else {
        this.adminMeetingsService.createMeeting(data).subscribe();
      }
    } else if (role === 'delete' && meeting) {
      this.adminMeetingsService.deleteMeeting(meeting.id).subscribe();
    }
  }

  async openAttendeeModal(meeting: MeetingWithAttendee) {
    const modal = await this.modalCtrl.create({
      component: AdminMeetingAttendeesModalComponent,
      componentProps: {
        meetingId: meeting.id,
        meetingTitle: meeting.title
      },
      cssClass: 'admin-modal-theme'
    });
    await modal.present();
  }
}
