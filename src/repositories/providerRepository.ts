import knex from '../config/db';
import { NewUserProvider, UserProvider } from '../types/user';

const findByProvider = async (provider: string, provider_id: string): Promise<UserProvider | undefined> => {
  return knex('user_providers').where({ provider, provider_id }).first();
};

const create = async (data: NewUserProvider): Promise<UserProvider> => {
  const [row] = await knex('user_providers').insert(data).returning(['id', 'user_id', 'provider', 'provider_id']);
  return row;
};

export default { findByProvider, create };
