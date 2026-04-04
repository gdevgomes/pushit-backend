import groupRepository from '../repositories/groupRepository';
import subscriptionRepository from '../repositories/subscriptionRepository';
import planRepository from '../repositories/planRepository';
import { Group, NewGroup } from '../types/group';
import { AppError, Errors } from '../errors';

const isUserInGroup = async (
  userId: number,
  groupId: number
): Promise<boolean> => {
  const groups = await groupRepository.getGroupsByUser(userId);
  return groups.some((g: Group) => g.id === groupId);
};

const createGroup = async (newGroup: NewGroup, user: any): Promise<Group> => {
  const hasTrial = await subscriptionRepository.hasTrialGroupByOwner(user.id);
  if (hasTrial) throw new AppError(Errors.TRIAL_GROUP_EXISTS);

  const starterPlan = await planRepository.getBySlug('starter');
  if (!starterPlan) throw new AppError(Errors.STARTER_PLAN_NOT_FOUND);

  const group = await groupRepository.createGroup({
    ...newGroup,
    owner_id: user.id,
  });

  await groupRepository.addUserToGroup(user.id, group.id);

  const trialEndsAt = new Date();
  trialEndsAt.setMonth(trialEndsAt.getMonth() + starterPlan.trial_months);
  await subscriptionRepository.create(group.id, trialEndsAt, starterPlan.id, starterPlan.monthly_amount!);

  return group;
};

const addUserToGroup = async (groupId: number, user: any): Promise<void> => {
  const alreadyInGroup = await isUserInGroup(user.id, groupId);
  if (alreadyInGroup) throw new AppError(Errors.ALREADY_IN_GROUP);

  const subscription = await subscriptionRepository.getByGroupId(groupId);
  const plan = subscription ? await planRepository.getById(subscription.plan_id) : null;
  const maxMembers = plan?.max_members ?? null;

  if (maxMembers !== null) {
    const memberCount = await groupRepository.countUsersByGroup(groupId);
    if (memberCount >= maxMembers)
      throw new AppError(Errors.MEMBER_LIMIT_REACHED, `Plan ${plan!.name} allows up to ${maxMembers} members`);
  }

  await groupRepository.addUserToGroup(user.id, groupId);
};

const removeUserFromGroup = async (
  groupId: number,
  user: any
): Promise<void> => {
  const alreadyInGroup = await isUserInGroup(user.id, groupId);
  if (!alreadyInGroup) throw new AppError(Errors.NOT_IN_GROUP);

  const group = await groupRepository.getGroupById(groupId);
  if (group?.owner_id === user.id) throw new AppError(Errors.OWNER_CANNOT_LEAVE);

  await groupRepository.removeUserFromGroup(user.id, groupId);
};

const ownerLeaveGroup = async (groupId: number, nextOwnerId: number | undefined, user: any): Promise<void> => {
  const group = await groupRepository.getGroupById(groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== user.id) throw new AppError(Errors.NOT_GROUP_OWNER);

  if (nextOwnerId !== undefined) {
    const newOwnerInGroup = await isUserInGroup(nextOwnerId, groupId);
    if (!newOwnerInGroup) throw new AppError(Errors.NEW_OWNER_NOT_IN_GROUP);
  } else {
    const oldest = await groupRepository.getOldestMember(groupId, user.id);
    if (!oldest) {
      await groupRepository.deleteGroup(groupId);
      return;
    }
    nextOwnerId = oldest.user_id;
  }

  await groupRepository.updateGroup(groupId, { owner_id: nextOwnerId });
  await groupRepository.removeUserFromGroup(user.id, groupId);
};

const getGroupsByUser = async (userId: number, page: number, limit: number) => {
  return await groupRepository.getPaginatedGroupsByUser(userId, page, limit);
};

const getUsersByGroup = async (groupId: number, user: any, page: number, limit: number) => {
  const alreadyInGroup = await isUserInGroup(user.id, groupId);
  if (!alreadyInGroup) throw new AppError(Errors.GROUP_ACCESS_DENIED);
  return await groupRepository.getPaginatedUsersByGroup(groupId, page, limit);
};

const kickUser = async (
  groupId: number,
  targetUserId: number,
  requestingUser: any
): Promise<void> => {
  const groups = await groupRepository.getGroupsByUser(requestingUser.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== requestingUser.id) throw new AppError(Errors.ONLY_OWNER_CAN_KICK);
  if (targetUserId === requestingUser.id) throw new AppError(Errors.OWNER_CANNOT_LEAVE);

  const targetInGroup = await isUserInGroup(targetUserId, groupId);
  if (!targetInGroup) throw new AppError(Errors.NOT_IN_GROUP);

  await groupRepository.removeUserFromGroup(targetUserId, groupId);
};

const updateGroup = async (
  groupId: number,
  data: Partial<Group>,
  user: any
): Promise<Group> => {
  const groups = await groupRepository.getGroupsByUser(user.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== user.id) throw new AppError(Errors.ONLY_OWNER_CAN_EDIT);
  const updated = await groupRepository.updateGroup(groupId, data);
  return updated[0];
};

const getGroupByCode = async (code: string) => {
  const group = await groupRepository.getGroupByCode(code);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  return group;
};

const getSubscription = async (groupId: number, user: any) => {
  const groups = await groupRepository.getGroupsByUser(user.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== user.id) throw new AppError(Errors.ONLY_OWNER_CAN_VIEW_SUB);

  const subscription = await subscriptionRepository.getByGroupId(groupId);
  if (!subscription) throw new AppError(Errors.SUBSCRIPTION_NOT_FOUND);

  return subscription;
};

export default {
  createGroup,
  addUserToGroup,
  removeUserFromGroup,
  ownerLeaveGroup,
  kickUser,
  getGroupsByUser,
  getUsersByGroup,
  isUserInGroup,
  updateGroup,
  getGroupByCode,
  getSubscription,
};
