import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { ImageCacheService } from '../../../core/platform/image-cache.service';
import { ProfileDTO } from '../models/profile.model';
import { LocationState, LocationDistrict } from '../../auth/services/member-onboarding.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly imageCache = inject(ImageCacheService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _profile = signal<ProfileDTO | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _updating = signal<boolean>(false);

  readonly states = signal<LocationState[]>([]);
  readonly isLoadingStates = signal<boolean>(false);
  readonly districts = signal<LocationDistrict[]>([]);
  readonly isLoadingDistricts = signal<boolean>(false);

  readonly profile = this._profile.asReadonly();
  readonly userRole = computed(() => this.authSession.userRole() || this._profile()?.role || 'CUSTOMER');
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly updating = this._updating.asReadonly();

  constructor() {
    this.loadProfile().subscribe({
      error: (err: any) => console.error('Initial profile load failed:', err),
    });
  }

  async fetchStates(): Promise<void> {
    if (this.states().length > 0) return;
    this.isLoadingStates.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/locations/states`)
      );
      const list: LocationState[] = Array.isArray(res) ? res : res?.data || res?.items || [];
      this.states.set(list);
    } catch (err: any) {
      console.error('Failed to fetch states for profile:', err);
    } finally {
      this.isLoadingStates.set(false);
    }
  }

  async fetchDistrictsByState(stateId: string): Promise<void> {
    if (!stateId) {
      this.districts.set([]);
      return;
    }
    this.isLoadingDistricts.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/locations/states/${stateId}/districts`)
      );
      const list: LocationDistrict[] = Array.isArray(res) ? res : res?.data || res?.items || [];
      this.districts.set(list);
    } catch (err: any) {
      console.error('Failed to fetch districts for profile:', err);
    } finally {
      this.isLoadingDistricts.set(false);
    }
  }

  clearDistricts(): void {
    this.districts.set([]);
  }

  loadProfile(): Observable<ProfileDTO | null> {
    this._loading.set(true);
    this._error.set(null);

    const currentUser = this.authSession.currentUser();
    if (!this._profile() && currentUser) {
      this._profile.set({
        id: currentUser.id,
        full_name: currentUser.full_name,
        phone: currentUser.phone,
        whatsapp: currentUser.whatsapp || currentUser.phone,
        email: currentUser.email || '',
        address: currentUser.address || '',
        state_id: (currentUser as any).state_id || null,
        district_id: (currentUser as any).district_id || null,
        role: currentUser.role as any,
        status: currentUser.status as any,
        profile_pic_url: currentUser.profile_pic_url || null,
        business_id: (currentUser as any).business_id || null,
        category_id: (currentUser as any).category_id || undefined,
        business_name: (currentUser as any).business_name || null,
        business_description: (currentUser as any).business_description || null,
        website: (currentUser as any).website || null,
        gst_number: (currentUser as any).gst_number || null,
        business_logo_url: (currentUser as any).business_logo_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return this.http.post<any>(`${this.apiUrl}/users/profile`, {}).pipe(
      tap({
        next: (data) => {
          const p = data?.data || data;
          const loaded: ProfileDTO = {
            id: p.id || currentUser?.id || 'unknown',
            full_name: p.full_name || currentUser?.full_name || 'User',
            phone: p.phone || currentUser?.phone || '',
            whatsapp: p.whatsapp || p.phone || currentUser?.whatsapp || '',
            email: p.email || currentUser?.email || '',
            address: p.address || currentUser?.address || '',
            state_id: p.state_id || (currentUser as any)?.state_id || null,
            district_id: p.district_id || (currentUser as any)?.district_id || null,
            role: (p.role || currentUser?.role || 'CUSTOMER') as any,
            status: (p.status || currentUser?.status || 'ACTIVE') as any,
            profile_pic_url: p.profile_pic_url || p.profile_pic || currentUser?.profile_pic_url || null,
            business_id: p.business_id || (currentUser as any)?.business_id || null,
            category_id: p.category_id || (currentUser as any)?.category_id || undefined,
            business_name: p.business_name || (currentUser as any)?.business_name || null,
            business_description: p.business_description || (currentUser as any)?.business_description || null,
            website: p.website || (currentUser as any)?.website || null,
            gst_number: p.gst_number || (currentUser as any)?.gst_number || null,
            business_logo_url: p.business_logo_url || (currentUser as any)?.business_logo_url || null,
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          };
          this._profile.set(loaded);
          if (currentUser) {
            this.authSession.updateCurrentUser({
              ...currentUser,
              full_name: loaded.full_name,
              email: loaded.email,
              address: loaded.address,
              state_id: loaded.state_id || undefined,
              district_id: loaded.district_id || undefined,
              profile_pic_url: loaded.profile_pic_url || undefined,
              ...((loaded.business_name ? { business_name: loaded.business_name } : {}) as any),
              ...((loaded.business_description ? { business_description: loaded.business_description } : {}) as any),
              ...((loaded.website ? { website: loaded.website } : {}) as any),
              ...((loaded.gst_number ? { gst_number: loaded.gst_number } : {}) as any),
              ...((loaded.business_logo_url ? { business_logo_url: loaded.business_logo_url } : {}) as any),
              ...((loaded.category_id ? { category_id: loaded.category_id } : {}) as any),
            }).catch(() => {});
          }
          this._loading.set(false);
        },
        error: (err: any) => {
          if (currentUser) {
            const fallback: ProfileDTO = {
              id: currentUser.id,
              full_name: currentUser.full_name,
              phone: currentUser.phone,
              whatsapp: currentUser.whatsapp || currentUser.phone,
              email: currentUser.email || '',
              address: currentUser.address || '',
              state_id: (currentUser as any).state_id || null,
              district_id: (currentUser as any).district_id || null,
              role: currentUser.role as any,
              status: currentUser.status as any,
              profile_pic_url: currentUser.profile_pic_url || null,
              business_name: (currentUser as any).business_name || null,
              business_description: (currentUser as any).business_description || null,
              website: (currentUser as any).website || null,
              gst_number: (currentUser as any).gst_number || null,
              business_logo_url: (currentUser as any).business_logo_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            this._profile.set(fallback);
          } else {
            this._error.set(err?.message || 'Failed to retrieve profile details');
          }
          this._loading.set(false);
        },
      }),
      catchError((err: any) => {
        if (currentUser) {
          return of(this._profile());
        }
        return throwError(() => err);
      })
    );
  }

  clearProfile(): void {
    this._profile.set(null);
  }

  updateProfile(dto: any): Observable<ProfileDTO> {
    this._updating.set(true);
    this._error.set(null);

    const currentProfile = this._profile();
    if (!currentProfile) {
      return throwError(() => new Error('Profile is not loaded'));
    }

    return this.http.put<any>(`${this.apiUrl}/users/profile`, dto).pipe(
      tap({
        next: (data) => {
          const p = data?.data || data;
          const updated: ProfileDTO = {
            ...currentProfile,
            ...p,
            updated_at: new Date().toISOString(),
          };
          this._profile.set(updated);
          if (updated.profile_pic_url) {
            this.imageCache.invalidateImage(updated.profile_pic_url);
          }
          if (updated.business_logo_url) {
            this.imageCache.invalidateImage(updated.business_logo_url);
          }
          const cu = this.authSession.currentUser();
          if (cu) {
            this.authSession.updateCurrentUser({
              ...cu,
              full_name: updated.full_name,
              email: updated.email,
              address: updated.address,
              state_id: updated.state_id || undefined,
              district_id: updated.district_id || undefined,
              profile_pic_url: updated.profile_pic_url || undefined,
              ...((updated.business_name ? { business_name: updated.business_name } : {}) as any),
              ...((updated.business_description ? { business_description: updated.business_description } : {}) as any),
              ...((updated.website ? { website: updated.website } : {}) as any),
              ...((updated.gst_number ? { gst_number: updated.gst_number } : {}) as any),
              ...((updated.business_logo_url ? { business_logo_url: updated.business_logo_url } : {}) as any),
              ...((updated.category_id ? { category_id: updated.category_id } : {}) as any),
            }).catch(() => {});
          }
          this._updating.set(false);
        },
        error: (err: any) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to update profile details';
          this._error.set(errMsg);
          this._updating.set(false);
        },
      }),
      catchError((err: any) => {
        return throwError(() => err);
      })
    );
  }

  updateProfilePic(fileUrl: string): void {
    if (fileUrl) {
      this.imageCache.invalidateImage(fileUrl);
    }
    const currentProfile = this._profile();
    if (currentProfile) {
      this._profile.set({
        ...currentProfile,
        profile_pic_url: fileUrl,
        updated_at: new Date().toISOString(),
      });
      const cu = this.authSession.currentUser();
      if (cu) {
        this.authSession.updateCurrentUser({
          ...cu,
          profile_pic_url: fileUrl,
        }).catch(() => {});
      }
    }
  }
}
