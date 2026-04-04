import knex from '../config/db';
import { FindUser, NewUser, NewUserProfile, PublicUser } from '../types/user';

const createUser = async (user: NewUser): Promise<{ id: number; email: string }> => {
  return (await knex.insert(user).into('users').returning(['id', 'email']))[0];
};

const createProfile = async (profile: NewUserProfile): Promise<void> => {
  await knex.insert(profile).into('user_profiles');
};

const findUserByEmail = async (findUser: FindUser) => {
  return knex('users')
    .join('user_profiles', 'users.id', 'user_profiles.user_id')
    .where('users.email', findUser.email)
    .select('users.id', 'users.email', 'users.passwordHash', 'user_profiles.name', 'user_profiles.timezone')
    .first();
};

const findUserById = async (id: number): Promise<PublicUser | undefined> => {
  return knex('users')
    .join('user_profiles', 'users.id', 'user_profiles.user_id')
    .where('users.id', id)
    .select('users.id', 'users.email', 'user_profiles.name', 'user_profiles.timezone')
    .first();
};

const updateProfile = async (
  id: number,
  profileFields: Partial<{ name: string; timezone: string }>,
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

export { findUserById, findUserByEmail, createUser, createProfile, updateProfile };
