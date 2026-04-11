import { Router } from 'express';
import { authRouter } from './authRoutes';
import { groupRouter } from './groupRoutes';
import { notificationRouter } from './notificationRoutes';
import { paymentRouter } from './paymentRoutes';
import { planRouter } from './planRoutes';
import authMiddleware from '../middlewares/authMiddleware';
import { getUserNotifications } from '../controllers/notificationController';

const router: Router = Router();

router.get('/', (_req, res) => res.send('Backend running ok'));

router.use('/auth', authRouter);
router.use('/group', groupRouter);
router.use('/group/:id/notifications', notificationRouter);
router.get('/notifications', authMiddleware, getUserNotifications);
router.use('/payment', paymentRouter);
router.use('/plans', planRouter);

export default router;
