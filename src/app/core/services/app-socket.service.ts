import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from '../storage/storage.service';
import { STORAGE_KEYS } from '../storage/storage.keys';

export interface AppEvent {
  type: string;
  payload: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppSocketService {
  private readonly storage = inject(StorageService);
  private socket: Socket;
  private eventsSubject = new Subject<AppEvent>();
  
  public readonly events$ = this.eventsSubject.asObservable();

  constructor() {
    const url = new URL(environment.apiUrl);
    const wsBaseUrl = `${url.protocol}//${url.host}`;
    this.socket = io(`${wsBaseUrl}/events`, {
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to AppEvents WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('AppEvents WebSocket connection error:', error);
    });

    this.socket.on('app_event', (event: AppEvent) => {
      this.eventsSubject.next(event);
    });
  }
  
  public async connect(): Promise<void> {
    if (this.socket.connected) return;

    const token = await this.storage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      console.warn('Cannot connect to events websocket: No access token');
      return;
    }

    // Set auth token and connect
    this.socket.auth = { token: token };
    this.socket.connect();
  }

  public disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  public get isConnected(): boolean {
    return this.socket.connected;
  }

  /**
   * Listen to specific app events
   */
  public onEvent(type: string): Observable<AppEvent> {
    return this.events$.pipe(filter(e => e.type === type));
  }
}
