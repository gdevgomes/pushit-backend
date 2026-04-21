import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.string('username', 255).nullable();
  });

  const rows = await knex('users').whereNull('username').select('id');
  for (const row of rows) {
    await knex('users').where({ id: row.id }).update({ username: `user_${row.id}` });
  }

  await knex.schema.alterTable('users', (t) => {
    t.string('username', 255).notNullable().unique().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('username');
  });
}
