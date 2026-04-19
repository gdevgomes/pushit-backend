export interface Notification {
  id: number;
  name: string;
  description?: string;
  month: number;
  day: number;
  hour?: number | null;
  timezone: string;
  scheduled_at: string;
  group_id: number;
  created_by: number;
}

export interface NewNotification {
  name: string;
  description?: string;
  month: number;
  day: number;
  hour?: number | null;
  timezone: string;
  scheduled_at: string;
  group_id: number;
  created_by: number;
}
