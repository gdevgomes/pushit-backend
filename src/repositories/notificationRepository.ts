import knex from '../config/db';
import { NewNotification } from '../types/notification';

const create = async (data: NewNotification) => {
  const [notification] = await knex('notifications')
    .insert(data)
    .returning(['id', 'name', 'description', 'month', 'day', 'timezone', 'scheduled_at', 'group_id', 'created_by']);
  return notification;
};

const countByUserInGroup = async (groupId: number, userId: number): Promise<number> => {
  const [{ total }] = await knex('notifications')
    .where({ group_id: groupId, created_by: userId })
    .count('id as total');
  return Number(total);
};

const getById = async (id: number) => {
  return await knex('notifications').where({ id }).first();
};

const update = async (id: number, data: Partial<Pick<NewNotification, 'name' | 'description' | 'month' | 'day' | 'scheduled_at'>>) => {
  const [updated] = await knex('notifications')
    .where({ id })
    .update(data)
    .returning(['id', 'name', 'description', 'month', 'day', 'timezone', 'scheduled_at', 'group_id', 'created_by']);
  return updated;
};

const remove = async (id: number) => {
  await knex('notifications').where({ id }).del();
};

const getPaginated = async (groupId: number, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    knex('notifications')
      .where({ group_id: groupId })
      .orderBy('scheduled_at', 'asc')
      .select('*')
      .limit(limit)
      .offset(offset),
    knex('notifications').where({ group_id: groupId }).count('id as total'),
  ]);

  return { data, total: Number(total) };
};

const getByMonth = async (groupId: number, month: number) => {
  return await knex('notifications')
    .where({ group_id: groupId, month })
    .orderBy('day', 'asc')
    .select('*');
};

export default { create, getById, update, remove, countByUserInGroup, getPaginated, getByMonth };
