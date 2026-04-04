import { Request, Response, NextFunction } from 'express';
import planRepository from '../repositories/planRepository';

export const listPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plans = await planRepository.getAll();
    res.json(plans);
  } catch (err) {
    next(err);
  }
};
