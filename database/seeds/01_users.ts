import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

const timezones = [
  'America/Sao_Paulo',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
];

const firstNames = [
  'Alice', 'Bob', 'Carol', 'David', 'Eva', 'Felipe', 'Gabi', 'Hugo',
  'Iris', 'João', 'Karen', 'Lucas', 'Maria', 'Nathan', 'Olivia', 'Pedro',
  'Quinn', 'Rafael', 'Sara', 'Tiago', 'Ursula', 'Victor', 'Wendy', 'Xande',
  'Yasmin', 'Zeca',
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Ferreira', 'Costa',
  'Carvalho', 'Alves', 'Martins', 'Pereira', 'Rodrigues', 'Gomes', 'Ribeiro',
];

export async function seed(knex: Knex): Promise<void> {
  await knex('users_groups').del();
  await knex('groups').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = Array.from({ length: 100 }, (_, i) => {
    const id = i + 1;
    const first = firstNames[i % firstNames.length];
    const last = lastNames[i % lastNames.length];
    return {
      id,
      name: `${first} ${last}`,
      email: `user${id}@test.com`,
      timezone: timezones[i % timezones.length],
      passwordHash,
    };
  });

  await knex('users').insert(users);
}
