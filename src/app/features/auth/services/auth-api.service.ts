import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AuthResponse,
  AuthTokens,
  ForgotPinDto,
  LoginDto,
  ResetPinDto,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  checkUserExist(phone: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${this.apiUrl}/users/user-exist`, { phone });
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, dto);
  }

  registerMember(formData: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register-member`, formData);
  }

  registerCustomer(formData: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register-customer`, formData);
  }

  registerAdmin(formData: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register-admin`, formData);
  }

  forgotPin(phone: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/auth/forgot-pin`,
      { phone }
    );
  }

  resetPin(dto: ResetPinDto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/auth/reset-pin`,
      dto
    );
  }

  refreshToken(refreshToken: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiUrl}/auth/refresh-token`, { refreshToken });
  }

  logout(refreshToken?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/auth/logout`, {
      refreshToken,
    });
  }
}
