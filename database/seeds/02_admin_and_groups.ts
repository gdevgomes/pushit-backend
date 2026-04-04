import type { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { generateCode } from '../../src/utils/generateGroupCode';

// Admin credentials (dev only)
// email: admin@admin.com
// password: admin123

export async function seed(knex: Knex): Promise<void> {
  await knex('notifications').del();
  await knex('payments').del();
  await knex('users_groups').del();
  await knex('group_subscriptions').del();
  await knex('groups').del();
  await knex('user_profiles').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('admin123', 10);

  await knex('users').insert({ id: 1, email: 'admin@admin.com', passwordHash });
  await knex('user_profiles').insert({ user_id: 1, name: 'Admin', timezone: 'America/Sao_Paulo' });

  // One group per plan — Enterprise first
  const now = new Date();
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

  await knex('groups').insert([
    { id: 1, name: 'Enterprise Group', owner_id: 1, code: generateCode(1) },
    { id: 2, name: 'Business Group',   owner_id: 1, code: generateCode(2) },
    { id: 3, name: 'Pro Group',        owner_id: 1, code: generateCode(3) },
    { id: 4, name: 'Starter Group',    owner_id: 1, code: generateCode(4) },
  ]);

  await knex('users_groups').insert([
    { user_id: 1, group_id: 1 },
    { user_id: 1, group_id: 2 },
    { user_id: 1, group_id: 3 },
    { user_id: 1, group_id: 4 },
  ]);

  await knex('group_subscriptions').insert([
    // Enterprise — active, amount negotiated (0 = placeholder)
    { group_id: 1, plan_id: 4, status: 'active', monthly_amount: 0, trial_ends_at: now, paid_until: oneYearFromNow },
    // Business — active
    { group_id: 2, plan_id: 3, status: 'active', monthly_amount: 100, trial_ends_at: now, paid_until: oneYearFromNow },
    // Pro — active
    { group_id: 3, plan_id: 2, status: 'active', monthly_amount: 50, trial_ends_at: now, paid_until: oneYearFromNow },
    // Starter — trial
    { group_id: 4, plan_id: 1, status: 'trial', monthly_amount: 30, trial_ends_at: threeMonthsFromNow, paid_until: null },
  ]);
}
