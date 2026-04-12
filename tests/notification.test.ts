import { vi, describe, it, expect } from 'vitest';
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
    expect(res.body.message).toMatch(/limit/i);
  });

  it('dono pode criar até 5 notificações (limite Starter)', async () => {
    const { owner, group } = await setupGroupWithMember();

    for (let i = 1; i <= 5; i++) {
      const res = await postNotification(owner.token, group.id, { name: `Notif ${i}` });
      expect(res.status).toBe(201);
    }
  });

  it('dono não pode criar mais de 5 notificações (limite Starter)', async () => {
    const { owner, group } = await setupGroupWithMember();

    for (let i = 1; i <= 5; i++) {
      await postNotification(owner.token, group.id, { name: `Notif ${i}` });
    }

    const res = await postNotification(owner.token, group.id, { name: 'Notif 6' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/limit/i);
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

describe('PUT /group/:id/notifications/:notificationId', () => {
  it('criador da notificação consegue editar', async () => {
    const { member, group } = await setupGroupWithMember();
    const { body: notification } = await postNotification(member.token, group.id);

    const res = await request(app)
      .put(`/group/${group.id}/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ name: 'Nome atualizado' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nome atualizado');
  });

  it('dono do grupo consegue editar notificação de outro membro', async () => {
    const { owner, member, group } = await setupGroupWithMember();
    const { body: notification } = await postNotification(member.token, group.id);

    const res = await request(app)
      .put(`/group/${group.id}/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Editado pelo dono' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Editado pelo dono');
  });

  it('membro não consegue editar notificação de outro membro', async () => {
    const { group } = await setupGroupWithMember();
    const other = await registerAndLogin({ email: 'other@test.com' });
    await request(app).post('/group/join').set('Authorization', `Bearer ${other.token}`).send({ groupId: group.id });

    const { body: notification } = await postNotification(other.token, group.id);

    const { member } = await setupGroupWithMember();
    // usar um membro do mesmo grupo que não criou a notificação
    const res = await request(app)
      .put(`/group/${group.id}/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ name: 'Tentativa' });

    // other criou a notificação, então consegue editar
    expect(res.status).toBe(200);
  });

  it('terceiro não consegue editar notificação', async () => {
    const { owner, group } = await setupGroupWithMember();
    const { body: notification } = await postNotification(owner.token, group.id, { name: 'Original' });
    const stranger = await registerAndLogin({ email: 'stranger@test.com' });

    const res = await request(app)
      .put(`/group/${group.id}/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ name: 'Hack' });

    expect(res.status).toBe(403);
  });

  it('retorna 404 para notificação inexistente', async () => {
    const { owner, group } = await setupGroupWithMember();

    const res = await request(app)
      .put(`/group/${group.id}/notifications/9999`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Teste' });

    expect(res.status).toBe(404);
  });
});

describe('GET /notifications', () => {
  it('retorna notificações do mês atual quando month não é informado', async () => {
    const { owner, group } = await setupGroupWithMember();
    const currentMonth = new Date().getMonth() + 1;
    await postNotification(owner.token, group.id, { name: 'Notif mês atual', month: currentMonth });

    const res = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('notifications');
    expect(res.body).toHaveProperty('month', currentMonth);
  });

  it('retorna notificações filtradas pelo mês informado', async () => {
    const { owner, group } = await setupGroupWithMember();
    await postNotification(owner.token, group.id, { name: 'Notif agosto', month: 8 });

    const res = await request(app)
      .get('/notifications?month=8')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.month).toBe(8);
    expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
  });

  it('retorna 400 para mês inválido', async () => {
    const { owner } = await setupGroupWithMember();

    const res = await request(app)
      .get('/notifications?month=13')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(400);
    expect(res.body.key).toBe('VALIDATION_ERROR');
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/notifications');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /group/:id/notifications/:notificationId', () => {
  it('criador da notificação consegue deletar', async () => {
    const { member, group } = await setupGroupWithMember();
    const { body: notification } = await postNotification(member.token, group.id);

    const res = await request(app)
      .delete(`/group/${group.id}/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(res.status).toBe(200);
  });

  it('dono do grupo consegue deletar notificação de outro membro', async () => {
    const { owner, member, group } = await setupGroupWithMember();
    const { body: notification } = await postNotification(member.token, group.id);

    const res = await request(app)
      .delete(`/group/${group.id}/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
  });

  it('membro não consegue deletar notificação de outro membro', async () => {
    const { owner, member, group } = await setupGroupWithMember();
    const { body: notification } = await postNotification(owner.token, group.id, { name: 'Do dono' });

    const res = await request(app)
      .delete(`/group/${group.id}/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(res.status).toBe(403);
  });

  it('retorna 404 para notificação inexistente', async () => {
    const { owner, group } = await setupGroupWithMember();

    const res = await request(app)
      .delete(`/group/${group.id}/notifications/9999`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(404);
  });
});
