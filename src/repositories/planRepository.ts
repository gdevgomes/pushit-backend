import knex from '../config/db';
import { GroupPlan } from '../types/plan';

const getAll = async (): Promise<GroupPlan[]> => knex('group_plans').select('*');

const getById = async (id: number): Promise<GroupPlan | undefined> =>
  knex('group_plans').where({ id }).first();

const getBySlug = async (slug: string): Promise<GroupPlan | undefined> =>
  knex('group_plans').where({ slug }).first();

export default { getAll, getById, getBySlug };
