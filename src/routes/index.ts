import { Router } from 'express';
import { authRouter } from './authRoutes';
import { groupRouter } from './groupRoutes';
import { notificationRouter } from './notificationRoutes';

const router: Router = Router();

router.use('/auth', authRouter);
router.use('/group', groupRouter);
router.use('/group/:id/notifications', notificationRouter);

export default router;
