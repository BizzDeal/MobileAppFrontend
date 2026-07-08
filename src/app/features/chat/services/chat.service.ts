import { Injectable, signal, computed } from '@angular/core';
import { MessageType, MessageStatus, ChatMessage, ChatConversation, ChatPartner } from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  // Current user info (matching Home Feed default customer)
  private readonly CURRENT_USER_ID = 'cust-101';

  // Signals for state management
  private readonly _conversations = signal<ChatConversation[]>([]);
  private readonly _activeConversationId = signal<string | null>(null);
  private readonly _activeMessages = signal<ChatMessage[]>([]);
  private readonly _onlineUsers = signal<Set<string>>(new Set(['owner-1', 'owner-3', 'owner-4']));
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
  readonly contactsDirectory: ChatPartner[] = [
    {
      id: 'owner-1',
      full_name: 'The Artisan Roast Café',
      phone: '+91 98765 00001',
      role: 'MEMBER',
      profile_pic_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
    },
    {
      id: 'owner-2',
      full_name: 'Vogue Avenue Boutique',
      phone: '+91 98765 00002',
      role: 'MEMBER',
      profile_pic_url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=150&auto=format&fit=crop&q=80',
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000 * 3), // 3 hours ago
    },
    {
      id: 'owner-3',
      full_name: 'Zenith Spa & Sanctuary',
      phone: '+91 98765 00003',
      role: 'MEMBER',
      profile_pic_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
    },
    {
      id: 'owner-4',
      full_name: 'TechZone Gadgets & Hub',
      phone: '+91 98765 00004',
      role: 'MEMBER',
      profile_pic_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
    },
    {
      id: 'owner-5',
      full_name: 'Glamour Lounge Studio',
      phone: '+91 98765 00005',
      role: 'MEMBER',
      profile_pic_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&auto=format&fit=crop&q=80',
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000 * 24), // 1 day ago
    },
    {
      id: 'owner-6',
      full_name: 'Bistro 57 Gourmet & Bar',
      phone: '+91 98765 00006',
      role: 'MEMBER',
      profile_pic_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
      isOnline: false,
    },
  ];

  // In-memory mock database of messages per conversation
  private messagesDatabase: Record<string, ChatMessage[]> = {};

  constructor() {
    this.initMockData();
  }

  private initMockData(): void {
    // 1. Initial Conversations List
    const initialConvs: ChatConversation[] = [
      {
        id: 'conv-1',
        user_one_id: this.CURRENT_USER_ID,
        user_two_id: 'owner-1',
        last_message_at: new Date(Date.now() - 60000 * 15).toISOString(), // 15 mins ago
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 60000 * 15).toISOString(),
        unread_count: 0,
        partner: this.contactsDirectory[0],
      },
      {
        id: 'conv-2',
        user_one_id: this.CURRENT_USER_ID,
        user_two_id: 'owner-2',
        last_message_at: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        unread_count: 2,
        partner: this.contactsDirectory[1],
      },
      {
        id: 'conv-3',
        user_one_id: this.CURRENT_USER_ID,
        user_two_id: 'owner-3',
        last_message_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        unread_count: 0,
        partner: this.contactsDirectory[2],
      },
    ];

    this._conversations.set(initialConvs);

    // 2. Initial Messages Database
    this.messagesDatabase = {
      'conv-1': [
        {
          id: 'm1-1',
          conversation_id: 'conv-1',
          sender_id: 'owner-1',
          message_type: MessageType.TEXT,
          message: 'Hi! Welcome to Artisan Roast Café. Let us know if you have any questions.',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: MessageStatus.READ,
        },
        {
          id: 'm1-2',
          conversation_id: 'conv-1',
          sender_id: this.CURRENT_USER_ID,
          message_type: MessageType.TEXT,
          message: 'Hi, I claimed the 50% discount voucher. Can I use it on weekend mornings?',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          status: MessageStatus.READ,
        },
        {
          id: 'm1-3',
          conversation_id: 'conv-1',
          sender_id: 'owner-1',
          message_type: MessageType.TEXT,
          message: 'Yes, definitely! The voucher is valid anytime before 11:30 AM on weekends.',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          status: MessageStatus.READ,
        },
        {
          id: 'm1-4',
          conversation_id: 'conv-1',
          sender_id: this.CURRENT_USER_ID,
          message_type: MessageType.TEXT,
          message: 'Perfect, thank you! I will visit tomorrow.',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
          status: MessageStatus.READ,
        },
        {
          id: 'm1-5',
          conversation_id: 'conv-1',
          sender_id: 'owner-1',
          message_type: MessageType.TEXT,
          message: 'Great! Your table reservation is confirmed. See you!',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 60000 * 15).toISOString(),
          updated_at: new Date(Date.now() - 60000 * 15).toISOString(),
          status: MessageStatus.READ,
        },
      ],
      'conv-2': [
        {
          id: 'm2-1',
          conversation_id: 'conv-2',
          sender_id: 'owner-2',
          message_type: MessageType.TEXT,
          message: 'Hi Teja! We have some new items in stock. Check them out!',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: MessageStatus.READ,
        },
        {
          id: 'm2-2',
          conversation_id: 'conv-2',
          sender_id: 'owner-2',
          message_type: MessageType.TEXT,
          message: 'We are offering flat ₹2,000 off on party wear this weekend.',
          media_file_id: null,
          is_read: false,
          read_at: null,
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          status: MessageStatus.DELIVERED,
        },
        {
          id: 'm2-3',
          conversation_id: 'conv-2',
          sender_id: 'owner-2',
          message_type: MessageType.TEXT,
          message: 'Let me know if you want me to reserve a size for you.',
          media_file_id: null,
          is_read: false,
          read_at: null,
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 3600000 * 17).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 17).toISOString(),
          status: MessageStatus.DELIVERED,
        },
      ],
      'conv-3': [
        {
          id: 'm3-1',
          conversation_id: 'conv-3',
          sender_id: 'owner-3',
          message_type: MessageType.TEXT,
          message: 'Hello! How was your spa session yesterday?',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: MessageStatus.READ,
        },
        {
          id: 'm3-2',
          conversation_id: 'conv-3',
          sender_id: this.CURRENT_USER_ID,
          message_type: MessageType.TEXT,
          message: 'It was amazing! The aromatherapy was really relaxing.',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
          status: MessageStatus.READ,
        },
        {
          id: 'm3-3',
          conversation_id: 'conv-3',
          sender_id: 'owner-3',
          message_type: MessageType.TEXT,
          message: 'Thanks for the feedback. We are glad you enjoyed the session.',
          media_file_id: null,
          is_read: true,
          read_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: MessageStatus.READ,
        },
      ],
    };
  }

  // Set the currently active conversation and load messages
  setActiveConversation(id: string | null): void {
    this._activeConversationId.set(id);
    if (!id) {
      this._activeMessages.set([]);
      return;
    }

    // Load messages
    const msgs = this.messagesDatabase[id] || [];
    this._activeMessages.set([...msgs]);

    // Mark unread messages as read
    this.markAsRead(id);
  }

  // Create a new conversation or select existing one
  createOrGetConversation(partnerId: string): string {
    const existing = this._conversations().find(
      c => c.user_one_id === partnerId || c.user_two_id === partnerId
    );

    if (existing) {
      this.setActiveConversation(existing.id);
      return existing.id;
    }

    const partner = this.contactsDirectory.find(p => p.id === partnerId);
    if (!partner) {
      throw new Error(`Partner not found in directory with ID: ${partnerId}`);
    }

    const newConvId = `conv-${Date.now()}`;
    const newConv: ChatConversation = {
      id: newConvId,
      user_one_id: this.CURRENT_USER_ID,
      user_two_id: partnerId,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_count: 0,
      partner: partner,
    };

    this.messagesDatabase[newConvId] = [];
    this._conversations.update(c => [newConv, ...c]);
    this.setActiveConversation(newConvId);
    return newConvId;
  }

  // Send a message (UI triggered)
  sendMessage(
    text: string | null,
    type: MessageType = MessageType.TEXT,
    mediaUrl: string | null = null,
    mediaName: string | null = null,
    mediaSize: string | null = null
  ): void {
    const activeId = this._activeConversationId();
    if (!activeId) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: activeId,
      sender_id: this.CURRENT_USER_ID,
      message_type: type,
      message: text,
      media_file_id: mediaUrl ? `media-${Date.now()}` : null,
      media_url: mediaUrl,
      media_name: mediaName,
      media_size: mediaSize,
      is_read: false,
      read_at: null,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: MessageStatus.SENT,
    };

    // Update messages databases
    this.messagesDatabase[activeId] = [...(this.messagesDatabase[activeId] || []), newMsg];
    this._activeMessages.set([...this.messagesDatabase[activeId]]);

    // Update conversation metadata and bump to top of list
    this._conversations.update(convs => {
      const updated = convs.map(c => {
        if (c.id === activeId) {
          return {
            ...c,
            last_message_at: newMsg.created_at,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      });
      // Sort by updated_at descending
      return [...updated].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    // Simulate ticking progression & auto-reply
    this.simulatePartnerInteraction(activeId, newMsg.id);
  }

  // Mark all unread messages in conversation as read
  markAsRead(conversationId: string): void {
    // Reset unread count in conversation
    this._conversations.update(convs =>
      convs.map(c => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    );

    // Update messages database
    if (this.messagesDatabase[conversationId]) {
      this.messagesDatabase[conversationId] = this.messagesDatabase[conversationId].map(m => {
        if (m.sender_id !== this.CURRENT_USER_ID && !m.is_read) {
          return { ...m, is_read: true, read_at: new Date().toISOString() };
        }
        return m;
      });

      // Update active list if it's the current active conversation
      if (this._activeConversationId() === conversationId) {
        this._activeMessages.set([...this.messagesDatabase[conversationId]]);
      }
    }
  }

  // Edit message
  editMessage(messageId: string, newText: string): void {
    const activeId = this._activeConversationId();
    if (!activeId) return;

    if (this.messagesDatabase[activeId]) {
      this.messagesDatabase[activeId] = this.messagesDatabase[activeId].map(m => {
        if (m.id === messageId) {
          return { ...m, message: newText, is_edited: true, updated_at: new Date().toISOString() };
        }
        return m;
      });
      this._activeMessages.set([...this.messagesDatabase[activeId]]);
    }
  }

  // Soft delete message
  deleteMessage(messageId: string): void {
    const activeId = this._activeConversationId();
    if (!activeId) return;

    if (this.messagesDatabase[activeId]) {
      this.messagesDatabase[activeId] = this.messagesDatabase[activeId].map(m => {
        if (m.id === messageId) {
          return {
            ...m,
            message: null,
            media_file_id: null,
            media_url: null,
            is_deleted: true,
            updated_at: new Date().toISOString(),
          };
        }
        return m;
      });
      this._activeMessages.set([...this.messagesDatabase[activeId]]);
    }
  }

  // Simulation runner for mock reply behaviors
  private simulatePartnerInteraction(conversationId: string, userMsgId: string): void {
    // 1. Tick: DELIVERED (after 500ms)
    setTimeout(() => {
      this.updateMessageStatus(conversationId, userMsgId, MessageStatus.DELIVERED);
    }, 600);

    // 2. Tick: READ (after 1.2s)
    setTimeout(() => {
      this.updateMessageStatus(conversationId, userMsgId, MessageStatus.READ);
    }, 1400);

    // 3. Typing indicator start (after 2s)
    setTimeout(() => {
      const activeId = this._activeConversationId();
      if (activeId === conversationId) {
        this._typingStates.update(map => {
          const newMap = new Map(map);
          newMap.set(conversationId, true);
          return newMap;
        });
      }
    }, 2200);

    // 4. Send Reply + Stop Typing indicator (after 4.5s)
    setTimeout(() => {
      this._typingStates.update(map => {
        const newMap = new Map(map);
        newMap.set(conversationId, false);
        return newMap;
      });

      const conversation = this._conversations().find(c => c.id === conversationId);
      if (!conversation) return;

      const partnerName = conversation.partner.full_name;
      const autoReplies = [
        `Thanks for contacting ${partnerName}! We received your query. How can we help you today?`,
        `Hi there! Our current store timings are 9:00 AM to 9:00 PM. Please visit us, and show your BizzDeal voucher at the counter!`,
        `Hello! Yes, that deal is active and can be redeemed directly. Do you need directions to our location?`,
        `Hey, we appreciate your interest in our business! Let us know if you need to schedule a meeting or have questions about BizzDeal rewards.`,
      ];
      const randomText = autoReplies[Math.floor(Math.random() * autoReplies.length)];

      const replyMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: conversation.partner.id,
        message_type: MessageType.TEXT,
        message: randomText,
        media_file_id: null,
        is_read: false,
        read_at: null,
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: MessageStatus.READ, // Sender ticks don't apply to incoming messages
      };

      // Add to database
      this.messagesDatabase[conversationId] = [...(this.messagesDatabase[conversationId] || []), replyMsg];

      // Update conversations metadata, bump to top, and update unread count if inactive
      this._conversations.update(convs => {
        const updated = convs.map(c => {
          if (c.id === conversationId) {
            const isCurrentlySelected = this._activeConversationId() === conversationId;
            return {
              ...c,
              last_message_at: replyMsg.created_at,
              updated_at: new Date().toISOString(),
              unread_count: isCurrentlySelected ? 0 : c.unread_count + 1,
            };
          }
          return c;
        });
        return [...updated].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      // Update active list if it's the active room
      if (this._activeConversationId() === conversationId) {
        this._activeMessages.set([...this.messagesDatabase[conversationId]]);
        // Instantly mark as read if the user is currently looking at this conversation
        this.markAsRead(conversationId);
      }
    }, 4500);
  }

  getLastMessage(conversationId: string): ChatMessage | null {
    const msgs = this.messagesDatabase[conversationId] || [];
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  }

  // Update specific message tick status
  private updateMessageStatus(conversationId: string, messageId: string, status: MessageStatus): void {
    if (this.messagesDatabase[conversationId]) {
      this.messagesDatabase[conversationId] = this.messagesDatabase[conversationId].map(m => {
        if (m.id === messageId) {
          return { ...m, status };
        }
        return m;
      });

      if (this._activeConversationId() === conversationId) {
        this._activeMessages.set([...this.messagesDatabase[conversationId]]);
      }
    }
  }
}
