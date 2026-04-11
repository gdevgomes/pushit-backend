import { beforeAll, afterEach } from 'vitest';
import db from '../src/config/db';

beforeAll(async () => {
  await db.migrate.rollback({ all: true } as Record<string, unknown>);
  await db.migrate.latest();

  await db('group_plans').insert([
    {
      id: 1,
      slug: 'starter',
      name: 'Starter',
      monthly_amount: 30.00,
      max_members: 25,
      max_notifications_per_member: 1,
      max_notifications_owner: 5,
      trial_months: 3,
    },
    {
      id: 2,
      slug: 'pro',
      name: 'Pro',
      monthly_amount: 50.00,
      max_members: 50,
      max_notifications_per_member: 3,
      max_notifications_owner: 20,
      trial_months: 0,
    },
    {
      id: 3,
      slug: 'business',
      name: 'Business',
      monthly_amount: 100.00,
      max_members: 200,
      max_notifications_per_member: 10,
      max_notifications_owner: 50,
      trial_months: 0,
    },
    {
      id: 4,
      slug: 'enterprise',
      name: 'Enterprise',
      monthly_amount: null,
      max_members: null,
      max_notifications_per_member: null,
      max_notifications_owner: null,
      trial_months: 0,
    },
  ]);
});

afterEach(async () => {
  await db('notification_logs').del();
  await db('notifications').del();
  await db('payments').del();
  await db('users_groups').del();
  await db('group_subscriptions').del();
  await db('groups').del();
  await db('user_providers').del();
  await db('user_profiles').del();
  await db('users').del();
});
