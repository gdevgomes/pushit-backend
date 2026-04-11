import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin } from './helpers/auth';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../src/utils/abacatePayClient', () => ({
  createPixQrCode: vi.fn().mockResolvedValue({
    id: 'pix_test_123',
    status: 'PENDING',
    brCode: '00020101021226830014br.gov.bcb.pix0136test',
    brCodeBase64: 'data:image/png;base64,iVBORw0KGgo=',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  }),
  checkPixStatus: vi.fn(),
}));

async function setupOwnerAndGroup() {
  const owner = await registerAndLogin({ email: 'owner@test.com' });
  const res = await request(app)
    .post('/group')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Grupo Teste' });
  return { owner, group: res.body };
}

describe('POST /payment/group/:groupId/pix', () => {
  it('dono gera QR code PIX e recebe pixBrCode e pixQrCodeBase64', async () => {
    const { owner, group } = await setupOwnerAndGroup();

    const res = await request(app)
      .post(`/payment/group/${group.id}/pix`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('pixBrCode');
    expect(res.body).toHaveProperty('pixQrCodeBase64');
    expect(res.body).toHaveProperty('expiresAt');
    expect(res.body).toHaveProperty('amount', 30);
    expect(res.body.status).toBe('pending');
  });

  it('retorna o mesmo pagamento pendente ao chamar novamente antes de expirar', async () => {
    const { owner, group } = await setupOwnerAndGroup();

    const first = await request(app)
      .post(`/payment/group/${group.id}/pix`)
      .set('Authorization', `Bearer ${owner.token}`);

    const second = await request(app)
      .post(`/payment/group/${group.id}/pix`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
  });

  it('retorna 403 para não-dono', async () => {
    const { group } = await setupOwnerAndGroup();
    const other = await registerAndLogin({ email: 'other@test.com' });

    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    const res = await request(app)
      .post(`/payment/group/${group.id}/pix`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(403);
  });

  it('retorna 404 para grupo que o usuário não é membro', async () => {
    const { owner } = await setupOwnerAndGroup();

    const res = await request(app)
      .post('/payment/group/9999/pix')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).post('/payment/group/1/pix');
    expect(res.status).toBe(401);
  });
});

describe('GET /payment/group/:groupId', () => {
  it('dono lista pagamentos do grupo', async () => {
    const { owner, group } = await setupOwnerAndGroup();

    await request(app)
      .post(`/payment/group/${group.id}/pix`)
      .set('Authorization', `Bearer ${owner.token}`);

    const res = await request(app)
      .get(`/payment/group/${group.id}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.payments).toHaveLength(1);
    expect(res.body.payments[0].status).toBe('pending');
  });

  it('retorna lista vazia quando não há pagamentos', async () => {
    const { owner, group } = await setupOwnerAndGroup();

    const res = await request(app)
      .get(`/payment/group/${group.id}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.payments).toHaveLength(0);
  });

  it('retorna 403 para não-dono', async () => {
    const { group } = await setupOwnerAndGroup();
    const other = await registerAndLogin({ email: 'other@test.com' });

    await request(app)
      .post('/group/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ groupId: group.id });

    const res = await request(app)
      .get(`/payment/group/${group.id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(403);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/payment/group/1');
    expect(res.status).toBe(401);
  });
});
