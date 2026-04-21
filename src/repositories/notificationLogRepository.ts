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

  const [data, countRows] = await Promise.all([
    knex('notification_logs')
      .where({ group_id })
      .orderBy('sent_at', 'desc')
      .select('*')
      .limit(limit)
      .offset(offset),
    knex('notification_logs').where({ group_id }).count<{ total: string }[]>('id as total'),
  ]);

  return { data: data as NotificationLog[], total: Number(countRows[0]?.total ?? 0) };
};

const getByNotificationId = async (notification_id: number, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const [data, countRows] = await Promise.all([
    knex('notification_logs')
      .where({ notification_id })
      .orderBy('sent_at', 'desc')
      .select('*')
      .limit(limit)
      .offset(offset),
    knex('notification_logs').where({ notification_id }).count<{ total: string }[]>('id as total'),
  ]);

  return { data: data as NotificationLog[], total: Number(countRows[0]?.total ?? 0) };
};

const getByUser = async (userId: number, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const query = knex('notification_logs as nl')
    .join('notifications as n', 'n.id', 'nl.notification_id')
    .join('groups as g', 'g.id', 'nl.group_id')
    .join('users_groups as ug', 'ug.group_id', 'nl.group_id')
    .where('nl.status', 'sent')
    .where('ug.user_id', userId)
    .orderBy('nl.sent_at', 'desc');

  const [data, countRows] = await Promise.all([
    query
      .clone()
      .select(
        'nl.id',
        'nl.notification_id',
        'nl.group_id',
        'nl.sent_at',
        'nl.status',
        'n.name as notification_name',
        'n.description as notification_description',
        'n.month',
        'n.day',
        'n.hour',
        'g.name as group_name'
      )
      .limit(limit)
      .offset(offset),
    query.clone().count<{ total: string }[]>('nl.id as total'),
  ]);

  return { data, total: Number(countRows[0]?.total ?? 0) };
};

export default { create, getPaginatedByGroup, getByNotificationId, getByUser };
