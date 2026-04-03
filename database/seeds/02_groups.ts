import type { Knex } from 'knex';
import { generateCode } from '../../src/utils/generateGroupCode';

export async function seed(knex: Knex): Promise<void> {
  await knex('users_groups').del();
  await knex('groups').del();

  await knex('groups').insert([
    { id: 1, name: 'Dev Team',  description: 'Grupo de desenvolvedores', code: generateCode(1), owner_id: 1 },
    { id: 2, name: 'Design',    description: 'Grupo de designers',        code: generateCode(2), owner_id: 2 },
    { id: 3, name: 'Marketing', description: 'Grupo de marketing',        code: generateCode(3), owner_id: 3 },
  ]);

  // Distribui os 100 usuários pelos 3 grupos
  // Grupo 1 (Dev Team):  users 1–40   → dono: user 1
  // Grupo 2 (Design):    users 21–70  → dono: user 2
  // Grupo 3 (Marketing): users 51–100 → dono: user 3
  const memberships: { user_id: number; group_id: number }[] = [];

  for (let uid = 1; uid <= 40; uid++)  memberships.push({ user_id: uid, group_id: 1 });
  for (let uid = 21; uid <= 70; uid++) memberships.push({ user_id: uid, group_id: 2 });
  for (let uid = 51; uid <= 100; uid++) memberships.push({ user_id: uid, group_id: 3 });

  await knex('users_groups').insert(memberships);
}
