export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  VOICE = 'VOICE',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export interface ChatPartner {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  profile_pic_url: string | null;
  isOnline: boolean;
  lastSeen?: Date | string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  message: string | null;
  media_file_id: string | null;
  media_url?: string | null;
  media_name?: string | null;
  media_size?: string | null;
  is_read: boolean;
  read_at: Date | string | null;
  is_edited: boolean;
  edited_at?: Date | string | null;
  is_deleted: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  status: MessageStatus;
}

export interface ChatConversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  last_message_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  unread_count: number;
  partner: ChatPartner;
}
