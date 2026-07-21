import { computed, inject, Injectable, Injector, signal, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { STORAGE_KEYS } from '../storage/storage.keys';
import { AuthUser, UserRole } from '../../features/auth/models/auth.model';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { NotificationService } from '../../features/notifications/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly ngZone = inject(NgZone);

  private readonly _currentUser = signal<AuthUser | null>(null);
  private readonly _loadingSession = signal<boolean>(true);

  readonly currentUser = this._currentUser.asReadonly();
  readonly loadingSession = this._loadingSession.asReadonly();

  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this.userRole() === UserRole.ADMIN);
  readonly isMember = computed(() => this.userRole() === UserRole.MEMBER);
  readonly isCustomer = computed(() => this.userRole() === UserRole.CUSTOMER);

  async initSession(): Promise<void> {
    this._loadingSession.set(true);
    try {
      const accessToken = await this.storage.get(STORAGE_KEYS.ACCESS_TOKEN);
      const storedUser = await this.storage.getObject<AuthUser>(STORAGE_KEYS.CURRENT_USER);

      if (accessToken && storedUser) {
        this._currentUser.set(storedUser);
      } else {
        this._currentUser.set(null);
      }
    } catch (error) {
      console.error('AuthSessionService.initSession error:', error);
      this._currentUser.set(null);
    } finally {
      this._loadingSession.set(false);
    }
  }

  async setSession(accessToken: string, refreshToken: string, user: AuthUser): Promise<void> {
    try {
      await this.storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await this.storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await this.storage.setObject(STORAGE_KEYS.CURRENT_USER, user);
      this._currentUser.set(user);

      try {
        const notificationService = this.injector.get(NotificationService);
        notificationService.registerDeviceOnLogin();
      } catch (err) {
        console.error('Failed to trigger registerDeviceOnLogin:', err);
      }
    } catch (error) {
      console.error('AuthSessionService.setSession error:', error);
      throw error;
    }
  }

  async updateCurrentUser(user: AuthUser): Promise<void> {
    try {
      await this.storage.setObject(STORAGE_KEYS.CURRENT_USER, user);
      this._currentUser.set(user);
    } catch (error) {
      console.error('AuthSessionService.updateCurrentUser error:', error);
      throw error;
    }
  }

  async updateTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await this.storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await this.storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('AuthSessionService.updateTokens error:', error);
      throw error;
    }
  }

  async clearSession(): Promise<void> {
    try {
      await this.storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      await this.storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
      await this.storage.remove(STORAGE_KEYS.CURRENT_USER);
      await this.storage.remove('bizzdeal_device_registered_v1');
    } catch (error) {
      console.error('AuthSessionService.clearSession error:', error);
    } finally {
      this._currentUser.set(null);
    }
  }

  async getAccessToken(): Promise<string | null> {
    return this.storage.get(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.storage.get(STORAGE_KEYS.REFRESH_TOKEN);
  }

  private _isLoggingOut = false;

  async logout(redirectToLogin = true): Promise<void> {
    if (this._isLoggingOut) return;
    this._isLoggingOut = true;
    try {
      const refreshToken = await this.getRefreshToken();
      const authApi = this.injector.get(AuthApiService);
      await firstValueFrom(authApi.logout(refreshToken || undefined)).catch(() => {});
    } catch (error) {
      console.error('Error calling backend logout:', error);
    } finally {
      await this.clearSession();
      this._isLoggingOut = false;
      if (redirectToLogin) {
        this.ngZone.run(() => {
          this.router.navigate(['/auth/login'], { replaceUrl: true });
        });
      }
    }
  }
}
