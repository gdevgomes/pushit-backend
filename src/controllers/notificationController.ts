import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notificationService';

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.createNotification(
      Number(req.params.id),
      req.body,
      req.user
    );
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationService.getNotificationsByGroup(
      Number(req.params.id),
      req.user
    );
    res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};
