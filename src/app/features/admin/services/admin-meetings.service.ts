import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MeetingWithAttendee, Meeting } from '../../meetings/services/meetings.service';

@Injectable({
  providedIn: 'root'
})
export class AdminMeetingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _meetings = signal<MeetingWithAttendee[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly meetings = this._meetings.asReadonly();

  loadMeetings(): Observable<MeetingWithAttendee[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<any>(`${this.apiUrl}/meetings`).pipe(
      tap({
        next: (res) => {
          const meetingsList = Array.isArray(res) ? res : res?.data || res?.items || [];
          this._meetings.set(meetingsList);
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to load meetings';
          this._error.set(errMsg);
          this._loading.set(false);
        }
      }),
      catchError((err) => throwError(() => err))
    );
  }

  createMeeting(data: Partial<Meeting>): Observable<Meeting> {
    return this.http.post<any>(`${this.apiUrl}/meetings`, data).pipe(
      tap((res: any) => {
        const newMeeting = res?.data || res;
        this._meetings.update(curr => [newMeeting, ...curr]);
      })
    );
  }

  updateMeeting(id: string, data: Partial<Meeting>): Observable<Meeting> {
    return this.http.put<any>(`${this.apiUrl}/meetings/${id}`, data).pipe(
      tap((res: any) => {
        const updated = res?.data || res;
        this._meetings.update(curr => curr.map(m => m.id === id ? { ...m, ...updated } : m));
      })
    );
  }

  deleteMeeting(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/meetings/${id}`).pipe(
      tap(() => {
        this._meetings.update(curr => curr.filter(m => m.id !== id));
      })
    );
  }

  getAttendeeReport(meetingId: string): Observable<AttendeeReportItem[]> {
    return this.http.get<AttendeeReportItem[]>(`${this.apiUrl}/meetings/${meetingId}/attendee-report`);
  }
}

export interface AttendeeReportItem {
  id: string;
  full_name: string;
  phone: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ATTENDED' | 'MISSED' | 'INVITED';
}
