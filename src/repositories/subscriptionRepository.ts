import knex from '../config/db';
import { GroupSubscription } from '../types/subscription';

const create = async (group_id: number, trial_ends_at: Date): Promise<GroupSubscription> => {
  const [subscription] = await knex('group_subscriptions')
    .insert({ group_id, trial_ends_at: trial_ends_at.toISOString(), monthly_amount: 30.00 })
    .returning(['id', 'group_id', 'status', 'trial_ends_at', 'monthly_amount']);
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

export default { create, getByGroupId, hasTrialGroupByOwner };
