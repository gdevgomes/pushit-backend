export type SubscriptionStatus = 'trial' | 'active' | 'overdue' | 'cancelled';

export interface GroupSubscription {
  id: number;
  group_id: number;
  plan_id: number;
  status: SubscriptionStatus;
  trial_ends_at: string;
  monthly_amount: number;
  paid_until: string | null;
}
