import 'dotenv/config';
import type { Knex } from 'knex';

type EnvType = Record<'development' | 'test' | 'prod', Knex.Config>;

const pgConnection = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
};

const pgMigrations = {
  directory: './database/migrations',
  extension: 'ts',
};

const config: EnvType = {
  test: {
    client: 'sqlite3',
    connection: { filename: './database/test.sqlite' },
    useNullAsDefault: true,
    migrations: pgMigrations,
  },
  development: {
    client: 'pg',
    connection: pgConnection,
    migrations: pgMigrations,
    seeds: {
      directory: './database/seeds',
      extension: 'ts',
    },
  },
  prod: {
    client: 'pg',
    connection: pgConnection,
    migrations: pgMigrations,
  },
};

export default config;
