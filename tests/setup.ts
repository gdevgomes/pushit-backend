import db from '../src/config/db';

beforeAll(async () => {
  await db.migrate.latest();
});

afterEach(async () => {
  await db('notifications').del();
  await db('users_groups').del();
  await db('group_subscriptions').del();
  await db('groups').del();
  await db('users').del();
});
