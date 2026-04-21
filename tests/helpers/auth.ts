import request from 'supertest';
import { app } from '../../src/app';

let userCounter = 0;

interface UserData {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  timezone?: string;
}

export async function registerAndLogin(overrides: UserData = {}) {
  userCounter++;
  const suffix = `${userCounter}_${Date.now()}`;
  const userData = {
    name: 'Test User',
    username: `testuser_${suffix}`,
    email: `user_${suffix}@test.com`,
    password: 'password123',
    confirmPassword: 'password123',
    timezone: 'America/Sao_Paulo',
    ...overrides,
  };

  const registerRes = await request(app).post('/auth/register').send(userData);

  const loginRes = await request(app).post('/auth/login').send({
    username: userData.username,
    password: userData.password,
  });

  return {
    token: loginRes.body.token as string,
    email: userData.email,
    username: userData.username,
    id: registerRes.body.id as number,
  };
}
