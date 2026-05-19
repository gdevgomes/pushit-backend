import { vi, describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin } from './helpers/auth';
import db from '../src/config/db';

async function bulkAddMembersToGroup(groupId: number, count: number): Promise<void> {
  const users = Array.from({ length: count }, (_, i) => ({
    email: `bulk_member_${i}_${Date.now()}@test.com`,
    passwordHash: 'fakehash',
    username: `bulk_member_${i}_${Date.now()}`,
  }));
  const inserted = await db('users').insert(users).returning('id');
  const userIds = inserted.map((r: { id: number } | number) =>
    typeof r === 'object' ? r.id : r,
  );
  await db('user_profiles').insert(
    userIds.map((user_id: number) => ({ user_id, name: 'Bulk Member', timezone: 'UTC' })),
  );
  await db('users_groups').insert(
    userIds.map((user_id: number) => ({ user_id, group_id: groupId })),
  );
}

async function createGroup(token: string, data = {}) {
  const res = await request(app)
    .post('/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Grupo Teste', description: 'Descrição', ...data });
  return res;
}

describe('POST /group', () => {
  it('cria um grupo e retorna id, name, code', async () => {
    const { token } = await registerAndLogin();
    const res = await createGroup(token);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Grupo Teste' });
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('code');
    expect(res.body.code).toHaveLength(6);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/group')
      .send({ name: 'Grupo Teste' });

    expect(res.status).toBe(401);
  });

  it('criador é adicionado automaticamente como membro', async () => {
    const { token } = await registerAndLogin();
    const groupRes = await createGroup(token);

    const userGroupsRes = await request(app)
      .get('/group/user')
      .set('Authorization', `Bearer ${token}`);

    expect(userGroupsRes.body.groups).toHaveLength(1);
    expect(userGroupsRes.body.groups[0].id).toBe(groupRes.body.id);
  });
});

describe('PUT /group/:id', () => {
  it('dono consegue atualizar nome e descrição', async () => {
    const { token } = await registerAndLogin();
    const { body: group } = await createGroup(token);

    const res = await request(app)
      .put(`/group/${group.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Atualizado', description: 'Nova desc' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nome Atualizado');
  });

  it('retorna 403 quando não é o dono', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const other = await registerAndLogin({ email: 'other@test.com' });

    const { body: group } = await createGroup(owner.token);

    // other entra no grupo
    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    const res = await request(app)
      .put(`/group/${group.id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ name: 'Tentativa' });

    expect(res.status).toBe(403);
  });

  it('retorna 404 quando grupo não existe ou usuário não é membro', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .put('/group/9999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Teste' });

    expect(res.status).toBe(404);
  });
});

