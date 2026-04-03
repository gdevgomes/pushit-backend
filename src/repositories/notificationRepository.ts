import knex from '../config/db';
import { NewNotification } from '../types/notification';

const create = async (data: NewNotification) => {
  const [notification] = await knex('notifications')
    .insert(data)
    .returning(['id', 'name', 'description', 'month', 'day', 'timezone', 'scheduled_at', 'group_id', 'created_by']);
  return notification;
};

const countByUserInGroup = async (groupId: number, userId: number): Promise<number> => {
  const result = await knex('notifications')
    .where({ group_id: groupId, created_by: userId })
    .count('id as count')
    .first();
  return Number(result?.count ?? 0);
};

const getByGroup = async (groupId: number) => {
  return await knex('notifications')
    .where({ group_id: groupId })
    .orderBy('scheduled_at', 'asc')
    .select('*');
};

export default { create, countByUserInGroup, getByGroup };
