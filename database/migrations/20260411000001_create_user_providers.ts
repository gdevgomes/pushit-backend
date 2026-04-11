import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_providers', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('provider', 50).notNullable();       // 'google' | 'apple' | etc.
    table.string('provider_id', 255).notNullable();   // ID externo do provider
    table.string('email', 255).nullable();             // e-mail retornado pelo provider
    table.timestamps(true, true);

    table.unique(['provider', 'provider_id']);
    table.index(['user_id'], 'idx_user_providers_user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_providers');
}
