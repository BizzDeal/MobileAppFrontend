import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, tap } from 'rxjs/operators';
import { ProfileDTO } from '../models/profile.model';

const MOCK_PROFILE: ProfileDTO = {
  id: 'cust-101',
  full_name: 'Venkata Satya Ravi Teja',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  email: 'raviteja@bizzdeal.com',
  address: 'Banjara Hills, Hyderabad',
  role: 'MEMBER',
  status: 'ACTIVE',
  profile_pic_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  business_name: 'BizzDeal HQ',
  business_description: 'We offer the best deals on BizzDeal app.',
  website: 'https://bizzdeal.com',
  gst_number: '36AAAAA0000A1Z5',
  business_logo_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=80',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-07-08T10:00:00Z',
};

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);

  private readonly _profile = signal<ProfileDTO | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _updating = signal<boolean>(false);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly updating = this._updating.asReadonly();

  constructor() {
    this.loadProfile().subscribe();
  }

  loadProfile(): Observable<ProfileDTO> {
    this._loading.set(true);
    this._error.set(null);

    return of(MOCK_PROFILE).pipe(
      delay(400),
      tap({
        next: (data) => {
          this._profile.set({ ...data });
          this._loading.set(false);
        },
        error: (err) => {
          const errMsg = err?.message || 'Failed to retrieve profile details';
          this._error.set(errMsg);
          this._loading.set(false);
        },
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  updateProfile(dto: Partial<ProfileDTO>): Observable<ProfileDTO> {
    this._updating.set(true);
    this._error.set(null);

    const currentProfile = this._profile();
    if (!currentProfile) {
      return throwError(() => new Error('Profile is not loaded'));
    }

    const updatedProfile: ProfileDTO = {
      ...currentProfile,
      ...dto,
      updated_at: new Date().toISOString(),
    };

    return of(updatedProfile).pipe(
      delay(600),
      tap({
        next: (data) => {
          this._profile.set(data);
          this._updating.set(false);
        },
        error: (err) => {
          const errMsg = err?.message || 'Failed to update profile details';
          this._error.set(errMsg);
          this._updating.set(false);
        },
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  updateProfilePic(fileUrl: string): void {
    const currentProfile = this._profile();
    if (currentProfile) {
      this._profile.set({
        ...currentProfile,
        profile_pic_url: fileUrl,
        updated_at: new Date().toISOString(),
      });
    }
  }
}
