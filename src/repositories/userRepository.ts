import knex from '../config/db';
import { FindUser, NewUser, NewUserProfile, PublicUser } from '../types/user';

const createUser = async (user: NewUser): Promise<{ id: number; username: string | null; email: string | null }> => {
  return (await knex.insert(user).into('users').returning(['id', 'username', 'email']))[0];
};

const createProfile = async (profile: NewUserProfile): Promise<void> => {
  await knex.insert(profile).into('user_profiles');
};

const findUserByEmail = async (findUser: FindUser) => {
  return knex('users')
    .join('user_profiles', 'users.id', 'user_profiles.user_id')
    .where('users.email', findUser.email)
    .select('users.id', 'users.account_type', 'users.username', 'users.email', 'users.passwordHash', 'user_profiles.name', 'user_profiles.timezone', 'user_profiles.push_token')
    .first();
};

const findUserByUsername = async (username: string) => {
  return knex('users')
    .join('user_profiles', 'users.id', 'user_profiles.user_id')
    .where('users.username', username)
    .select('users.id', 'users.account_type', 'users.username', 'users.email', 'users.passwordHash', 'user_profiles.name', 'user_profiles.timezone', 'user_profiles.push_token')
    .first();
};

const findUserById = async (id: number): Promise<PublicUser | undefined> => {
  return knex('users')
    .join('user_profiles', 'users.id', 'user_profiles.user_id')
    .where('users.id', id)
    .select('users.id', 'users.account_type', 'users.username', 'users.email', 'user_profiles.name', 'user_profiles.timezone', 'user_profiles.push_token')
    .first();
};

const findUserByDeviceId = async (device_id: string) => {
  return knex('users')
    .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
    .where('users.device_id', device_id)
    .select('users.id', 'users.account_type', 'users.device_id', 'users.username', 'users.email', 'user_profiles.name', 'user_profiles.timezone', 'user_profiles.push_token')
    .first();
};

const createDeviceUser = async (device_id: string): Promise<{ id: number }> => {
  const [row] = await knex('users')
    .insert({ device_id, account_type: 'device', email: null, username: null, passwordHash: null })
    .returning(['id']);
  return row;
};

const elevateToLocal = async (
  userId: number,
  data: { email: string; username: string; passwordHash: string },
): Promise<void> => {
  await knex('users').where({ id: userId }).update({ ...data, account_type: 'local' });
};

const elevateToProvider = async (
  userId: number,
  data: { email: string; username: string },
): Promise<void> => {
  await knex('users').where({ id: userId }).update({ ...data, account_type: 'provider' });
};

const updateProfile = async (
  id: number,
  profileFields: Partial<{ name: string; timezone: string; push_token: string }>,
  userFields: Partial<{ email: string; passwordHash: string }>,
): Promise<PublicUser | undefined> => {
  if (Object.keys(profileFields).length > 0) {
    await knex('user_profiles').where({ user_id: id }).update(profileFields);
  }
  if (Object.keys(userFields).length > 0) {
    await knex('users').where({ id }).update(userFields);
  }
  return findUserById(id);
};

export {
  findUserById,
  findUserByEmail,
  findUserByUsername,
  findUserByDeviceId,
  createUser,
  createProfile,
  createDeviceUser,
  elevateToLocal,
  elevateToProvider,
  updateProfile,
};
