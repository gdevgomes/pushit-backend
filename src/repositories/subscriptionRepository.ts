import knex from '../config/db';
import { GroupSubscription } from '../types/subscription';

const create = async (
  group_id: number,
  trial_ends_at: Date,
  plan_id: number,
  monthly_amount: number,
): Promise<GroupSubscription> => {
  const [subscription] = await knex('group_subscriptions')
    .insert({ group_id, trial_ends_at: trial_ends_at.toISOString(), plan_id, monthly_amount })
    .returning(['id', 'group_id', 'plan_id', 'status', 'trial_ends_at', 'monthly_amount']);
  return subscription;
};

const getByGroupId = async (group_id: number): Promise<GroupSubscription | undefined> => {
  return await knex('group_subscriptions').where({ group_id }).first();
};

const hasTrialGroupByOwner = async (owner_id: number): Promise<boolean> => {
  const result = await knex('group_subscriptions')
    .join('groups', 'group_subscriptions.group_id', 'groups.id')
    .where('groups.owner_id', owner_id)
    .where('group_subscriptions.status', 'trial')
    .first();
  return !!result;
};

const updateStatus = async (group_id: number, status: string): Promise<void> => {
  await knex('group_subscriptions').where({ group_id }).update({ status });
};

const updatePaidUntil = async (group_id: number, paid_until: Date): Promise<void> => {
  await knex('group_subscriptions').where({ group_id }).update({ paid_until: paid_until.toISOString() });
};

export default { create, getByGroupId, hasTrialGroupByOwner, updateStatus, updatePaidUntil };
