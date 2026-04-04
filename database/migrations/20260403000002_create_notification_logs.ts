import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notification_logs', (table) => {
    table.increments('id').primary();
    table.integer('notification_id').unsigned().notNullable()
      .references('id').inTable('notifications').onDelete('CASCADE');
    table.integer('group_id').unsigned().notNullable()
      .references('id').inTable('groups').onDelete('CASCADE');
    table.timestamp('sent_at').notNullable();
    table.string('status', 20).notNullable().defaultTo('sent'); // sent | failed
    table.text('error').nullable();
    table.timestamps(true, true);

    table.index(['group_id'], 'idx_notification_logs_group_id');
    table.index(['notification_id'], 'idx_notification_logs_notification_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notification_logs');
}
