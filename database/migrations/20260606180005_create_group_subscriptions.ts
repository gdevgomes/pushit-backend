import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('group_subscriptions', (table) => {
    table.increments('id').primary();
    table
      .integer('group_id')
      .unsigned()
      .notNullable()
      .unique()
      .references('id')
      .inTable('groups')
      .onDelete('CASCADE');
    // trial | active | overdue | cancelled
    table.string('status').notNullable().defaultTo('trial');
    table.timestamp('trial_ends_at').notNullable();
    table.decimal('monthly_amount', 10, 2).notNullable().defaultTo(30.00);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('group_subscriptions');
}
