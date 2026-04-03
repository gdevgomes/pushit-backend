import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import authMiddleware from '../middlewares/authMiddleware';

const notificationRouter = Router({ mergeParams: true });

notificationRouter.post('/', authMiddleware, notificationController.createNotification);
notificationRouter.get('/', authMiddleware, notificationController.getNotifications);

export { notificationRouter };
