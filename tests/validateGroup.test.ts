import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin } from './helpers/auth';
import db from '../src/config/db';

async function createGroup(token: string, planSlug = 'sand-box') {
  const res = await request(app)
    .post('/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Grupo Teste', description: 'Desc', plan_slug: planSlug });
  return res.body as { id: number; code: string };
}

async function bulkAddMembers(groupId: number, count: number) {
  const users = Array.from({ length: count }, (_, i) => ({
    email: `bulk_${i}_${Date.now()}@test.com`,
    passwordHash: 'fakehash',
    username: `bulk_${i}_${Date.now()}`,
  }));
  const inserted = await db('users').insert(users).returning('id');
  const ids = inserted.map((r: { id: number } | number) =>
    typeof r === 'object' ? r.id : r,
  );
  await db('user_profiles').insert(
    ids.map((user_id: number) => ({ user_id, name: 'Bulk', timezone: 'UTC' })),
  );
  await db('users_groups').insert(
    ids.map((user_id: number) => ({ user_id, group_id: groupId })),
  );
}

describe('POST /group/validate-group', () => {
  it('retorna available:true para grupo existente com vagas', async () => {
    const { token } = await registerAndLogin();
    const group = await createGroup(token);

    const res = await request(app)
      .post('/group/validate-group')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: group.id });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.group).toMatchObject({ id: group.id, name: 'Grupo Teste' });
    expect(res.body.group).toHaveProperty('member_count');
    expect(res.body.group).toHaveProperty('max_members');
  });

  it('retorna 404 para grupo inexistente', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/group/validate-group')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: 999999 });

    expect(res.status).toBe(404);
    expect(res.body.key).toBe('GROUP_NOT_FOUND');
  });

  it('retorna 400 quando limite de membros foi atingido', async () => {
    const { token } = await registerAndLogin();
    const group = await createGroup(token, 'starter'); // max_members: 25

    await bulkAddMembers(group.id, 24); // já tem o owner = 25 total

    const res = await request(app)
      .post('/group/validate-group')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: group.id });

    expect(res.status).toBe(400);
    expect(res.body.key).toBe('MEMBER_LIMIT_REACHED');
  });

  it('retorna 400 para groupId inválido', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/group/validate-group')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: -1 });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/group/validate-group')
      .send({ groupId: 1 });

    expect(res.status).toBe(401);
  });
});
