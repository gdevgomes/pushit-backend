import notificationRepository from '../repositories/notificationRepository';
import notificationLogRepository from '../repositories/notificationLogRepository';
import groupRepository from '../repositories/groupRepository';
import subscriptionRepository from '../repositories/subscriptionRepository';
import planRepository from '../repositories/planRepository';
import groupService from './groupService';
import { findUserById } from '../repositories/userRepository';
import { AppError, Errors } from '../errors';
import { Notification, NewNotification } from '../types/notification';
import { computeScheduledAt } from '../utils/computeScheduledAt';

const createNotification = async (
  groupId: number,
  data: Pick<NewNotification, 'name' | 'description' | 'month' | 'day'>,
  user: any
): Promise<Notification> => {
  const inGroup = await groupService.isUserInGroup(user.id, groupId);
  if (!inGroup) throw new AppError(Errors.GROUP_ACCESS_DENIED);

  const group = await groupRepository.getGroupById(groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);

  const subscription = await subscriptionRepository.getByGroupId(groupId);
  const plan = subscription ? await planRepository.getById(subscription.plan_id) : null;

  const isOwner = group.owner_id === user.id;
  const limit = isOwner
    ? (plan?.max_notifications_owner ?? null)
    : (plan?.max_notifications_per_member ?? null);

  const count = await notificationRepository.countByUserInGroup(groupId, user.id);
  if (limit !== null && count >= limit)
    throw new AppError(Errors.NOTIFICATION_LIMIT_REACHED, `Plan ${plan!.name} allows up to ${limit} notifications`);

  const fullUser = await findUserById(user.id);
  const timezone = fullUser?.timezone ?? 'UTC';
  const scheduled_at = computeScheduledAt(data.month, data.day, timezone).toISOString();

  return await notificationRepository.create({
    ...data,
    timezone,
    scheduled_at,
    group_id: groupId,
    created_by: user.id,
  });
};

const getNotificationsByGroup = async (groupId: number, user: any, page: number, limit: number) => {
  const inGroup = await groupService.isUserInGroup(user.id, groupId);
  if (!inGroup) throw new AppError(Errors.GROUP_ACCESS_DENIED);

  return await notificationRepository.getPaginated(groupId, page, limit);
};

const updateNotification = async (
  groupId: number,
  notificationId: number,
  data: Pick<Partial<NewNotification>, 'name' | 'description' | 'month' | 'day'>,
  user: any
) => {
  const inGroup = await groupService.isUserInGroup(user.id, groupId);
  if (!inGroup) throw new AppError(Errors.GROUP_ACCESS_DENIED);

  const notification = await notificationRepository.getById(notificationId);
  if (!notification || notification.group_id !== groupId) throw new AppError(Errors.NOTIFICATION_NOT_FOUND);

  const group = await groupRepository.getGroupById(groupId);
  const isOwner = group?.owner_id === user.id;
  const isCreator = notification.created_by === user.id;
  if (!isOwner && !isCreator) throw new AppError(Errors.NOTIFICATION_ACCESS_DENIED);

  const updateData: any = { ...data };
  if (data.month !== undefined || data.day !== undefined) {
    const fullUser = await findUserById(user.id);
    const timezone = fullUser?.timezone ?? 'UTC';
    const month = data.month ?? notification.month;
    const day = data.day ?? notification.day;
    updateData.scheduled_at = computeScheduledAt(month, day, timezone).toISOString();
  }

  return await notificationRepository.update(notificationId, updateData);
};

const deleteNotification = async (groupId: number, notificationId: number, user: any) => {
  const inGroup = await groupService.isUserInGroup(user.id, groupId);
  if (!inGroup) throw new AppError(Errors.GROUP_ACCESS_DENIED);

  const notification = await notificationRepository.getById(notificationId);
  if (!notification || notification.group_id !== groupId) throw new AppError(Errors.NOTIFICATION_NOT_FOUND);

  const group = await groupRepository.getGroupById(groupId);
  const isOwner = group?.owner_id === user.id;
  const isCreator = notification.created_by === user.id;
  if (!isOwner && !isCreator) throw new AppError(Errors.NOTIFICATION_ACCESS_DENIED);

  await notificationRepository.remove(notificationId);
};

export default { createNotification, getNotificationsByGroup, updateNotification, deleteNotification };
