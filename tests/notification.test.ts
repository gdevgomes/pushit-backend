import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin } from './helpers/auth';

const baseNotification = {
  name: 'Aniversário da empresa',
  description: 'Comemoramos mais um ano!',
  month: 8,
  day: 15,
};

async function setupGroupWithMember() {
  const owner = await registerAndLogin({ email: 'owner@test.com' });
  const member = await registerAndLogin({ email: 'member@test.com' });

  const groupRes = await request(app)
    .post('/group')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Grupo Teste' });

  const group = groupRes.body;

  await request(app)
    .post('/group/join')
    .set('Authorization', `Bearer ${member.token}`)
    .send({ groupId: group.id });

  return { owner, member, group };
}

function postNotification(token: string, groupId: number, data = {}) {
  return request(app)
    .post(`/group/${groupId}/notifications`)
    .set('Authorization', `Bearer ${token}`)
    .send({ ...baseNotification, ...data });
}

describe('POST /group/:id/notifications', () => {
  it('membro cria sua única notificação e recebe scheduled_at às 6h no timezone do usuário', async () => {
    const { member, group } = await setupGroupWithMember();

    const res = await postNotification(member.token, group.id);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: baseNotification.name, month: 8, day: 15 });
    expect(res.body).toHaveProperty('scheduled_at');
    expect(res.body).toHaveProperty('timezone', 'America/Sao_Paulo');

    // 6h em America/Sao_Paulo (UTC-3) = 9h UTC
    const scheduledAt = new Date(res.body.scheduled_at);
    expect(scheduledAt.getUTCHours()).toBe(9);
  });

  it('membro não pode criar mais de 1 notificação', async () => {
    const { member, group } = await setupGroupWithMember();

    await postNotification(member.token, group.id);
    const res = await postNotification(member.token, group.id);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/limite/i);
  });

  it('dono pode criar até 10 notificações', async () => {
    const { owner, group } = await setupGroupWithMember();

    for (let i = 1; i <= 10; i++) {
      const res = await postNotification(owner.token, group.id, { name: `Notif ${i}` });
      expect(res.status).toBe(201);
    }
  });

  it('dono não pode criar mais de 10 notificações', async () => {
    const { owner, group } = await setupGroupWithMember();

    for (let i = 1; i <= 10; i++) {
      await postNotification(owner.token, group.id, { name: `Notif ${i}` });
    }

    const res = await postNotification(owner.token, group.id, { name: 'Notif 11' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/limite/i);
  });

  it('retorna 403 para não-membro', async () => {
    const { group } = await setupGroupWithMember();
    const stranger = await registerAndLogin({ email: 'stranger@test.com' });

    const res = await postNotification(stranger.token, group.id);
    expect(res.status).toBe(403);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/group/1/notifications')
      .send(baseNotification);
    expect(res.status).toBe(401);
  });
});

describe('GET /group/:id/notifications', () => {
  it('membro lista as notificações do grupo', async () => {
    const { owner, member, group } = await setupGroupWithMember();

    await postNotification(owner.token, group.id, { name: 'Notif A' });
    await postNotification(member.token, group.id, { name: 'Notif B' });

    const res = await request(app)
      .get(`/group/${group.id}/notifications`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
  });

  it('retorna 403 para não-membro', async () => {
    const { group } = await setupGroupWithMember();
    const stranger = await registerAndLogin({ email: 'stranger@test.com' });

    const res = await request(app)
      .get(`/group/${group.id}/notifications`)
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(res.status).toBe(403);
  });
});
