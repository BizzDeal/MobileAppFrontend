import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../../../core/storage/storage.service';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {
  private readonly storage = inject(StorageService);
  private socket: Socket;

  constructor() {
    const url = new URL(environment.apiUrl);
    const wsBaseUrl = `${url.protocol}//${url.host}`;
    this.socket = io(`${wsBaseUrl}/chat`, {
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to Chat WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat WebSocket connection error:', error);
    });
  }
  
  public async connect(): Promise<void> {
    if (this.socket.connected) return;

    const token = await this.storage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      console.warn('Cannot connect to chat websocket: No access token');
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

  public on(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  public emit(event: string, payload: any, ack?: (res: any) => void): void {
    if (!this.socket.connected) {
      console.warn(`Cannot emit event ${event}, socket is not connected.`);
      return;
    }
    
    if (ack) {
      this.socket.emit(event, payload, ack);
    } else {
      this.socket.emit(event, payload);
    }
  }
}
