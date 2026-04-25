import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import authMiddleware from '../middlewares/authMiddleware';
import requireElevatedAccount from '../middlewares/requireElevatedAccount';
import { validate } from '../middlewares/validate';
import { PaginationSchema } from '../schemas';

const paymentRouter = Router();

paymentRouter.post('/group/:groupId/pix', authMiddleware, requireElevatedAccount, paymentController.createPixPayment);
paymentRouter.get('/group/:groupId', authMiddleware, validate(PaginationSchema, 'query'), paymentController.getGroupPayments);
paymentRouter.post('/webhook', paymentController.handleWebhook);

export { paymentRouter };
