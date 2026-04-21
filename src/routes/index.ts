import { Router } from 'express';
import { authRouter } from './authRoutes';
import { groupRouter } from './groupRoutes';
import { notificationRouter } from './notificationRoutes';
import { paymentRouter } from './paymentRoutes';
import { planRouter } from './planRoutes';
import authMiddleware from '../middlewares/authMiddleware';
import { getUserNotifications } from '../controllers/notificationController';
import { getUserNotificationLogs } from '../controllers/notificationLogController';
import { version } from '../../package.json';

const router: Router = Router();

router.get('/', (_req, res) => res.send('Backend running ok'));
router.get('/status', (_req, res) => res.json({ status: 'ok', version }));

router.use('/auth', authRouter);
router.use('/group', groupRouter);
router.use('/group/:id/notifications', notificationRouter);
router.get('/notifications', authMiddleware, getUserNotifications);
router.get('/notification-logs', authMiddleware, getUserNotificationLogs);
router.use('/payment', paymentRouter);
router.use('/plans', planRouter);

export default router;
