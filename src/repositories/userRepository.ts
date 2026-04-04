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

const updateUserName = async (id: number, name: string): Promise<PublicUser | undefined> => {
  await knex('user_profiles').where({ user_id: id }).update({ name });
  return findUserById(id);
};

export { findUserById, findUserByEmail, createUser, createProfile, updateUserName };
