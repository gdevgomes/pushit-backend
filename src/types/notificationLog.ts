export type NotificationLogStatus = 'sent' | 'failed';

export interface NotificationLog {
  id: number;
  notification_id: number;
  group_id: number;
  sent_at: string;
  status: NotificationLogStatus;
  error?: string;
  created_at: string;
}

export interface NewNotificationLog {
  notification_id: number;
  group_id: number;
  sent_at: Date;
  status: NotificationLogStatus;
  error?: string;
}
