export enum NotificationType {
  GENERAL = 'GENERAL',
  OFFER = 'OFFER',
  VOUCHER = 'VOUCHER',
  WALLET = 'WALLET',
  MEETING = 'MEETING',
  CHAT = 'CHAT',
}

export enum NotificationAudience {
  SINGLE_USER = 'SINGLE_USER',
  BULK_USERS = 'BULK_USERS',
  ALL_MEMBERS = 'ALL_MEMBERS',
  ALL_CUSTOMERS = 'ALL_CUSTOMERS'
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  target_ids?: string[]; // Used for SINGLE_USER or BULK_USERS (legacy UUIDs)
  target_phones?: string[]; // Used for SINGLE_USER or BULK_USERS (phone numbers)
  data?: Record<string, any>;
  created_at: string;
}

export interface AdminNotificationFilters {
  type?: NotificationType;
  audience?: NotificationAudience;
}
