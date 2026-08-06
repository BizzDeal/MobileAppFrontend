import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, addOutline, filterOutline } from 'ionicons/icons';
import { MeetingCardComponent } from '../../../meetings/components/meeting-card/meeting-card.component';
import { AdminMeetingsService } from '../../services/admin-meetings.service';
import { AdminRegionFilterModalComponent } from '../../components/admin-region-filter-modal/admin-region-filter-modal.component';
import { AdminMeetingActionModalComponent } from '../../components/admin-meeting-action-modal/admin-meeting-action-modal.component';
import { AdminMeetingAttendeesModalComponent } from '../../components/admin-meeting-attendees-modal/admin-meeting-attendees-modal.component';
import { MeetingWithAttendee } from '../../../meetings/services/meetings.service';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';

@Component({
  selector: 'app-admin-meetings',
  templateUrl: './admin-meetings.page.html',
  styleUrls: ['./admin-meetings.page.scss'],
  standalone: true,
  imports: [IonicModule, MeetingCardComponent, CardSkeletonComponent, AdminRegionFilterModalComponent]
})
export class AdminMeetingsPage implements OnInit {
  private readonly adminMeetingsService = inject(AdminMeetingsService);
  private readonly modalCtrl = inject(ModalController);

  readonly selectedTab = signal<'upcoming' | 'past'>('upcoming');
  readonly loading = this.adminMeetingsService.loading;
  
  stateId = '';
  districtId = '';

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
    addIcons({ calendarOutline, addOutline, filterOutline });
  }

  ngOnInit() {
    this.loadMeetings();
  }

  loadMeetings() {
    this.adminMeetingsService.loadMeetings(this.stateId, this.districtId).subscribe();
  }

  isFilterOpen = false;

  openFilter() {
    this.isFilterOpen = true;
  }

  onFilterApplied(data: { stateId: string; districtId: string }) {
    this.stateId = data.stateId;
    this.districtId = data.districtId;
    this.loadMeetings();
  }

  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value as 'upcoming' | 'past');
  }

  async openMeetingModal(meeting?: MeetingWithAttendee) {
    const modal = await this.modalCtrl.create({
      component: AdminMeetingActionModalComponent,
      componentProps: { meeting },
      backdropDismiss: false
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
      }
    });
    await modal.present();
  }
}
