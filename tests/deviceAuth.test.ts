import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin } from './helpers/auth';

const deviceId = '550e8400-e29b-41d4-a716-446655440000';
const deviceId2 = '550e8400-e29b-41d4-a716-446655440001';

// ─── POST /auth/device ────────────────────────────────────────────────────────

describe('POST /auth/device', () => {
  it('cria conta device e retorna token e user com account_type device', async () => {
    const res = await request(app).post('/auth/device').send({ device_id: deviceId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ account_type: 'device' });
    expect(res.body.user.email).toBeNull();
    expect(res.body.user).toHaveProperty('id');
  });

  it('retorna o mesmo user.id para o mesmo device_id', async () => {
    const first = await request(app).post('/auth/device').send({ device_id: deviceId });
    const second = await request(app).post('/auth/device').send({ device_id: deviceId });

    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('retorna 400 sem device_id', async () => {
    const res = await request(app).post('/auth/device').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 400 para device_id que não é UUID', async () => {
    const res = await request(app).post('/auth/device').send({ device_id: 'nao-e-uuid' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /auth/elevate/local ─────────────────────────────────────────────────

describe('POST /auth/elevate/local', () => {
  let deviceToken: string;

  beforeEach(async () => {
    const res = await request(app).post('/auth/device').send({ device_id: deviceId });
    deviceToken = res.body.token;
  });

  it('eleva conta device para local e retorna token com account_type local', async () => {
    const res = await request(app)
      .post('/auth/elevate/local')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        name: 'Device User',
        username: 'deviceuser',
        email: 'device@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        timezone: 'America/Sao_Paulo',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ account_type: 'local', email: 'device@test.com' });
    expect(res.body.user.username).toBe('deviceuser');
  });

  it('cria grupo default automaticamente ao elevar', async () => {
    const res = await request(app)
      .post('/auth/elevate/local')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        name: 'Device User',
        username: 'deviceuser2',
        email: 'device2@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(200);
    const newToken = res.body.token;

    const groupsRes = await request(app)
      .get('/group/user')
      .set('Authorization', `Bearer ${newToken}`);

    expect(groupsRes.status).toBe(200);
    expect(groupsRes.body.groups.length).toBeGreaterThanOrEqual(1);
  });

  it('retorna 409 se conta já é local', async () => {
    await request(app)
      .post('/auth/elevate/local')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        name: 'Device User',
        username: 'deviceuser3',
        email: 'device3@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    const res = await request(app)
      .post('/auth/elevate/local')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        name: 'Device User',
        username: 'deviceuser3b',
        email: 'device3b@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.key).toBe('ACCOUNT_ALREADY_ELEVATED');
  });

  it('retorna 409 se email já existe em outra conta', async () => {
    const { } = await registerAndLogin({ email: 'taken@test.com', username: 'takenuser' });

    const res = await request(app)
      .post('/auth/elevate/local')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        name: 'Device User',
        username: 'deviceuser4',
        email: 'taken@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(409);
  });

  it('retorna 400 se password !== confirmPassword', async () => {
    const res = await request(app)
      .post('/auth/elevate/local')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        name: 'Device User',
        username: 'deviceuser5',
        email: 'device5@test.com',
        password: 'password123',
        confirmPassword: 'outra_senha',
      });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/auth/elevate/local')
      .send({
        name: 'Device User',
        username: 'deviceuser6',
        email: 'device6@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(401);
  });
});

// ─── POST /auth/elevate/provider ─────────────────────────────────────────────

describe('POST /auth/elevate/provider', () => {
  let deviceToken: string;

  beforeEach(async () => {
    const res = await request(app).post('/auth/device').send({ device_id: deviceId2 });
    deviceToken = res.body.token;
  });

  it('eleva conta device para provider e retorna token com account_type provider', async () => {
    const res = await request(app)
      .post('/auth/elevate/provider')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        provider_id: 'google-uid-device-1',
        provider: 'google',
        email: 'devicegoogle@test.com',
        name: 'Device Google User',
        timezone: 'America/Sao_Paulo',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ account_type: 'provider', email: 'devicegoogle@test.com' });
  });

  it('cria grupo default ao elevar para provider', async () => {
    const res = await request(app)
      .post('/auth/elevate/provider')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        provider_id: 'google-uid-device-2',
        provider: 'google',
        email: 'devicegoogle2@test.com',
        name: 'Device Google User',
      });

    expect(res.status).toBe(200);
    const newToken = res.body.token;

    const groupsRes = await request(app)
      .get('/group/user')
      .set('Authorization', `Bearer ${newToken}`);

    expect(groupsRes.status).toBe(200);
    expect(groupsRes.body.groups.length).toBeGreaterThanOrEqual(1);
  });

  it('retorna 409 se conta já elevada', async () => {
    await request(app)
      .post('/auth/elevate/provider')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        provider_id: 'google-uid-device-3',
        provider: 'google',
        email: 'devicegoogle3@test.com',
        name: 'Device Google User',
      });

    const res = await request(app)
      .post('/auth/elevate/provider')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        provider_id: 'google-uid-device-3b',
        provider: 'google',
        email: 'devicegoogle3b@test.com',
        name: 'Device Google User',
      });

    expect(res.status).toBe(409);
    expect(res.body.key).toBe('ACCOUNT_ALREADY_ELEVATED');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/auth/elevate/provider')
      .send({
        provider_id: 'google-uid-device-4',
        provider: 'google',
        email: 'devicegoogle4@test.com',
        name: 'Device Google User',
      });

    expect(res.status).toBe(401);
  });
});

