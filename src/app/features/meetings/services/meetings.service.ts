import { Injectable, signal } from '@angular/core';

export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type AttendeeStatus = 'INVITED' | 'ACCEPTED' | 'REJECTED' | 'ATTENDED' | 'MISSED';

export interface Meeting {
  id: string;
  created_by_id: string;
  business_id: string | null;
  title: string;
  description: string | null;
  meeting_date: string;
  location: string | null;
  meeting_link: string | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  user_id: string;
  status: AttendeeStatus;
  attended_at: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to get dates relative to today for dummy data
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

const DUMMY_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    created_by_id: 'admin1',
    business_id: 'b1',
    title: 'Monthly Sync: Marketing Strategy',
    description: 'Discussing the new marketing rollout and Q3 goals.',
    meeting_date: tomorrow.toISOString(),
    location: 'Conference Room A',
    meeting_link: null,
    status: 'SCHEDULED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm2',
    created_by_id: 'admin1',
    business_id: null,
    title: 'Vendor Partnership Review',
    description: 'Reviewing contracts and negotiating rates for next year.',
    meeting_date: nextWeek.toISOString(),
    location: null,
    meeting_link: 'https://zoom.us/j/123456789',
    status: 'SCHEDULED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm3',
    created_by_id: 'admin1',
    business_id: 'b2',
    title: 'Q2 Performance Wrap-up',
    description: 'Analyzing the quarterly results and metrics.',
    meeting_date: yesterday.toISOString(),
    location: 'Main Hall',
    meeting_link: null,
    status: 'COMPLETED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const DUMMY_ATTENDEES: MeetingAttendee[] = [
  {
    id: 'a1',
    meeting_id: 'm1',
    user_id: 'current-user-id', // Assuming member is invited to m1
    status: 'INVITED',
    attended_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'a2',
    meeting_id: 'm2',
    user_id: 'current-user-id',
    status: 'ACCEPTED',
    attended_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'a3',
    meeting_id: 'm3',
    user_id: 'current-user-id',
    status: 'ATTENDED',
    attended_at: yesterday.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export interface MeetingWithAttendee extends Meeting {
  myAttendeeRecord?: MeetingAttendee;
}

@Injectable({
  providedIn: 'root'
})
export class MeetingsService {
  private meetings = signal<Meeting[]>(DUMMY_MEETINGS);
  private attendees = signal<MeetingAttendee[]>(DUMMY_ATTENDEES);

  // We expose a computed view or a getter for the merged data
  // Assuming 'current-user-id' is the current member viewing the page.
  getMyMeetings(): MeetingWithAttendee[] {
    const allMeetings = this.meetings();
    const allAttendees = this.attendees();

    return allMeetings.map(meeting => {
      const myRecord = allAttendees.find(a => a.meeting_id === meeting.id && a.user_id === 'current-user-id');
      return {
        ...meeting,
        myAttendeeRecord: myRecord
      };
    }).filter(m => m.myAttendeeRecord); // Only show meetings they are part of
  }

  updateRSVP(meetingId: string, newStatus: AttendeeStatus) {
    this.attendees.update(curr => curr.map(a => {
      if (a.meeting_id === meetingId && a.user_id === 'current-user-id') {
        return {
          ...a,
          status: newStatus,
          updated_at: new Date().toISOString()
        };
      }
      return a;
    }));
  }
}
