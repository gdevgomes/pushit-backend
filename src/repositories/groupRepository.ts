import knex from '../config/db';
import { Group, NewGroup } from '../types/group';
import { generateCode } from '../utils/generateGroupCode';

const createGroup = async (data: NewGroup) => {
  const [inserted] = await knex('groups')
    .insert({ ...data, code: 'temp' })
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

// Used internally for auth/ownership checks — returns all groups without pagination
const getGroupsByUser = async (user_id: number) => {
  return await knex('groups')
    .join('users_groups', 'groups.id', 'users_groups.group_id')
    .join('users as owner', 'groups.owner_id', 'owner.id')
    .join('user_profiles as owner_profile', 'owner.id', 'owner_profile.user_id')
    .leftJoin('group_subscriptions as sub', 'groups.id', 'sub.group_id')
    .where('users_groups.user_id', user_id)
    .select(
      'groups.id',
      'groups.name',
      'groups.description',
      'groups.code',
      'owner.id as owner_id',
      'owner_profile.name as owner_name',
      'owner.email as owner_email',
      'sub.status as subscription_status',
      'sub.trial_ends_at as subscription_trial_ends_at',
      'sub.monthly_amount as subscription_monthly_amount'
    );
};

// Used for listing — returns paginated groups
const getPaginatedGroupsByUser = async (user_id: number, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const baseQuery = () =>
    knex('groups')
      .join('users_groups', 'groups.id', 'users_groups.group_id')
      .where('users_groups.user_id', user_id);

  const [data, [{ total }]] = await Promise.all([
    baseQuery()
      .join('users as owner', 'groups.owner_id', 'owner.id')
      .join('user_profiles as owner_profile', 'owner.id', 'owner_profile.user_id')
      .leftJoin('group_subscriptions as sub', 'groups.id', 'sub.group_id')
      .select(
        'groups.id',
        'groups.name',
        'groups.description',
        'groups.code',
        'owner.id as owner_id',
        'owner_profile.name as owner_name',
        'owner.email as owner_email',
        'sub.status as subscription_status',
        'sub.trial_ends_at as subscription_trial_ends_at',
        'sub.monthly_amount as subscription_monthly_amount'
      )
      .limit(limit)
      .offset(offset),
    baseQuery().count('groups.id as total'),
  ]);

  return { data, total: Number(total) };
};

const countUsersByGroup = async (group_id: number): Promise<number> => {
  const [{ total }] = await knex('users_groups').where({ group_id }).count('* as total');
  return Number(total);
};

const getPaginatedUsersByGroup = async (group_id: number, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    knex('users')
      .join('users_groups', 'users.id', 'users_groups.user_id')
      .join('user_profiles', 'users.id', 'user_profiles.user_id')
      .where('users_groups.group_id', group_id)
      .select('users.id', 'user_profiles.name', 'users.email', 'user_profiles.timezone')
      .limit(limit)
      .offset(offset),
    knex('users_groups').where({ group_id }).count('* as total'),
  ]);

  return { data, total: Number(total) };
};

// Kept for addUserToGroup member-limit check
const getUsersByGroup = async (group_id: number) => {
  return await knex('users')
    .join('users_groups', 'users.id', 'users_groups.user_id')
    .join('user_profiles', 'users.id', 'user_profiles.user_id')
    .where('users_groups.group_id', group_id)
    .select('users.id', 'user_profiles.name', 'users.email', 'user_profiles.timezone');
};

const getGroupById = async (groupId: number) => {
  return await knex('groups').where({ id: groupId }).first();
};

const getGroupByCode = async (code: string) => {
  return await knex('groups')
    .join('users as owner', 'groups.owner_id', 'owner.id')
    .join('user_profiles as owner_profile', 'owner.id', 'owner_profile.user_id')
    .where('groups.code', code)
    .select('groups.id', 'groups.name', 'groups.description', 'groups.code', 'groups.owner_id', 'owner_profile.name as owner_name')
    .first();
};

const getOldestMember = async (groupId: number, excludeUserId: number) => {
  return await knex('users_groups')
    .where({ group_id: groupId })
    .whereNot({ user_id: excludeUserId })
    .orderBy('created_at', 'asc')
    .select('user_id')
    .first();
};

const deleteGroup = async (groupId: number) => {
  await knex('groups').where({ id: groupId }).del();
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
  getPaginatedGroupsByUser,
  countUsersByGroup,
  getUsersByGroup,
  getPaginatedUsersByGroup,
  getGroupById,
  getGroupByCode,
  updateGroup,
  getOldestMember,
  deleteGroup,
};
