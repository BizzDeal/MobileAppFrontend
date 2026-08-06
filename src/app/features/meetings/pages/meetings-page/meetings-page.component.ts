import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { IonSegment, IonSegmentButton, IonLabel, IonIcon, IonFab, IonFabButton, IonContent, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, addOutline } from 'ionicons/icons';
import { MeetingsService, AttendeeStatus, Meeting, MeetingWithAttendee } from '../../services/meetings.service';
import { MeetingCardComponent } from '../../components/meeting-card/meeting-card.component';
import { MeetingActionModalComponent } from '../../components/meeting-action-modal/meeting-action-modal.component';
import { AdminMeetingAttendeesModalComponent } from '../../../admin/components/admin-meeting-attendees-modal/admin-meeting-attendees-modal.component';
import { CardSkeletonComponent } from '../../../../shared/components/skeletons/card-skeleton/card-skeleton.component';

@Component({
  selector: 'app-meetings-page',
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonLabel, IonIcon, IonFab, IonFabButton, MeetingCardComponent, CardSkeletonComponent],
  templateUrl: './meetings-page.component.html',
  styleUrl: './meetings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingsPageComponent implements OnInit {
  private readonly meetingsService = inject(MeetingsService);
  private readonly modalCtrl = inject(ModalController);

  readonly selectedTab = signal<'upcoming' | 'past'>('upcoming');
  readonly loading = this.meetingsService.loading;

  readonly meetings = computed(() => {
    const all = this.meetingsService.getMyMeetings();
    const now = new Date();

    if (this.selectedTab() === 'upcoming') {
      return all.filter(m => new Date(m.meeting_date) >= now && m.status !== 'CANCELLED');
    } else {
      return all.filter(m => new Date(m.meeting_date) < now || m.status === 'CANCELLED');
    }
  });

  constructor() {
    addIcons({
      calendarOutline,
      addOutline
    });
  }

  ngOnInit() {
    this.meetingsService.loadMeetings().subscribe();
  }

  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value as 'upcoming' | 'past');
  }

  handleRsvp(event: { meetingId: string, status: AttendeeStatus }) {
    this.meetingsService.updateRSVP(event.meetingId, event.status);
  }

  async openCreateModal() {
    const modal = await this.modalCtrl.create({
      component: MeetingActionModalComponent,
      backdropDismiss: false
    });

    return await modal.present();
  }

  async handleEditMeeting(meeting: Meeting) {
    const modal = await this.modalCtrl.create({
      component: MeetingActionModalComponent,
      componentProps: { meeting },
      backdropDismiss: false
    });

    return await modal.present();
  }

  async handleViewAttendees(meeting: MeetingWithAttendee) {
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
