import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../../../core/services/auth-session.service';

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

export interface MeetingWithAttendee extends Meeting {
  myAttendeeRecord?: MeetingAttendee;
}

@Injectable({
  providedIn: 'root'
})
export class MeetingsService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _meetingsWithAttendees = signal<MeetingWithAttendee[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {}

  loadMeetings(): Observable<MeetingWithAttendee[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<any>(`${this.apiUrl}/meetings`).pipe(
      switchMap((res) => {
        const meetingsList: Meeting[] = Array.isArray(res) ? res : res?.data || res?.items || [];
        if (meetingsList.length === 0) {
          return of([]);
        }

        const attendeeRequests = meetingsList.map((m) =>
          this.http.get<any>(`${this.apiUrl}/meetings/${m.id}/attendees`).pipe(
            catchError(() => of([]))
          )
        );

        return forkJoin(attendeeRequests).pipe(
          map((attendeeResponses) => {
            const currentUserId = this.authSession.currentUser()?.id;

            return meetingsList.map((meeting, idx) => {
              const resAtt = attendeeResponses[idx];
              const attendees: MeetingAttendee[] = Array.isArray(resAtt) ? resAtt : resAtt?.data || resAtt?.items || [];
              const myRecord = attendees.find((a) => a.user_id === currentUserId) || undefined;

              return {
                ...meeting,
                myAttendeeRecord: myRecord
              };
            });
          })
        );
      }),
      tap({
        next: (data) => {
          this._meetingsWithAttendees.set(data);
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to load meetings from server';
          this._error.set(errMsg);
          this._loading.set(false);
        }
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  getMyMeetings(): MeetingWithAttendee[] {
    return this._meetingsWithAttendees();
  }

  updateRSVP(meetingId: string, newStatus: AttendeeStatus): void {
    this._error.set(null);
    this.http.put<any>(`${this.apiUrl}/meetings/${meetingId}/rsvp`, { status: newStatus }, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) }).subscribe({
      next: (res) => {
        const updatedAtt: MeetingAttendee = res?.data || res;
        this._meetingsWithAttendees.update((curr) =>
          curr.map((m) => {
            if (m.id === meetingId) {
              return {
                ...m,
                myAttendeeRecord: updatedAtt
              };
            }
            return m;
          })
        );
      },
      error: (err) => {
        const errMsg = err?.error?.message || err?.message || 'Failed to update RSVP status';
        this._error.set(errMsg);
      }
    });
  }
}

