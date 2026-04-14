import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin } from './helpers/auth';

async function createGroupAndGetToken() {
  const owner = await registerAndLogin({ email: 'owner@test.com' });
  const res = await request(app)
    .post('/group')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Grupo Teste' });
  return { owner, group: res.body };
}

describe('Subscription — criação automática ao criar grupo', () => {
  it('cria subscription com status trial e trial_ends_at 3 meses à frente', async () => {
    const { owner, group } = await createGroupAndGetToken();

    const res = await request(app)
      .get(`/group/${group.id}/subscription`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('trial');
    expect(res.body.monthly_amount).toBe(30);
    expect(res.body.group_id).toBe(group.id);

    const trialEndsAt = new Date(res.body.trial_ends_at);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    // trial_ends_at deve estar próximo de 3 meses a partir de agora (tolerância de 5s)
    expect(Math.abs(trialEndsAt.getTime() - threeMonthsFromNow.getTime())).toBeLessThan(5000);
  });
});

describe('POST /group — restrição de trial', () => {
  it('retorna 400 ao tentar criar segundo grupo enquanto tem um em trial', async () => {
    const { owner } = await createGroupAndGetToken();

    const res = await request(app)
      .post('/group')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Segundo Grupo' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/trial/i);
  });
});

describe('POST /group — plan_slug', () => {
  it('cria com enterprise: status active, monthly_amount null, sem restrição de trial', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });

    const res = await request(app)
      .post('/group')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Grupo Enterprise', plan_slug: 'enterprise' });

    expect(res.status).toBe(201);

    const sub = await request(app)
      .get(`/group/${res.body.id}/subscription`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(sub.body.status).toBe('active');
    expect(sub.body.monthly_amount).toBe(0);
  });

  it('enterprise permite criar múltiplos grupos', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });

    const first = await request(app)
      .post('/group')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Grupo 1', plan_slug: 'enterprise' });

    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/group')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Grupo 2', plan_slug: 'enterprise' });

    expect(second.status).toBe(201);
  });

  it('retorna 400 para plan_slug inválido', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });

    const res = await request(app)
      .post('/group')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Grupo X', plan_slug: 'invalido' });

    expect(res.status).toBe(400);
  });
});

describe('GET /group/:id/subscription', () => {
  it('retorna 403 para não-dono', async () => {
    const { group } = await createGroupAndGetToken();
    const other = await registerAndLogin({ email: 'other@test.com' });

    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    const res = await request(app)
      .get(`/group/${group.id}/subscription`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(403);
  });

  it('retorna 404 para grupo que o usuário não é membro', async () => {
    const { group } = await createGroupAndGetToken();
    const stranger = await registerAndLogin({ email: 'stranger@test.com' });

    const res = await request(app)
      .get(`/group/${group.id}/subscription`)
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/group/1/subscription');
    expect(res.status).toBe(401);
  });
});
