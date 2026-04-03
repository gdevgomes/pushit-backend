import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users_groups', (table) => {
    table
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('group_id')
      .unsigned()
      .references('id')
      .inTable('groups')
      .onDelete('CASCADE');
    table.primary(['user_id', 'group_id']);
    table.primary(['user_id', 'group_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users_groups');
}
