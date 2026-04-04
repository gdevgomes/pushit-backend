import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('passwordHash', 255).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('user_profiles', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().unique()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('timezone', 100).notNullable().defaultTo('UTC');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('group_plans', (table) => {
    table.increments('id').primary();
    table.string('slug', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.decimal('monthly_amount', 10, 2).nullable();        // null = enterprise (a negociar)
    table.integer('max_members').nullable();                  // null = ilimitado
    table.integer('max_notifications_per_member').nullable(); // null = ilimitado
    table.integer('max_notifications_owner').nullable();      // null = ilimitado
    table.integer('trial_months').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('groups', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('description', 255).nullable();
    table.string('code', 6).nullable().unique();
    table.integer('owner_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.index(['owner_id'], 'idx_groups_owner_id');
  });

  await knex.schema.createTable('users_groups', (table) => {
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.integer('group_id').unsigned().notNullable()
      .references('id').inTable('groups').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'group_id']);

    table.index(['user_id'], 'idx_users_groups_user_id');
    table.index(['group_id'], 'idx_users_groups_group_id');
  });

  await knex.schema.createTable('group_subscriptions', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable().unique()
      .references('id').inTable('groups').onDelete('CASCADE');
    table.integer('plan_id').unsigned().nullable()
      .references('id').inTable('group_plans');
    table.string('status', 50).notNullable().defaultTo('trial'); // trial | active | overdue | cancelled
    table.timestamp('trial_ends_at').notNullable();
    table.timestamp('paid_until').nullable().defaultTo(null);
    table.decimal('monthly_amount', 10, 2).notNullable().defaultTo(30.00);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('description', 255).nullable();
    table.integer('month').notNullable();
    table.integer('day').notNullable();
    table.string('timezone', 100).notNullable();
    table.timestamp('scheduled_at').notNullable();
    table.integer('group_id').unsigned().notNullable()
      .references('id').inTable('groups').onDelete('CASCADE');
    table.integer('created_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.index(['group_id'], 'idx_notifications_group_id');
    table.index(['group_id', 'created_by'], 'idx_notifications_group_user');
  });

  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable()
      .references('id').inTable('groups').onDelete('CASCADE');
    table.integer('subscription_id').unsigned().notNullable()
      .references('id').inTable('group_subscriptions').onDelete('CASCADE');
    table.string('external_id', 255).notNullable().unique();
    table.decimal('amount', 10, 2).notNullable();
    table.string('status', 50).notNullable().defaultTo('pending'); // pending | paid | expired | failed
    table.text('pix_br_code').notNullable();
    table.text('pix_br_code_base64').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('paid_at').nullable().defaultTo(null);
    table.timestamps(true, true);

    table.index(['group_id'], 'idx_payments_group_id');
    table.index(['status'], 'idx_payments_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('group_subscriptions');
  await knex.schema.dropTableIfExists('users_groups');
  await knex.schema.dropTableIfExists('groups');
  await knex.schema.dropTableIfExists('group_plans');
  await knex.schema.dropTableIfExists('user_profiles');
  await knex.schema.dropTableIfExists('users');
}
