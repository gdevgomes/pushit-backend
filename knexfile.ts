import type { Knex } from 'knex';

type EnvType = Record<'development' | 'test' | 'prod', Knex.Config>;

const config: EnvType = {
  test: {
    client: 'sqlite3',
    connection: { filename: './database/test.sqlite' },
    useNullAsDefault: true,
    migrations: {
      directory: './database/migrations',
      extension: 'ts',
    },
  },
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database/dev.sqlite',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './database/seeds',
      extension: 'ts',
    },
  },
  prod: {},
};

export default config;
