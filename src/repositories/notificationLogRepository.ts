import knex from '../config/db';
import { NotificationLog, NewNotificationLog } from '../types/notificationLog';

const create = async (data: NewNotificationLog): Promise<NotificationLog> => {
  const [log] = await knex('notification_logs')
    .insert({ ...data, sent_at: data.sent_at.toISOString() })
    .returning('*');
  return log;
};

const getPaginatedByGroup = async (group_id: number, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    knex('notification_logs')
      .where({ group_id })
      .orderBy('sent_at', 'desc')
      .select('*')
      .limit(limit)
      .offset(offset),
    knex('notification_logs').where({ group_id }).count('id as total'),
  ]);

  return { data: data as NotificationLog[], total: Number(total) };
};

export default { create, getPaginatedByGroup };
