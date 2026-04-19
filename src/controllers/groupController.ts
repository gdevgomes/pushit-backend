import { Request, Response, NextFunction } from 'express';
import groupService from '../services/groupService';
import { Pagination } from '../schemas';

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await groupService.createGroup(req.body, req.user!);
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await groupService.updateGroup(Number(req.params.id), req.body, req.user!);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await groupService.addUserToGroup(req.body.groupId, req.user!);
    res.status(200).json({ message: 'Entrou no grupo' });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await groupService.removeUserFromGroup(req.body.groupId, req.user!);
    res.status(200).json({ message: 'Saiu do grupo' });
  } catch (error) {
    next(error);
  }
};

export const getUserGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.validatedQuery as unknown as Pagination;
    const { data, total } = await groupService.getGroupsByUser(req.user!.id, page, limit);
    res.status(200).json({ groups: data, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const getGroupUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.validatedQuery as unknown as Pagination;
    const { data, total } = await groupService.getUsersByGroup(Number(req.params.id), req.user!, page, limit);
    res.status(200).json({ users: data, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const kickUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await groupService.kickUser(Number(req.params.id), Number(req.params.userId), req.user!);
    res.status(200).json({ message: 'Usuário removido do grupo' });
  } catch (error) {
    next(error);
  }
};

export const ownerLeaveGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await groupService.ownerLeaveGroup(Number(req.params.id), req.body.nextOwnerId, req.user!);
    res.status(200).json({ message: 'Saiu do grupo' });
  } catch (error) {
    next(error);
  }
};

export const getGroupByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await groupService.getGroupByCode(req.params.code as string);
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await groupService.getSubscription(Number(req.params.id), req.user!);
    res.status(200).json(subscription);
  } catch (error) {
    next(error);
  }
};

export const upgradeGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await groupService.upgradeGroup(Number(req.params.id), req.body.plan_slug, req.user!);
    res.status(200).json({ message: 'Plano atualizado' });
  } catch (error) {
    next(error);
  }
};
