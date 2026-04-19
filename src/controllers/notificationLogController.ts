import { Request, Response, NextFunction } from 'express';
import notificationLogService from '../services/notificationLogService';

export const getNotificationLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = Number(req.params.id);
    const notificationId = Number(req.params.notificationId);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const result = await notificationLogService.getByNotification(
      groupId,
      notificationId,
      req.user!,
      page,
      limit
    );

    res.json({ logs: result.data, pagination: { page, limit, total: result.total } });
  } catch (error) {
    next(error);
  }
};

export const getUserNotificationLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 30);

    const result = await notificationLogService.getByUser(req.user!.id, page, limit);

    res.json({ logs: result.data, pagination: { page, limit, total: result.total } });
  } catch (error) {
    next(error);
  }
};
