import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import db from '../src/config/db';
import { registerAndLogin } from './helpers/auth';

async function setupGroupWithNotification() {
  const owner = await registerAndLogin({ email: 'log-owner@test.com' });
  const member = await registerAndLogin({ email: 'log-member@test.com' });

  const groupRes = await request(app)
    .post('/group')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Grupo Log' });
  const group = groupRes.body;

  await request(app)
    .post('/group/join')
    .set('Authorization', `Bearer ${member.token}`)
    .send({ groupId: group.id });

  const notifRes = await request(app)
    .post(`/group/${group.id}/notifications`)
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Aniversário', month: 5, day: 10 });
  const notification = notifRes.body;

  return { owner, member, group, notification };
}

async function insertLog(notificationId: number, groupId: number, status = 'sent') {
  const [log] = await db('notification_logs')
    .insert({
      notification_id: notificationId,
      group_id: groupId,
      sent_at: new Date().toISOString(),
      status,
    })
    .returning('*');
  return log;
}

describe('GET /notification-logs', () => {
  it('retorna logs do usuário que é membro do grupo', async () => {
    const { owner, group, notification } = await setupGroupWithNotification();
    await insertLog(notification.id, group.id);

    const res = await request(app)
      .get('/notification-logs')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(res.body.logs.length).toBeGreaterThanOrEqual(1);
    expect(res.body.logs[0]).toMatchObject({
      notification_id: notification.id,
      group_id: group.id,
      status: 'sent',
    });
  });

  it('não retorna logs de grupos que o usuário não é membro', async () => {
    const { group, notification } = await setupGroupWithNotification();
    await insertLog(notification.id, group.id);

    const stranger = await registerAndLogin({ email: 'log-stranger@test.com' });

    const res = await request(app)
      .get('/notification-logs')
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(0);
  });

  it('não retorna logs com status diferente de sent', async () => {
    const { owner, group, notification } = await setupGroupWithNotification();
    await insertLog(notification.id, group.id, 'failed');

    const res = await request(app)
      .get('/notification-logs')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.every((l: any) => l.status === 'sent')).toBe(true);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/notification-logs');
    expect(res.status).toBe(401);
  });
});
