import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notificationService';
import { Pagination } from '../schemas';

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
