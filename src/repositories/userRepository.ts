import knex from '../config/db';
import { FindUser, NewUser, User } from '../types/user';

const findUserById = async (id: number) => {
  return await knex('users').where({ id }).first();
};

const findUserByEmail = async (findUser: FindUser) => {
  return await knex
    .select('*')
    .from('users')
    .where({ email: findUser.email })
    .first();
};
const createUser = async (user: NewUser) => {
  return (
    await knex.insert(user).into('users').returning(['id', 'name', 'email', 'timezone'])
  )[0];
};

const updateUserName = async (id: number, name: string) => {
  return await knex('users')
    .where({ id })
    .update({ name })
    .returning(['id', 'name', 'email']);
};

export { findUserById, findUserByEmail, createUser, updateUserName };
