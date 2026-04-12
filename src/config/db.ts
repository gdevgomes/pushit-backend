import knex from 'knex';
import config from '../../knexfile';

type Env = 'development' | 'test' | 'prod';

const env: Env =
  process.env.NODE_ENV === 'production'
    ? 'prod'
    : process.env.NODE_ENV === 'test'
      ? 'test'
      : 'development';

const db = knex(config[env]);

export default db;
