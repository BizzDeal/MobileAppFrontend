import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, locationOutline, linkOutline, checkmarkCircleOutline, closeCircleOutline, createOutline, peopleOutline, starOutline } from 'ionicons/icons';
import { MeetingWithAttendee, AttendeeStatus } from '../../services/meetings.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { computed, inject } from '@angular/core';

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
  readonly isAdmin = input<boolean>(false);
  // Emits the meeting id and the new status
  readonly rsvpChange = output<{ meetingId: string, status: AttendeeStatus }>();
  readonly editClick = output<MeetingWithAttendee>();
  readonly viewAttendeesClick = output<MeetingWithAttendee>();

  private readonly authSession = inject(AuthSessionService);
  readonly currentUser = this.authSession.currentUser;

  readonly isHost = computed(() => {
    return this.meeting().meeting_type === 'SPOTLIGHT' && this.meeting().created_by_id === this.currentUser()?.id;
  });

  constructor() {
    addIcons({
      calendarOutline,
      locationOutline,
      linkOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      createOutline,
      peopleOutline,
      starOutline
    });
  }

  onRsvp(status: AttendeeStatus) {
    this.rsvpChange.emit({ meetingId: this.meeting().id, status });
  }

  onEdit() {
    this.editClick.emit(this.meeting());
  }

  onViewAttendees() {
    this.viewAttendeesClick.emit(this.meeting());
  }

  isUpcoming(): boolean {
    const meetingDate = new Date(this.meeting().meeting_date);
    return meetingDate >= new Date() && this.meeting().status !== 'CANCELLED';
  }
}
