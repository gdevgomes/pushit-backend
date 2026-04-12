import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

const baseUser = {
  name: 'Test User',
  email: 'user@test.com',
  password: 'password123',
  confirmPassword: 'password123',
};

describe('POST /auth/register', () => {
  it('cria usuário e retorna id, name, email sem passwordHash', async () => {
    const res = await request(app).post('/auth/register').send(baseUser);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: baseUser.name, email: baseUser.email });
    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('retorna 409 quando e-mail já cadastrado', async () => {
    await request(app).post('/auth/register').send(baseUser);
    const res = await request(app).post('/auth/register').send(baseUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('User already exists');
  });

  it('retorna 400 quando senhas não coincidem', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...baseUser, confirmPassword: 'outra_senha' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Passwords do not match');
  });

  it('retorna 400 quando password está ausente', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Test',
      email: 'test@example.com',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send(baseUser);
  });

  it('retorna token e perfil com credenciais corretas', async () => {
    const res = await request(app).post('/auth/login').send({
      email: baseUser.email,
      password: baseUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      email: baseUser.email,
      name: baseUser.name,
    });
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('timezone');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('retorna 404 para e-mail não cadastrado', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'ninguem@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(404);
  });

  it('retorna 401 para senha incorreta', async () => {
    const res = await request(app).post('/auth/login').send({
      email: baseUser.email,
      password: 'senha_errada',
    });

    expect(res.status).toBe(401);
  });
});

describe('POST /auth/google', () => {
  const googleUser = {
    provider_id: 'google-uid-123',
    email: 'google@test.com',
    name: 'Google User',
    timezone: 'America/Sao_Paulo',
  };

  it('cria usuário novo via Google e retorna token e perfil', async () => {
    const res = await request(app).post('/auth/google').send(googleUser);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email: googleUser.email, name: googleUser.name });
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('retorna o mesmo usuário ao logar com o mesmo provider_id', async () => {
    const first = await request(app).post('/auth/google').send(googleUser);
    const second = await request(app).post('/auth/google').send(googleUser);

    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('vincula provider a usuário já cadastrado com o mesmo e-mail', async () => {
    await request(app).post('/auth/register').send({
      ...baseUser,
      email: googleUser.email,
      confirmPassword: baseUser.password,
    });

    const res = await request(app).post('/auth/google').send(googleUser);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(googleUser.email);
  });

  it('usuários de providers diferentes com mesmo e-mail são vinculados à mesma conta', async () => {
    const first = await request(app).post('/auth/google').send(googleUser);
    const second = await request(app).post('/auth/google').send({
      ...googleUser,
      provider_id: 'google-uid-456',
    });

    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(first.body.user.id);
  });
});

describe('PATCH /auth/profile', () => {
  let token: string;

  beforeEach(async () => {
    await request(app).post('/auth/register').send(baseUser);
    const loginRes = await request(app).post('/auth/login').send({
      email: baseUser.email,
      password: baseUser.password,
    });
    token = loginRes.body.token;
  });

  it('atualiza o nome do usuário autenticado', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Novo Nome' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Novo Nome');
  });

  it('atualiza o timezone do usuário autenticado', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ timezone: 'America/Sao_Paulo' });

    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe('America/Sao_Paulo');
  });

  it('atualiza o email do usuário autenticado', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'novo@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('novo@test.com');
  });

  it('atualiza a senha com currentPassword correto', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'novaSenha123', confirmPassword: 'novaSenha123', currentPassword: baseUser.password });

    expect(res.status).toBe(200);
  });

  it('retorna 401 ao trocar senha com currentPassword incorreto', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'novaSenha123', confirmPassword: 'novaSenha123', currentPassword: 'senha_errada' });

    expect(res.status).toBe(401);
  });

  it('retorna 400 quando nenhum campo é enviado', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .send({ name: 'Novo Nome' });

    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', 'Bearer token_invalido')
      .send({ name: 'Novo Nome' });

    expect(res.status).toBe(401);
  });

  it('atualiza o push_token do usuário autenticado', async () => {
    const pushToken = 'fcm-token-abc123';
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ push_token: pushToken });

    expect(res.status).toBe(200);
    expect(res.body.push_token).toBe(pushToken);
  });

  it('retorna push_token nulo para usuário sem token cadastrado', async () => {
    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Qualquer' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('push_token');
  });
});
