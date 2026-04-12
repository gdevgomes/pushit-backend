import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_profiles', (table) => {
    table.text('push_token').nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_profiles', (table) => {
    table.dropColumn('push_token');
  });
}
