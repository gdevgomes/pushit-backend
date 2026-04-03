import groupRepository from '../repositories/groupRepository';
import subscriptionRepository from '../repositories/subscriptionRepository';
import { Group, NewGroup } from '../types/group';
import { AppError } from '../middlewares/errorHandler';

const isUserInGroup = async (
  userId: number,
  groupId: number
): Promise<boolean> => {
  const groups = await groupRepository.getGroupsByUser(userId);
  return groups.some((g: Group) => g.id === groupId);
};

const TRIAL_MONTHS = 3;

const createGroup = async (newGroup: NewGroup, user: any): Promise<Group> => {
  const hasTrial = await subscriptionRepository.hasTrialGroupByOwner(user.id);
  if (hasTrial)
    throw new AppError('Você já possui um grupo em período de trial', 400);

  const group = await groupRepository.createGroup({
    ...newGroup,
    owner_id: user.id,
  });

  await groupRepository.addUserToGroup(user.id, group.id);

  const trialEndsAt = new Date();
  trialEndsAt.setMonth(trialEndsAt.getMonth() + TRIAL_MONTHS);
  await subscriptionRepository.create(group.id, trialEndsAt);

  return group;
};

const GROUP_MEMBER_LIMIT = 30;

const addUserToGroup = async (groupId: number, user: any): Promise<void> => {
  const alreadyInGroup = await isUserInGroup(user.id, groupId);
  if (alreadyInGroup) throw new AppError('Usuário já está no grupo', 400);

  const members = await groupRepository.getUsersByGroup(groupId);
  if (members.length >= GROUP_MEMBER_LIMIT)
    throw new AppError(`Grupo atingiu o limite de ${GROUP_MEMBER_LIMIT} membros`, 400);

  await groupRepository.addUserToGroup(user.id, groupId);
};

const removeUserFromGroup = async (
  groupId: number,
  user: any
): Promise<void> => {
  const alreadyInGroup = await isUserInGroup(user.id, groupId);
  if (!alreadyInGroup) throw new AppError('Usuário não está no grupo', 400);
  await groupRepository.removeUserFromGroup(user.id, groupId);
};

const getGroupsByUser = async (userId: number): Promise<Group[]> => {
  return await groupRepository.getGroupsByUser(userId);
};

const getUsersByGroup = async (groupId: number, user: any): Promise<any[]> => {
  const alreadyInGroup = await isUserInGroup(user.id, groupId);
  if (!alreadyInGroup) throw new AppError('Usuário não está no grupo', 403);
  return await groupRepository.getUsersByGroup(groupId);
};

const kickUser = async (
  groupId: number,
  targetUserId: number,
  requestingUser: any
): Promise<void> => {
  const groups = await groupRepository.getGroupsByUser(requestingUser.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError('Grupo não encontrado', 404);
  if (group.owner_id !== requestingUser.id)
    throw new AppError('Apenas o dono pode remover membros', 403);

  if (targetUserId === requestingUser.id)
    throw new AppError('O dono não pode se remover do grupo', 400);

  const targetInGroup = await isUserInGroup(targetUserId, groupId);
  if (!targetInGroup) throw new AppError('Usuário não está no grupo', 400);

  await groupRepository.removeUserFromGroup(targetUserId, groupId);
};

const updateGroup = async (
  groupId: number,
  data: Partial<Group>,
  user: any
): Promise<Group> => {
  const groups = await groupRepository.getGroupsByUser(user.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError('Grupo não encontrado', 404);
  if (group.owner_id !== user.id)
    throw new AppError('Apenas o dono pode editar o grupo', 403);
  const updated = await groupRepository.updateGroup(groupId, data);
  return updated[0];
};

const getSubscription = async (groupId: number, user: any) => {
  const groups = await groupRepository.getGroupsByUser(user.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError('Grupo não encontrado', 404);
  if (group.owner_id !== user.id)
    throw new AppError('Apenas o dono pode ver a assinatura', 403);

  const subscription = await subscriptionRepository.getByGroupId(groupId);
  if (!subscription) throw new AppError('Assinatura não encontrada', 404);

  return subscription;
};

export default {
  createGroup,
  addUserToGroup,
  removeUserFromGroup,
  kickUser,
  getGroupsByUser,
  getUsersByGroup,
  isUserInGroup,
  updateGroup,
  getSubscription,
};
