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
    expect(res.body.message).toBe('User Exists');
  });

  it('retorna 400 quando senhas não coincidem', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...baseUser, confirmPassword: 'outra_senha' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password don't match");
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

  it('retorna token com credenciais corretas', async () => {
    const res = await request(app).post('/auth/login').send({
      email: baseUser.email,
      password: baseUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
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

describe('PATCH /auth/edit-name', () => {
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
      .patch('/auth/edit-name')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Novo Nome' });

    expect(res.status).toBe(200);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .patch('/auth/edit-name')
      .send({ name: 'Novo Nome' });

    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await request(app)
      .patch('/auth/edit-name')
      .set('Authorization', 'Bearer token_invalido')
      .send({ name: 'Novo Nome' });

    expect(res.status).toBe(401);
  });

  it('retorna 400 quando name está vazio', async () => {
    const res = await request(app)
      .patch('/auth/edit-name')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });
});
