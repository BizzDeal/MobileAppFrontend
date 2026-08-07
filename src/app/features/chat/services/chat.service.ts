import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { computed, inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ChatConversation, ChatMessage, ChatPartner, MessageStatus, MessageType } from '../models/chat.model';
import { ChatSocketService } from './chat-socket.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly chatSocket = inject(ChatSocketService);
  private readonly authSession = inject(AuthSessionService);

  // Signals for state management
  private readonly _conversations = signal<ChatConversation[]>([]);
  private readonly _activeConversationId = signal<string | null>(null);
  private readonly _activeMessages = signal<ChatMessage[]>([]);
  private readonly _onlineUsers = signal<Set<string>>(new Set());
  private readonly _typingStates = signal<Map<string, boolean>>(new Map());

  // Public read-only signals
  readonly conversations = this._conversations.asReadonly();
  readonly activeConversationId = this._activeConversationId.asReadonly();
  readonly activeMessages = this._activeMessages.asReadonly();
  readonly onlineUsers = this._onlineUsers.asReadonly();
  readonly typingStates = this._typingStates.asReadonly();

  // Derived signal for active conversation detail
  readonly activeConversation = computed(() => {
    const activeId = this._activeConversationId();
    if (!activeId) return null;
    return this._conversations().find(c => c.id === activeId) || null;
  });

  // Directory of all users for initiating new chats
  private readonly _contactsDirectory = signal<ChatPartner[]>([]);
  readonly contactsDirectory = this._contactsDirectory.asReadonly();

  constructor() {
    this.setupSocketListeners();
    this.loadContactsAndConversations();
    
    // Connect socket if authenticated
    effect(() => {
      if (this.authSession.isAuthenticated()) {
        this.chatSocket.connect();
      } else {
        this.chatSocket.disconnect();
      }
    });
  }

  refreshContactsAndConversations(): Observable<{ contacts: any[]; conversations: ChatConversation[] }> {
    return forkJoin({
      contacts: this.http.get<any[]>(`${environment.apiUrl}/chat/contacts`).pipe(catchError(() => of([]))),
      conversations: this.http.get<ChatConversation[]>(`${environment.apiUrl}/chat/conversations`).pipe(catchError(() => of([])))
    }).pipe(
      tap(({ contacts, conversations }) => {
        const partners = contacts.map(u => ({
          id: u.id,
          full_name: u.profile?.full_name || u.full_name || (u.role === 'ADMIN' ? 'Admin' : 'Unknown User'),
          phone: u.phone,
          role: u.role,
          profile_pic_url: u.profile_pic_url || u.profile?.profile_pic_url || null,
          isOnline: this._onlineUsers().has(u.id),
        }));
        this._contactsDirectory.set(partners);

        const mapped = conversations.map(c => this.mapConversation(c));
        this._conversations.set(mapped);
      })
    );
  }

  loadContactsAndConversations(): void {
    this.refreshContactsAndConversations().subscribe();
  }

  searchContacts(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/chat/contacts?search=${encodeURIComponent(query)}`);
  }

  getChatList(page: number = 1, limit: number = 20, search?: string): Observable<any> {
    let url = `${environment.apiUrl}/chat/list?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<any>(url);
  }

  private loadConversations(): void {
    this.http.get<ChatConversation[]>(`${environment.apiUrl}/chat/conversations`).subscribe({
      next: (convs) => {
        const mapped = convs.map(c => this.mapConversation(c));
        this._conversations.set(mapped);
      },
      error: (err) => console.error('Failed to load conversations', err)
    });
  }

  private mapConversation(conv: any): ChatConversation {
    let partner = conv.partner;
    if (partner) {
      partner.isOnline = this._onlineUsers().has(partner.id);
    }
    return { ...conv, partner };
  }

  private loadMessages(conversationId: string, page: number = 1): void {
    this.http.get<ChatMessage[]>(`${environment.apiUrl}/chat/conversations/${conversationId}/messages?page=${page}&limit=50`).subscribe({
      next: (msgs) => this._activeMessages.set(msgs.map(m => this.mapMessage(m))),
      error: (err) => console.error('Failed to load messages', err)
    });
  }

  private mapMessage(msg: any): ChatMessage {
    const mapped = {
      ...msg,
      media_url: msg.media_file?.file_url || msg.media_url || null,
      media_name: msg.media_file?.file_type || msg.media_name || null
    };

    // Attempt to enrich sender info from contacts directory if missing
    if (mapped.sender_id && !mapped.sender?.profile?.full_name) {
      const contact = this._contactsDirectory().find(c => c.id === mapped.sender_id);
      if (contact && contact.full_name) {
        mapped.sender = {
          ...(mapped.sender || {}),
          id: mapped.sender_id,
          phone: mapped.sender?.phone || contact.phone,
          profile: {
            ...(mapped.sender?.profile || {}),
            full_name: contact.full_name
          }
        };
      }
    }

    return mapped;
  }

  // Set the currently active conversation and load messages
  setActiveConversation(id: string | null): void {
    this._activeConversationId.set(id);
    if (!id) {
      this._activeMessages.set([]);
      return;
    }

    this.loadMessages(id);
    this.markAsRead(id);
  }

  // Create a new conversation or select existing one
  createOrGetConversation(partnerId: string): Observable<ChatConversation> {
    return this.http.post<ChatConversation>(`${environment.apiUrl}/chat/conversations`, { target_user_id: partnerId }).pipe(
      map(conv => this.mapConversation(conv)),
      tap(mappedConv => {
        if (!mappedConv.partner) {
          const contact = this._contactsDirectory().find(c => c.id === partnerId);
          if (contact) {
            mappedConv.partner = {
              id: contact.id,
              full_name: contact.full_name,
              phone: contact.phone,
              role: contact.role,
              profile_pic_url: contact.profile_pic_url,
              isOnline: this._onlineUsers().has(contact.id),
            };
          }
        }
        const index = this._conversations().findIndex(c => c.id === mappedConv.id);
        if (index >= 0) {
          this._conversations.update(convs => {
            const updated = [...convs];
            updated[index] = {
              ...updated[index],
              ...mappedConv,
              partner: mappedConv.partner || updated[index].partner,
            };
            return updated;
          });
        } else {
          this._conversations.update(convs => [mappedConv, ...convs]);
        }
        this.setActiveConversation(mappedConv.id);
      })
    );
  }

  // Send a message via WebSocket
  sendMessage(
    text: string | null,
    type: MessageType = MessageType.TEXT,
    mediaFileId: string | null = null,
    mediaUrl: string | null = null,
    mediaName: string | null = null,
    mediaSize: string | null = null
  ): void {
    const activeId = this._activeConversationId();
    if (!activeId) return;

    const payload = {
      conversation_id: activeId,
      message: text,
      message_type: type,
      media_file_id: mediaFileId
    };

    this.chatSocket.emit('send_message', payload, (response: any) => {
      if (response && response.message) {
        // Push the sent message immediately
        const mappedMessage = this.mapMessage(response.message);
        if (!mappedMessage.media_url && mediaUrl) {
          mappedMessage.media_url = mediaUrl;
        }
        if (!mappedMessage.media_name && mediaName) {
          mappedMessage.media_name = mediaName;
        }
        this._activeMessages.update(msgs => [...msgs, mappedMessage]);
        this.updateConversationLastMessage(activeId, mappedMessage);
      }
    });
  }

  // Mark all unread messages in conversation as read via WebSocket
  markAsRead(conversationId: string): void {
    this._conversations.update(convs =>
      convs.map(c => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    );

    this.chatSocket.emit('mark_as_read', { conversation_id: conversationId }, (response: any) => {
      if (this._activeConversationId() === conversationId) {
        this._activeMessages.update(msgs => msgs.map(m => {
          if (m.sender_id !== this.authSession.currentUser()?.id && !m.is_read) {
            return { ...m, is_read: true, read_at: response?.read_at || new Date().toISOString() };
          }
          return m;
        }));
      }
    });
  }

  // Upload a media file
  uploadMedia(file: File): import('rxjs').Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${environment.apiUrl}/chat/upload`, formData);
  }

  // Edit message
  editMessage(messageId: string, newText: string): void {
    this.chatSocket.emit('edit_message', { message_id: messageId, message: newText }, (response: any) => {
      if (response && response.message) {
        this.updateMessageInList(response.message);
      }
    });
  }

  // Soft delete message
  deleteMessage(messageId: string): void {
    this.chatSocket.emit('delete_message', { message_id: messageId }, (response: any) => {
      if (response && response.status === 'DELETED') {
        const activeId = this._activeConversationId();
        this._activeMessages.update(msgs => msgs.map(m => {
          if (m.id === messageId) {
            return { ...m, message: null, media_file_id: null, media_url: null, is_deleted: true };
          }
          return m;
        }));
      }
    });
  }
  
  startTyping(conversationId: string, receiverId: string): void {
    this.chatSocket.emit('typing_start', { conversation_id: conversationId, receiver_id: receiverId });
  }

  stopTyping(conversationId: string, receiverId: string): void {
    this.chatSocket.emit('typing_stop', { conversation_id: conversationId, receiver_id: receiverId });
  }

  getLastMessage(conversationId: string): ChatMessage | null {
    // We don't have all messages in memory anymore. We rely on the conversation's last_message_at
    // But the UI expects a ChatMessage snippet if available. The backend GET /conversations might need to return the last message text, 
    // or we just return null and the UI falls back to last_message_at.
    return null;
  }

  private setupSocketListeners(): void {
    this.chatSocket.on('receive_message', (rawMessage: any) => {
      const message = this.mapMessage(rawMessage);
      const activeId = this._activeConversationId();
      
      const convExists = this._conversations().some(c => c.id === message.conversation_id);
      if (!convExists) {
        this.loadConversations();
      }

      if (activeId === message.conversation_id) {
        this._activeMessages.update(msgs => [...msgs, message]);
        // Send delivered tick
        this.chatSocket.emit('message_delivered', { message_id: message.id, conversation_id: activeId });
        // Since we are active, mark as read
        this.markAsRead(activeId);
      } else {
        // Increment unread count
        this._conversations.update(convs => convs.map(c => 
          c.id === message.conversation_id ? { ...c, unread_count: c.unread_count + 1 } : c
        ));
      }
      this.updateConversationLastMessage(message.conversation_id, message);
    });

    this.chatSocket.on('message_status_update', (data: { message_id: string, conversation_id: string, status: MessageStatus }) => {
      if (this._activeConversationId() === data.conversation_id) {
        this._activeMessages.update(msgs => msgs.map(m => m.id === data.message_id ? { ...m, status: data.status } : m));
      }
    });

    this.chatSocket.on('messages_read', (data: { conversation_id: string, read_by: string, read_at: string }) => {
      if (this._activeConversationId() === data.conversation_id) {
        this._activeMessages.update(msgs => msgs.map(m => 
          (m.sender_id !== data.read_by && !m.is_read) ? { ...m, is_read: true, read_at: data.read_at, status: MessageStatus.READ } : m
        ));
      }
    });

    this.chatSocket.on('user_typing', (data: { conversation_id: string, sender_id: string }) => {
      this._typingStates.update(map => {
        const newMap = new Map(map);
        newMap.set(data.conversation_id, true);
        return newMap;
      });
    });

    this.chatSocket.on('user_stopped_typing', (data: { conversation_id: string, sender_id: string }) => {
      this._typingStates.update(map => {
        const newMap = new Map(map);
        newMap.set(data.conversation_id, false);
        return newMap;
      });
    });

    this.chatSocket.on('user_online', (data: { user_id: string }) => {
      this._onlineUsers.update(set => {
        const newSet = new Set(set);
        newSet.add(data.user_id);
        return newSet;
      });
      this.updateContactOnlineStatus(data.user_id, true);
    });

    this.chatSocket.on('user_offline', (data: { user_id: string, last_seen: string }) => {
      this._onlineUsers.update(set => {
        const newSet = new Set(set);
        newSet.delete(data.user_id);
        return newSet;
      });
      this.updateContactOnlineStatus(data.user_id, false);
    });

    this.chatSocket.on('online_users_list', (data: { user_ids: string[] }) => {
      this._onlineUsers.set(new Set(data.user_ids));
      data.user_ids.forEach(id => this.updateContactOnlineStatus(id, true));
    });

    this.chatSocket.on('message_edited', (message: ChatMessage) => {
      this.updateMessageInList(message);
    });

    this.chatSocket.on('message_deleted', (data: { message_id: string, conversation_id: string, is_deleted: boolean }) => {
      if (this._activeConversationId() === data.conversation_id) {
        this._activeMessages.update(msgs => msgs.map(m => 
          m.id === data.message_id ? { ...m, message: null, media_file_id: null, media_url: null, is_deleted: true } : m
        ));
      }
    });
  }

  private updateConversationLastMessage(conversationId: string, message: ChatMessage): void {
    this._conversations.update(convs => {
      const updated = convs.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            last_message_at: message.created_at,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      });
      return [...updated].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }

  private updateMessageInList(message: ChatMessage): void {
    if (this._activeConversationId() === message.conversation_id) {
      this._activeMessages.update(msgs => msgs.map(m => {
        if (m.id === message.id) {
          const mapped = this.mapMessage(message);
          return {
            ...m,
            ...mapped,
            is_edited: true,
            edited_at: mapped.edited_at || new Date().toISOString()
          };
        }
        return m;
      }));
    }
  }

  private updateContactOnlineStatus(userId: string, isOnline: boolean): void {
    this._contactsDirectory.update(contacts =>
      contacts.map(c => c.id === userId ? { ...c, isOnline } : c)
    );
  }
}
