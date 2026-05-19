import groupRepository from '../repositories/groupRepository';
import subscriptionRepository from '../repositories/subscriptionRepository';
import planRepository from '../repositories/planRepository';
import notificationService from './notificationService';
import { Group, NewGroup } from '../types/group';
import { AppError, Errors } from '../errors';
import { AuthUser } from '../types/express';

const isUserInGroup = async (
  userId: number,
  groupId: number
): Promise<boolean> => {
  const groups = await groupRepository.getGroupsByUser(userId);
  return groups.some((g: Group) => g.id === groupId);
};

const NON_UPGRADEABLE_SLUGS = ['sand-box', 'enterprise'] as const;

const createGroup = async (newGroup: NewGroup, user: AuthUser): Promise<Group> => {
  const { plan_slug, ...groupData } = newGroup;

  if (plan_slug) {
    const plan = await planRepository.getBySlug(plan_slug);
    if (!plan) throw new AppError(Errors.PLAN_NOT_FOUND);

    const group = await groupRepository.createGroup({ ...groupData, owner_id: user.id });
    await groupRepository.addUserToGroup(user.id, group.id);
    await subscriptionRepository.create(group.id, new Date(), plan.id, plan.monthly_amount ?? 0, 'active');
    return group;
  }

  const sandBoxPlan = await planRepository.getBySlug('sand-box');
  if (!sandBoxPlan) throw new AppError(Errors.SANDBOX_PLAN_NOT_FOUND);

  const group = await groupRepository.createGroup({ ...groupData, owner_id: user.id });
  await groupRepository.addUserToGroup(user.id, group.id);
  await subscriptionRepository.create(group.id, new Date(), sandBoxPlan.id, 0, 'active');

  return group;
};

const upgradeGroup = async (groupId: number, plan_slug: string, user: AuthUser): Promise<void> => {
  const groups = await groupRepository.getGroupsByUser(user.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== user.id) throw new AppError(Errors.NOT_GROUP_OWNER);

  if ((NON_UPGRADEABLE_SLUGS as readonly string[]).includes(plan_slug))
    throw new AppError(Errors.PLAN_NOT_UPGRADEABLE);

  const plan = await planRepository.getBySlug(plan_slug);
  if (!plan) throw new AppError(Errors.PLAN_NOT_FOUND);

  await subscriptionRepository.upgrade(groupId, plan.id, plan.monthly_amount!);
};

const addUserToGroup = async (groupId: number, user: AuthUser): Promise<void> => {
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
  user: AuthUser
): Promise<void> => {
  const alreadyInGroup = await isUserInGroup(user.id, groupId);
  if (!alreadyInGroup) throw new AppError(Errors.NOT_IN_GROUP);

  const group = await groupRepository.getGroupById(groupId);
  if (group?.owner_id === user.id) throw new AppError(Errors.OWNER_CANNOT_LEAVE);

  await groupRepository.removeUserFromGroup(user.id, groupId);
};

const ownerLeaveGroup = async (groupId: number, nextOwnerId: number | undefined, user: AuthUser): Promise<void> => {
  const group = await groupRepository.getGroupById(groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== user.id) throw new AppError(Errors.NOT_GROUP_OWNER);

  if (nextOwnerId !== undefined) {
    const newOwnerInGroup = await isUserInGroup(nextOwnerId, groupId);
    if (!newOwnerInGroup) throw new AppError(Errors.NEW_OWNER_NOT_IN_GROUP);
  } else {
    const oldest = await groupRepository.getOldestMember(groupId, user.id);
    if (!oldest) {
      await groupRepository.softDeleteGroup(groupId);
      return;
    }
    nextOwnerId = oldest.user_id;
  }

  await groupRepository.updateGroup(groupId, { owner_id: nextOwnerId! });
  await groupRepository.removeUserFromGroup(user.id, groupId);
};

const getGroupsByUser = async (userId: number, page: number, limit: number) => {
  return await groupRepository.getPaginatedGroupsByUser(userId, page, limit);
};

const getUsersByGroup = async (groupId: number, user: AuthUser, page: number, limit: number) => {
  const alreadyInGroup = await isUserInGroup(user.id, groupId);
  if (!alreadyInGroup) throw new AppError(Errors.GROUP_ACCESS_DENIED);
  return await groupRepository.getPaginatedUsersByGroup(groupId, page, limit);
};

const kickUser = async (
  groupId: number,
  targetUserId: number,
  requestingUser: AuthUser
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
  user: AuthUser
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

  const memberCount = await groupRepository.countUsersByGroup(group.id);
  const subscription = await subscriptionRepository.getByGroupId(group.id);
  const plan = subscription ? await planRepository.getById(subscription.plan_id) : null;

  return {
    ...group,
    member_count: memberCount,
    max_members: plan?.max_members ?? null,
    plan_name: plan?.name ?? null,
    subscription_status: subscription?.status ?? null,
  };
};

const validateGroup = async (groupId: number) => {
  const group = await groupRepository.getGroupById(groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);

  const memberCount = await groupRepository.countUsersByGroup(groupId);
  const subscription = await subscriptionRepository.getByGroupId(groupId);
  const plan = subscription ? await planRepository.getById(subscription.plan_id) : null;
  const maxMembers = plan?.max_members ?? null;

  if (maxMembers !== null && memberCount >= maxMembers) {
    throw new AppError(Errors.MEMBER_LIMIT_REACHED);
  }

  return {
    available: true,
    group: {
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      member_count: memberCount,
      max_members: maxMembers,
    },
  };
};

const joinWithBirthday = async (
  groupId: number,
  birthday: { name: string; description?: string; month: number; day: number; hour?: number },
  user: AuthUser
) => {
  const group = await groupRepository.getGroupById(groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);

  await addUserToGroup(groupId, user);

  const notification = await notificationService.createNotification(groupId, birthday, user);
  return { notification };
};

const deleteGroup = async (groupId: number, user: AuthUser): Promise<void> => {
  const group = await groupRepository.getGroupById(groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== user.id) throw new AppError(Errors.ONLY_OWNER_CAN_DELETE);
  await groupRepository.softDeleteGroup(groupId);
};

const getSubscription = async (groupId: number, user: AuthUser) => {
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
  upgradeGroup,
  addUserToGroup,
  joinWithBirthday,
  removeUserFromGroup,
  ownerLeaveGroup,
  kickUser,
  getGroupsByUser,
  getUsersByGroup,
  isUserInGroup,
  updateGroup,
  deleteGroup,
  getGroupByCode,
  getSubscription,
  validateGroup,
};
