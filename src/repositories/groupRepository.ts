import knex from '../config/db';
import { Group, NewGroup, UserGroup } from '../types/group';
import { generateCode } from '../utils/generateGroupCode';

const createGroup = async (data: NewGroup) => {
  const [inserted] = await knex('groups')
    .insert({ ...data, code: 'temp' }) // code temporário
    .returning(['id', 'name', 'description', 'owner_id']);

  const code = generateCode(inserted.id);
  const [updated] = await knex('groups')
    .where({ id: inserted.id })
    .update({ code })
    .returning(['id', 'name', 'description', 'code', 'owner_id']);

  return updated;
};

const addUserToGroup = async (user_id: number, group_id: number) => {
  return await knex('users_groups').insert({ user_id, group_id });
};

const removeUserFromGroup = async (user_id: number, group_id: number) => {
  return await knex('users_groups').where({ user_id, group_id }).del();
};

const getGroupsByUser = async (user_id: number) => {
  return await knex('groups')
    .join('users_groups', 'groups.id', 'users_groups.group_id')
    .join('users as owner', 'groups.owner_id', 'owner.id')
    .leftJoin('group_subscriptions as sub', 'groups.id', 'sub.group_id')
    .where('users_groups.user_id', user_id)
    .select(
      'groups.id',
      'groups.name',
      'groups.description',
      'groups.code',
      'owner.id as owner_id',
      'owner.name as owner_name',
      'owner.email as owner_email',
      'sub.status as subscription_status',
      'sub.trial_ends_at as subscription_trial_ends_at',
      'sub.monthly_amount as subscription_monthly_amount'
    );
};

const getUsersByGroup = async (group_id: number) => {
  return await knex('users')
    .join('users_groups', 'users.id', 'users_groups.user_id')
    .where('users_groups.group_id', group_id)
    .select('users.*');
};

const getGroupById = async (groupId: number) => {
  return await knex('groups').where({ id: groupId }).first();
};

const updateGroup = async (groupId: number, data: Partial<Group>) => {
  return await knex('groups')
    .where({ id: groupId })
    .update(data)
    .returning(['id', 'name', 'description', 'code', 'owner_id']);
};

export default {
  createGroup,
  addUserToGroup,
  removeUserFromGroup,
  getGroupsByUser,
  getUsersByGroup,
  getGroupById,
  updateGroup,
};
