import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IonSegment, IonSegmentButton, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';
import { MeetingsService, AttendeeStatus } from '../../services/meetings.service';
import { MeetingCardComponent } from '../../components/meeting-card/meeting-card.component';

@Component({
  selector: 'app-meetings-page',
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonLabel, IonIcon, MeetingCardComponent],
  templateUrl: './meetings-page.component.html',
  styleUrl: './meetings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingsPageComponent {
  private readonly meetingsService = inject(MeetingsService);

  readonly selectedTab = signal<'upcoming' | 'past'>('upcoming');

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
      calendarOutline
    });
  }

  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value as 'upcoming' | 'past');
  }

  handleRsvp(event: { meetingId: string, status: AttendeeStatus }) {
    this.meetingsService.updateRSVP(event.meetingId, event.status);
  }
}
