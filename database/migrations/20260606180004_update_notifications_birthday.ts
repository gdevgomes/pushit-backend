import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('description');
    table.integer('month').notNullable();
    table.integer('day').notNullable();
    table.string('timezone').notNullable();
    table.timestamp('scheduled_at').notNullable();
    table
      .integer('group_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('groups')
      .onDelete('CASCADE');
    table
      .integer('created_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('description');
    table.timestamp('date').notNullable();
    table.string('timezone').notNullable();
    table
      .integer('group_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('groups')
      .onDelete('CASCADE');
    table
      .integer('created_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamps(true, true);
  });
}