describe('POST /group/join', () => {
  it('usuário entra em um grupo existente', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const other = await registerAndLogin({ email: 'other@test.com' });
    const { body: group } = await createGroup(owner.token);

    const res = await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Entrou no grupo');
  });

  it('retorna 400 quando o grupo atingiu o limite de membros do plano', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const { body: group } = await createGroup(owner.token);

    // Upgrade para starter (max 25 membros) para ativar o limite
    await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ plan_slug: 'starter' });

    // enche o grupo até o limite do Starter (owner já é membro = 1, adiciona mais 24 via bulk)
    await bulkAddMembersToGroup(group.id, 24);

    const { token: extraToken } = await registerAndLogin({ email: 'extra@test.com' });
    const res = await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${extraToken}`)
      .send({ groupId: group.id });

    expect(res.status).toBe(400);
    expect(res.body.key).toBe('MEMBER_LIMIT_REACHED');
  });

  it('retorna 400 ao entrar em um grupo que já é membro', async () => {
    const { token } = await registerAndLogin();
    const { body: group } = await createGroup(token);

    const res = await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: group.id });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/group/join')
      .send({ groupId: 1 });

    expect(res.status).toBe(401);
  });
});

describe('POST /group/leave', () => {
  it('usuário sai de um grupo que é membro', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const other = await registerAndLogin({ email: 'other@test.com' });
    const { body: group } = await createGroup(owner.token);

    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    const res = await request(app)
      .post('/group/leave')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Saiu do grupo');
  });

  it('retorna 400 ao sair de um grupo que não é membro', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const other = await registerAndLogin({ email: 'other@test.com' });
    const { body: group } = await createGroup(owner.token);

    const res = await request(app)
      .post('/group/leave')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    expect(res.status).toBe(400);
  });
});

describe('GET /group/user', () => {
  it('retorna lista vazia quando usuário não tem grupos', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/group/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.groups).toEqual([]);
  });

  it('retorna grupos do usuário', async () => {
    const { token } = await registerAndLogin({ email: 'user@test.com' });
    const other = await registerAndLogin({ email: 'other@test.com' });

    await createGroup(token, { name: 'Grupo A' });

    const { body: groupB } = await createGroup(other.token, { name: 'Grupo B' });
    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: groupB.id });

    const res = await request(app)
      .get('/group/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(2);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/group/user');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /group/:id/users/:userId', () => {
  it('dono remove um membro do grupo', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const member = await registerAndLogin({ email: 'member@test.com' });
    const { body: group } = await createGroup(owner.token);

    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ groupId: group.id });

    const usersRes = await request(app)
      .get(`/group/${group.id}/users`)
      .set('Authorization', `Bearer ${owner.token}`);
    const memberRecord = usersRes.body.users.find((u: any) => u.email === 'member@test.com');

    const res = await request(app)
      .delete(`/group/${group.id}/users/${memberRecord.id}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Usuário removido do grupo');
  });

  it('retorna 403 quando não é o dono', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const memberA = await registerAndLogin({ email: 'memberA@test.com' });
    const memberB = await registerAndLogin({ email: 'memberB@test.com' });
    const { body: group } = await createGroup(owner.token);

    await request(app).post('/group/join').set('Authorization', `Bearer ${memberA.token}`).send({ groupId: group.id });
    await request(app).post('/group/join').set('Authorization', `Bearer ${memberB.token}`).send({ groupId: group.id });

    const usersRes = await request(app).get(`/group/${group.id}/users`).set('Authorization', `Bearer ${owner.token}`);
    const memberBRecord = usersRes.body.users.find((u: any) => u.email === 'memberB@test.com');

    const res = await request(app)
      .delete(`/group/${group.id}/users/${memberBRecord.id}`)
      .set('Authorization', `Bearer ${memberA.token}`);

    expect(res.status).toBe(403);
  });

  it('retorna 400 quando dono tenta se remover', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const { body: group } = await createGroup(owner.token);

    const usersRes = await request(app).get(`/group/${group.id}/users`).set('Authorization', `Bearer ${owner.token}`);
    const ownerRecord = usersRes.body.users.find((u: any) => u.email === 'owner@test.com');

    const res = await request(app)
      .delete(`/group/${group.id}/users/${ownerRecord.id}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(400);
  });

  it('retorna 400 quando usuário não está no grupo', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const stranger = await registerAndLogin({ email: 'stranger@test.com' });
    const { body: group } = await createGroup(owner.token);

    const res = await request(app)
      .delete(`/group/${group.id}/users/9999`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /group/:id/users', () => {
  it('membro consegue ver os usuários do grupo', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const other = await registerAndLogin({ email: 'other@test.com' });
    const { body: group } = await createGroup(owner.token);

    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    const res = await request(app)
      .get(`/group/${group.id}/users`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users[0]).toHaveProperty('id');
    expect(res.body.users[0]).toHaveProperty('name');
    expect(res.body.users[0]).toHaveProperty('email');
    expect(res.body.users[0]).not.toHaveProperty('passwordHash');
  });

  it('retorna 403 para não-membro', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const stranger = await registerAndLogin({ email: 'stranger@test.com' });
    const { body: group } = await createGroup(owner.token);

    const res = await request(app)
      .get(`/group/${group.id}/users`)
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(res.status).toBe(403);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/group/1/users');
    expect(res.status).toBe(401);
  });
});

describe('POST /group/leave — dono não pode usar leave normal', () => {
  it('dono recebe 400 ao tentar sair pelo leave normal', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const { body: group } = await createGroup(owner.token);

    const res = await request(app)
      .post('/group/leave')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ groupId: group.id });

    expect(res.status).toBe(400);
  });
});

describe('POST /group/:id/leave — dono sai e transfere ownership', () => {
  it('dono sai e o mais antigo membro vira dono automaticamente', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const member = await registerAndLogin({ email: 'member@test.com' });
    const { body: group } = await createGroup(owner.token);

    await request(app).post('/group/join').set('Authorization', `Bearer ${member.token}`).send({ groupId: group.id });

    const res = await request(app)
      .post(`/group/${group.id}/leave`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({});

    expect(res.status).toBe(200);

    // owner não está mais no grupo
    const ownerGroups = await request(app).get('/group/user').set('Authorization', `Bearer ${owner.token}`);
    expect(ownerGroups.body.groups.find((g: any) => g.id === group.id)).toBeUndefined();

    // member agora é dono (aparece como owner_id)
    const memberGroups = await request(app).get('/group/user').set('Authorization', `Bearer ${member.token}`);
    const updatedGroup = memberGroups.body.groups.find((g: any) => g.id === group.id);
    expect(updatedGroup).toBeDefined();
    expect(updatedGroup.owner_id).toBe(member.id);
  });

  it('dono escolhe explicitamente o próximo dono', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const memberA = await registerAndLogin({ email: 'memberA@test.com' });
    const memberB = await registerAndLogin({ email: 'memberB@test.com' });
    const { body: group } = await createGroup(owner.token);

    await request(app).post('/group/join').set('Authorization', `Bearer ${memberA.token}`).send({ groupId: group.id });
    await request(app).post('/group/join').set('Authorization', `Bearer ${memberB.token}`).send({ groupId: group.id });

    const res = await request(app)
      .post(`/group/${group.id}/leave`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ nextOwnerId: memberB.id });

    expect(res.status).toBe(200);

    const memberBGroups = await request(app).get('/group/user').set('Authorization', `Bearer ${memberB.token}`);
    const updatedGroup = memberBGroups.body.groups.find((g: any) => g.id === group.id);
    expect(updatedGroup.owner_id).toBe(memberB.id);
  });

  it('grupo é deletado quando dono sai e é o único membro', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const { body: group } = await createGroup(owner.token);

    const res = await request(app)
      .post(`/group/${group.id}/leave`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({});

    expect(res.status).toBe(200);

    const ownerGroups = await request(app).get('/group/user').set('Authorization', `Bearer ${owner.token}`);
    expect(ownerGroups.body.groups.find((g: any) => g.id === group.id)).toBeUndefined();
  });

  it('retorna 400 quando nextOwnerId não está no grupo', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const stranger = await registerAndLogin({ email: 'stranger@test.com' });
    const { body: group } = await createGroup(owner.token);

    const res = await request(app)
      .post(`/group/${group.id}/leave`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ nextOwnerId: stranger.id });

    expect(res.status).toBe(400);
  });

  it('retorna 403 quando não é o dono', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const member = await registerAndLogin({ email: 'member@test.com' });
    const { body: group } = await createGroup(owner.token);

    await request(app).post('/group/join').set('Authorization', `Bearer ${member.token}`).send({ groupId: group.id });

    const res = await request(app)
      .post(`/group/${group.id}/leave`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({});

    expect(res.status).toBe(403);
  });
});

describe('GET /group/code/:code', () => {
  it('retorna preview do grupo pelo código', async () => {
    const { token } = await registerAndLogin();
    const { body: group } = await createGroup(token, { name: 'Grupo Público' });

    const res = await request(app).get(`/group/code/${group.code}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: group.id, name: 'Grupo Público' });
    expect(res.body).toHaveProperty('owner_name');
    expect(res.body).not.toHaveProperty('owner_email');
  });

  it('retorna 404 para código inexistente', async () => {
    const res = await request(app).get('/group/code/XXXXXX');

    expect(res.status).toBe(404);
    expect(res.body.key).toBe('GROUP_NOT_FOUND');
  });
});
