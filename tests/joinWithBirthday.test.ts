import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin } from './helpers/auth';

async function createGroup(token: string) {
  const res = await request(app)
    .post('/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Grupo Aniversário', description: 'Desc' });
  return res.body as { id: number; code: string };
}

const validBirthday = {
  name: 'Meu Aniversário',
  month: 8,
  day: 15,
};

describe('POST /group/join-with-birthday', () => {
  it('entra no grupo e cria notificação de aniversário', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post('/group/join-with-birthday')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ groupId: group.id, ...validBirthday });

    expect(res.status).toBe(201);
    expect(res.body.notification).toMatchObject({
      name: 'Meu Aniversário',
      month: 8,
      day: 15,
      group_id: group.id,
    });
  });

  it('aceita hour opcional', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post('/group/join-with-birthday')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ groupId: group.id, ...validBirthday, hour: 9 });

    expect(res.status).toBe(201);
    expect(res.body.notification.hour).toBe(9);
  });

  it('retorna 400 se já é membro do grupo', async () => {
    const owner = await registerAndLogin();
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post('/group/join-with-birthday')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ groupId: group.id, ...validBirthday });

    expect(res.status).toBe(400);
    expect(res.body.key).toBe('ALREADY_IN_GROUP');
  });

  it('retorna 404 para grupo inexistente', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/group/join-with-birthday')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: 999999, ...validBirthday });

    expect(res.status).toBe(404);
    expect(res.body.key).toBe('GROUP_NOT_FOUND');
  });

  it('retorna 400 para body inválido (sem month)', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post('/group/join-with-birthday')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ groupId: group.id, name: 'Aniversário' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 para month fora do range', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const group = await createGroup(owner.token);

    const res = await request(app)
      .post('/group/join-with-birthday')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ groupId: group.id, name: 'Aniversário', month: 13, day: 1 });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/group/join-with-birthday')
      .send({ groupId: 1, ...validBirthday });

    expect(res.status).toBe(401);
  });
});
