import notificationRepository from '../repositories/notificationRepository';
import groupRepository from '../repositories/groupRepository';
import groupService from './groupService';
import { findUserById } from '../repositories/userRepository';
import { AppError } from '../middlewares/errorHandler';
import { Notification, NewNotification } from '../types/notification';
import { computeScheduledAt } from '../utils/computeScheduledAt';

const MEMBER_LIMIT = 1;
const OWNER_BONUS = 9;

const createNotification = async (
  groupId: number,
  data: Pick<NewNotification, 'name' | 'description' | 'month' | 'day'>,
  user: any
): Promise<Notification> => {
  const inGroup = await groupService.isUserInGroup(user.id, groupId);
  if (!inGroup) throw new AppError('Usuário não está no grupo', 403);

  const group = await groupRepository.getGroupById(groupId);
  if (!group) throw new AppError('Grupo não encontrado', 404);

  const isOwner = group.owner_id === user.id;
  const limit = isOwner ? MEMBER_LIMIT + OWNER_BONUS : MEMBER_LIMIT;

  const count = await notificationRepository.countByUserInGroup(groupId, user.id);
  if (count >= limit)
    throw new AppError(`Limite de notificações atingido (${limit})`, 400);

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

const getNotificationsByGroup = async (groupId: number, user: any): Promise<Notification[]> => {
  const inGroup = await groupService.isUserInGroup(user.id, groupId);
  if (!inGroup) throw new AppError('Usuário não está no grupo', 403);

  return await notificationRepository.getByGroup(groupId);
};

export default { createNotification, getNotificationsByGroup };
