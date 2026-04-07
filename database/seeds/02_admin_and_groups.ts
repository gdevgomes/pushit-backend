import type { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { generateCode } from '../../src/utils/generateGroupCode';

// Admin credentials (dev only)
// email: admin@admin.com / password: admin123
//
// Members (dev only)
// password: member123
// id=2  ana@email.com       Ana Silva
// id=3  carlos@email.com    Carlos Santos
// id=4  mariana@email.com   Mariana Oliveira
// id=5  pedro@email.com     Pedro Costa
// id=6  juliana@email.com   Juliana Ferreira
// id=7  roberto@email.com   Roberto Alves
// id=8  fernanda@email.com  Fernanda Lima

export async function seed(knex: Knex): Promise<void> {
  await knex('notification_logs').del();
  await knex('notifications').del();
  await knex('payments').del();
  await knex('users_groups').del();
  await knex('group_subscriptions').del();
  await knex('groups').del();
  await knex('user_profiles').del();
  await knex('users').del();

  const adminHash  = await bcrypt.hash('admin123', 10);
  const memberHash = await bcrypt.hash('member123', 10);

  await knex('users').insert([
    { id: 1, email: 'admin@admin.com',    passwordHash: adminHash  },
    { id: 2, email: 'ana@email.com',      passwordHash: memberHash },
    { id: 3, email: 'carlos@email.com',   passwordHash: memberHash },
    { id: 4, email: 'mariana@email.com',  passwordHash: memberHash },
    { id: 5, email: 'pedro@email.com',    passwordHash: memberHash },
    { id: 6, email: 'juliana@email.com',  passwordHash: memberHash },
    { id: 7, email: 'roberto@email.com',  passwordHash: memberHash },
    { id: 8, email: 'fernanda@email.com', passwordHash: memberHash },
  ]);

  await knex('user_profiles').insert([
    { user_id: 1, name: 'Admin',            timezone: 'America/Sao_Paulo' },
    { user_id: 2, name: 'Ana Silva',        timezone: 'America/Sao_Paulo' },
    { user_id: 3, name: 'Carlos Santos',    timezone: 'America/Sao_Paulo' },
    { user_id: 4, name: 'Mariana Oliveira', timezone: 'America/Sao_Paulo' },
    { user_id: 5, name: 'Pedro Costa',      timezone: 'America/Sao_Paulo' },
    { user_id: 6, name: 'Juliana Ferreira', timezone: 'America/Sao_Paulo' },
    { user_id: 7, name: 'Roberto Alves',    timezone: 'America/Sao_Paulo' },
    { user_id: 8, name: 'Fernanda Lima',    timezone: 'America/Sao_Paulo' },
  ]);

  const now               = new Date();
  const oneYearFromNow    = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

  await knex('groups').insert([
    { id: 1, name: 'Enterprise Group', owner_id: 1, code: generateCode(1) },
    { id: 2, name: 'Business Group',   owner_id: 1, code: generateCode(2) },
    { id: 3, name: 'Pro Group',        owner_id: 1, code: generateCode(3) },
    { id: 4, name: 'Starter Group',    owner_id: 1, code: generateCode(4) },
  ]);

  // Enterprise (1): admin + todos os 7 membros
  // Business  (2): admin + Ana, Carlos, Mariana, Pedro
  // Pro       (3): admin + Ana, Roberto, Fernanda
  // Starter   (4): admin + Carlos, Juliana
  await knex('users_groups').insert([
    { user_id: 1, group_id: 1 },
    { user_id: 2, group_id: 1 },
    { user_id: 3, group_id: 1 },
    { user_id: 4, group_id: 1 },
    { user_id: 5, group_id: 1 },
    { user_id: 6, group_id: 1 },
    { user_id: 7, group_id: 1 },
    { user_id: 8, group_id: 1 },

    { user_id: 1, group_id: 2 },
    { user_id: 2, group_id: 2 },
    { user_id: 3, group_id: 2 },
    { user_id: 4, group_id: 2 },
    { user_id: 5, group_id: 2 },

    { user_id: 1, group_id: 3 },
    { user_id: 2, group_id: 3 },
    { user_id: 7, group_id: 3 },
    { user_id: 8, group_id: 3 },

    { user_id: 1, group_id: 4 },
    { user_id: 3, group_id: 4 },
    { user_id: 6, group_id: 4 },
  ]);

  await knex('group_subscriptions').insert([
    { group_id: 1, plan_id: 4, status: 'active', monthly_amount: 0,   trial_ends_at: now,              paid_until: oneYearFromNow    },
    { group_id: 2, plan_id: 3, status: 'active', monthly_amount: 100, trial_ends_at: now,              paid_until: oneYearFromNow    },
    { group_id: 3, plan_id: 2, status: 'active', monthly_amount: 50,  trial_ends_at: now,              paid_until: oneYearFromNow    },
    { group_id: 4, plan_id: 1, status: 'trial',  monthly_amount: 30,  trial_ends_at: threeMonthsFromNow, paid_until: null            },
  ]);
}
