export interface GroupPlan {
  id: number;
  slug: string;
  name: string;
  monthly_amount: number | null; // null = enterprise (a negociar)
  max_members: number | null;                   // null = ilimitado
  max_notifications_per_member: number | null;  // null = ilimitado
  max_notifications_owner: number | null;       // null = ilimitado
  trial_months: number;
}
