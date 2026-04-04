import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('notification_logs').del();
  await knex('notifications').del();

  // Sample notifications for each group (owner_id = 1)
  await knex('notifications').insert([
    { id: 1, group_id: 1, name: 'Enterprise Annual Review',   description: 'Annual performance review reminder', month: 12, day: 1,  timezone: 'America/Sao_Paulo', scheduled_at: '2026-12-01T09:00:00.000Z', created_by: 1 },
    { id: 2, group_id: 1, name: 'Enterprise Q2 Planning',    description: 'Q2 planning session',               month: 4,  day: 15, timezone: 'America/Sao_Paulo', scheduled_at: '2026-04-15T09:00:00.000Z', created_by: 1 },
    { id: 3, group_id: 2, name: 'Business Monthly Report',   description: 'Monthly metrics review',            month: 5,  day: 1,  timezone: 'America/Sao_Paulo', scheduled_at: '2026-05-01T09:00:00.000Z', created_by: 1 },
    { id: 4, group_id: 2, name: 'Business Team Sync',        description: 'Weekly team sync reminder',         month: 6,  day: 10, timezone: 'America/Sao_Paulo', scheduled_at: '2026-06-10T09:00:00.000Z', created_by: 1 },
    { id: 5, group_id: 3, name: 'Pro Billing Reminder',      description: 'Monthly billing cycle',             month: 7,  day: 5,  timezone: 'America/Sao_Paulo', scheduled_at: '2026-07-05T09:00:00.000Z', created_by: 1 },
    { id: 6, group_id: 4, name: 'Starter Welcome',           description: 'Welcome to the group',             month: 8,  day: 20, timezone: 'America/Sao_Paulo', scheduled_at: '2026-08-20T09:00:00.000Z', created_by: 1 },
  ]);

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await knex('notification_logs').insert([
    { notification_id: 1, group_id: 1, sent_at: oneDayAgo,  status: 'sent' },
    { notification_id: 2, group_id: 1, sent_at: twoHoursAgo, status: 'sent' },
    { notification_id: 3, group_id: 2, sent_at: oneHourAgo,  status: 'sent' },
    { notification_id: 4, group_id: 2, sent_at: oneDayAgo,  status: 'failed', error: 'Recipient unreachable' },
    { notification_id: 5, group_id: 3, sent_at: twoHoursAgo, status: 'sent' },
    { notification_id: 6, group_id: 4, sent_at: oneHourAgo,  status: 'sent' },
  ]);
}
