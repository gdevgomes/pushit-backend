import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notificationService';
import { Pagination, MonthParamSchema } from '../schemas';

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.createNotification(
      Number(req.params.id),
      req.body,
      req.user!
    );
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.validatedQuery as unknown as Pagination;
    const { data, total } = await notificationService.getNotificationsByGroup(
      Number(req.params.id),
      req.user!,
      page,
      limit
    );
    res.status(200).json({ notifications: data, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const updateNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await notificationService.updateNotification(
      Number(req.params.id),
      Number(req.params.notificationId),
      req.body,
      req.user!
    );
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = MonthParamSchema.safeParse({ month: req.query['month'] ?? new Date().getMonth() + 1 });
    if (!parsed.success) {
      res.status(400).json({ code: 0, key: 'VALIDATION_ERROR', message: 'month: must be an integer between 1 and 12' });
      return;
    }
    const notifications = await notificationService.getUserNotificationsByMonth(req.user!, parsed.data.month);
    res.status(200).json({ notifications, month: parsed.data.month });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.deleteNotification(
      Number(req.params.id),
      Number(req.params.notificationId),
      req.user!
    );
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};