// ─── POST /auth/provider ─────────────────────────────────────────────────────

describe('POST /auth/provider', () => {
  it('adiciona segundo provider a conta local existente', async () => {
    const { token } = await registerAndLogin({ username: 'multiprovider', email: 'multi@test.com' });

    const res = await request(app)
      .post('/auth/provider')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider_id: 'google-uid-multi-1',
        provider: 'google',
        email: 'multi@test.com',
        name: 'Multi Provider User',
      });

    expect(res.status).toBe(200);
  });

  it('retorna 409 se provider_id já pertence a outro user', async () => {
    const { token: token1 } = await registerAndLogin({ username: 'user_a', email: 'usera@test.com' });
    const { token: token2 } = await registerAndLogin({ username: 'user_b', email: 'userb@test.com' });

    await request(app)
      .post('/auth/provider')
      .set('Authorization', `Bearer ${token1}`)
      .send({ provider_id: 'shared-provider-id', provider: 'google', email: 'usera@test.com', name: 'User A' });

    const res = await request(app)
      .post('/auth/provider')
      .set('Authorization', `Bearer ${token2}`)
      .send({ provider_id: 'shared-provider-id', provider: 'google', email: 'userb@test.com', name: 'User B' });

    expect(res.status).toBe(409);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/auth/provider')
      .send({ provider_id: 'google-uid-x', provider: 'google', email: 'x@test.com', name: 'X' });

    expect(res.status).toBe(401);
  });
});

// ─── Restrição de conta device em rotas protegidas ───────────────────────────

describe('Restrição ELEVATED_ACCOUNT_REQUIRED', () => {
  let deviceToken: string;

  beforeEach(async () => {
    const res = await request(app).post('/auth/device').send({ device_id: '550e8400-e29b-41d4-a716-446655440002' });
    deviceToken = res.body.token;
  });

  it('device recebe 403 ao tentar criar grupo', async () => {
    const res = await request(app)
      .post('/group')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ name: 'Meu Grupo' });

    expect(res.status).toBe(403);
    expect(res.body.key).toBe('ELEVATED_ACCOUNT_REQUIRED');
  });

  it('usuário local consegue criar grupo', async () => {
    const { token } = await registerAndLogin({ username: 'groupcreator', email: 'groupcreator@test.com' });

    const res = await request(app)
      .post('/group')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meu Grupo' });

    expect(res.status).toBe(201);
  });
});
