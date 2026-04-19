import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { getNotificationLogs } from '../controllers/notificationLogController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { CreateNotificationSchema, UpdateNotificationSchema, PaginationSchema } from '../schemas';

const notificationRouter = Router({ mergeParams: true });

notificationRouter.post('/', authMiddleware, validate(CreateNotificationSchema), notificationController.createNotification);
notificationRouter.get('/', authMiddleware, validate(PaginationSchema, 'query'), notificationController.getNotifications);
notificationRouter.get('/:notificationId/logs', authMiddleware, validate(PaginationSchema, 'query'), getNotificationLogs);
notificationRouter.put('/:notificationId', authMiddleware, validate(UpdateNotificationSchema), notificationController.updateNotification);
notificationRouter.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

export { notificationRouter };
