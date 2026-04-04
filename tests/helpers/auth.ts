import request from 'supertest';
import { app } from '../../src/app';

interface UserData {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  timezone?: string;
}

export async function registerAndLogin(overrides: UserData = {}) {
  const userData = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'password123',
    confirmPassword: 'password123',
    timezone: 'America/Sao_Paulo',
    ...overrides,
  };

  const registerRes = await request(app).post('/auth/register').send(userData);

  const loginRes = await request(app).post('/auth/login').send({
    email: userData.email,
    password: userData.password,
  });

  return {
    token: loginRes.body.token as string,
    email: userData.email,
    id: registerRes.body.id as number,
  };
}
