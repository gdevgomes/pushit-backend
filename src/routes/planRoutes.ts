import { Router } from 'express';
import * as planController from '../controllers/planController';

const planRouter = Router();

planRouter.get('/', planController.listPlans);

export { planRouter };
