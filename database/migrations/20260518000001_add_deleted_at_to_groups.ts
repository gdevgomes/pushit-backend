import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('groups', (table) => {
    table.timestamp('deleted_at').nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('groups', (table) => {
    table.dropColumn('deleted_at');
  });
}
