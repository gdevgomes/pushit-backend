import { Request, Response, NextFunction } from 'express';
import {
  createNewUser,
  loginUser,
  editProfile as editProfileService,
  loginWithProvider,
} from '../services/userService';
import { AppError, Errors } from '../errors';

const createAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await createNewUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const editProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(Errors.UNAUTHORIZED);
    const { name, timezone, email, currentPassword, password } = req.body;
    const updated = await editProfileService(userId, { name, timezone, email, currentPassword, password });
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

const loginWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider_id, email, name, timezone } = req.body;
    const result = await loginWithProvider({ provider: 'google', provider_id, email, name, timezone });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export { createAuth, login, editProfile, loginWithGoogle };
