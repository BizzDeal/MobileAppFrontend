import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, locationOutline, linkOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { MeetingWithAttendee, AttendeeStatus } from '../../services/meetings.service';

@Component({
  selector: 'app-meeting-card',
  standalone: true,
  imports: [IonIcon, DatePipe, LowerCasePipe],
  templateUrl: './meeting-card.component.html',
  styleUrl: './meeting-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingCardComponent {
  readonly meeting = input.required<MeetingWithAttendee>();
  
  // Emits the meeting id and the new status
  readonly rsvpChange = output<{ meetingId: string, status: AttendeeStatus }>();

  constructor() {
    addIcons({
      calendarOutline,
      locationOutline,
      linkOutline,
      checkmarkCircleOutline,
      closeCircleOutline
    });
  }

  onRsvp(status: AttendeeStatus) {
    this.rsvpChange.emit({ meetingId: this.meeting().id, status });
  }

  isUpcoming(): boolean {
    const meetingDate = new Date(this.meeting().meeting_date);
    return meetingDate >= new Date() && this.meeting().status !== 'CANCELLED';
  }
}
