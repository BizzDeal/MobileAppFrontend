import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface InviteLinkDetails {
  invite_code: string;
  app_url: string;
  sharer_reward_coins: number;
  joiner_reward_coins: number;
}

export interface InviteLinkResponse {
  success: boolean;
  message: string;
  data: InviteLinkDetails;
}

@Injectable({
  providedIn: 'root',
})
export class UserInviteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getInviteDetails(): Observable<InviteLinkResponse> {
    return this.http.get<InviteLinkResponse>(`${this.apiUrl}/users/me/invite-link`);
  }
}
