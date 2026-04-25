import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.string('account_type', 20).notNullable().defaultTo('local');
    t.string('device_id', 255).nullable().unique();
  });

  await knex.schema.alterTable('users', (t) => {
    t.string('email', 255).nullable().alter();
    t.string('username', 255).nullable().alter();
    t.string('passwordHash', 255).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('device_id');
    t.dropColumn('account_type');
  });

  await knex.schema.alterTable('users', (t) => {
    t.string('email', 255).notNullable().alter();
    t.string('username', 255).notNullable().alter();
    t.string('passwordHash', 255).notNullable().alter();
  });
}