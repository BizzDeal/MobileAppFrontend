export enum NotificationType {
  GENERAL = 'GENERAL',
  OFFER = 'OFFER',
  VOUCHER = 'VOUCHER',
  WALLET = 'WALLET',
  MEETING = 'MEETING',
  CHAT = 'CHAT',
}

export interface NotificationDTO {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data: Record<string, any> | null;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
