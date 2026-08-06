import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { AppSocketService } from './app-socket.service';

export interface PlatformSettings {
  id?: string;
  mega_deals_percent_threshold: number;
  mega_deals_fixed_threshold: number;
  home_feed_limit: number;
  bizz_coin_value: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlatformSettingsService {
  private readonly http = inject(HttpClient);
  private readonly appSocket = inject(AppSocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/settings/platform`;

  private readonly _platformSettings = signal<PlatformSettings | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly platformSettings = this._platformSettings.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.initSocketListener();
  }

  private initSocketListener(): void {
    this.appSocket.connect();
    this.appSocket.onEvent('PLATFORM_SETTINGS_UPDATED')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt: any) => {
        const updated = evt?.payload;
        if (updated) {
          console.log('Real-time platform settings update received:', updated);
          this._platformSettings.set(updated);
        }
      });
  }

  loadSettings(): Observable<PlatformSettings | null> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res?.data || res || null),
      tap((data: PlatformSettings | null) => {
        if (data) {
          this._platformSettings.set(data);
        }
        this._loading.set(false);
      }),
      catchError(err => {
        console.error('Failed to load platform settings:', err);
        this._error.set('Failed to load platform settings');
        this._loading.set(false);
        return of(null);
      })
    );
  }
}
