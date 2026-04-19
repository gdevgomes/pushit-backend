import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin } from './helpers/auth';

async function createGroup(token: string, name = 'Grupo Teste') {
  const res = await request(app)
    .post('/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name });
  return res.body as { id: number };
}

describe('Subscription — criação automática ao criar grupo', () => {
  it('cria subscription com status active e plano sand-box', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const group = await createGroup(owner.token);

    const res = await request(app)
      .get(`/group/${group.id}/subscription`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
    expect(Number(res.body.monthly_amount)).toBe(0);
    expect(res.body.group_id).toBe(group.id);
  });

  it('permite criar múltiplos grupos sem restrição', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });

    const first = await createGroup(owner.token, 'Grupo 1');
    const second = await createGroup(owner.token, 'Grupo 2');

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });
});

describe('POST /group — plan_slug enterprise', () => {
  it('cria com enterprise: status active, monthly_amount 0', async () => {
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
    expect(Number(sub.body.monthly_amount)).toBe(0);
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

describe('POST /group/:id/upgrade', () => {
  it('dono faz upgrade para starter: status overdue, monthly_amount 30', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ plan_slug: 'starter' });

    expect(res.status).toBe(200);

    const sub = await request(app)
      .get(`/group/${group.id}/subscription`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(sub.body.status).toBe('overdue');
    expect(Number(sub.body.monthly_amount)).toBe(30);
  });

  it('dono faz upgrade para pro: status overdue, monthly_amount 50', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ plan_slug: 'pro' });

    expect(res.status).toBe(200);

    const sub = await request(app)
      .get(`/group/${group.id}/subscription`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(sub.body.status).toBe('overdue');
    expect(Number(sub.body.monthly_amount)).toBe(50);
  });

  it('dono faz upgrade para business: status overdue, monthly_amount 100', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ plan_slug: 'business' });

    expect(res.status).toBe(200);

    const sub = await request(app)
      .get(`/group/${group.id}/subscription`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(sub.body.status).toBe('overdue');
    expect(Number(sub.body.monthly_amount)).toBe(100);
  });

  it('trial_ends_at é definido para agora ao fazer upgrade', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const group = await createGroup(owner.token);

    const before = Date.now();

    await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ plan_slug: 'starter' });

    const sub = await request(app)
      .get(`/group/${group.id}/subscription`)
      .set('Authorization', `Bearer ${owner.token}`);

    const trialEndsAt = new Date(sub.body.trial_ends_at).getTime();
    expect(trialEndsAt).toBeGreaterThanOrEqual(before);
    expect(trialEndsAt).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('retorna 400 ao tentar fazer upgrade para sand-box', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ plan_slug: 'sand-box' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 ao tentar fazer upgrade para enterprise', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ plan_slug: 'enterprise' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 para plan_slug inexistente', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ plan_slug: 'inexistente' });

    expect(res.status).toBe(400);
  });

  it('retorna 403 quando não é o dono', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const member = await registerAndLogin({ email: 'member@test.com' });
    const group = await createGroup(owner.token);

    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ groupId: group.id });

    const res = await request(app)
      .post(`/group/${group.id}/upgrade`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ plan_slug: 'starter' });

    expect(res.status).toBe(403);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/group/1/upgrade')
      .send({ plan_slug: 'starter' });

    expect(res.status).toBe(401);
  });
});

describe('GET /group/:id/subscription', () => {
  it('retorna 403 para não-dono', async () => {
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const other = await registerAndLogin({ email: 'other@test.com' });
    const group = await createGroup(owner.token);

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
    const owner = await registerAndLogin({ email: 'owner@test.com' });
    const stranger = await registerAndLogin({ email: 'stranger@test.com' });
    const group = await createGroup(owner.token);

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
