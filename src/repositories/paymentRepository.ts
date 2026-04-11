import knex from '../config/db';
import { Payment, NewPayment, PaymentStatus } from '../types/payment';

const create = async (data: NewPayment): Promise<Payment> => {
  const [payment] = await knex('payments').insert(data).returning('*');
  return payment;
};

const findById = async (id: number): Promise<Payment | undefined> => {
  return knex('payments').where({ id }).first();
};

const findByExternalId = async (external_id: string): Promise<Payment | undefined> => {
  return knex('payments').where({ external_id }).first();
};

const getPaginatedByGroupId = async (group_id: number, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const [data, countRows] = await Promise.all([
    knex('payments')
      .where({ group_id })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset),
    knex('payments').where({ group_id }).count<{ total: string }[]>('id as total'),
  ]);

  return { data: data as Payment[], total: Number(countRows[0]?.total ?? 0) };
};

const findPendingByGroupId = async (group_id: number): Promise<Payment | undefined> => {
  return knex('payments')
    .where({ group_id, status: 'pending' })
    .where('expires_at', '>', knex.fn.now())
    .first();
};

const updateStatus = async (id: number, status: PaymentStatus, paid_at?: Date): Promise<void> => {
  await knex('payments')
    .where({ id })
    .update({ status, ...(paid_at ? { paid_at: paid_at.toISOString() } : {}) });
};

export default { create, findById, findByExternalId, getPaginatedByGroupId, findPendingByGroupId, updateStatus };
