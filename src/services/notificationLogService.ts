import notificationLogRepository from '../repositories/notificationLogRepository';
import notificationRepository from '../repositories/notificationRepository';
import groupService from './groupService';
import { AppError, Errors } from '../errors';
import { AuthUser } from '../types/express';

const getByNotification = async (
  groupId: number,
  notificationId: number,
  user: AuthUser,
  page: number,
  limit: number
) => {
  const inGroup = await groupService.isUserInGroup(user.id, groupId);
  if (!inGroup) throw new AppError(Errors.GROUP_ACCESS_DENIED);

  const notification = await notificationRepository.getById(notificationId);
  if (!notification || notification.group_id !== groupId)
    throw new AppError(Errors.NOTIFICATION_NOT_FOUND);

  return await notificationLogRepository.getByNotificationId(notificationId, page, limit);
};

const getByUser = async (userId: number, page: number, limit: number) => {
  return await notificationLogRepository.getByUser(userId, page, limit);
};

export default { getByNotification, getByUser };
