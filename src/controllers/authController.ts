import { Request, Response, NextFunction } from 'express';
import {
  createNewUser,
  loginUser,
  loginOrCreateDevice,
  elevateAccountToLocal,
  elevateAccountToProvider,
  addProviderToAccount,
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
    const { username, password } = req.body;
    const user = await loginUser(username, password);
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const deviceLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { device_id } = req.body;
    const result = await loginOrCreateDevice(device_id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const elevateLocal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(Errors.UNAUTHORIZED);
    const { name, username, email, password, timezone } = req.body;
    const result = await elevateAccountToLocal(userId, { name, username, email, password, timezone });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const elevateProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(Errors.UNAUTHORIZED);
    const { provider_id, provider, email, name, timezone } = req.body;
    const result = await elevateAccountToProvider(userId, { provider_id, provider, email, name, timezone });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const addProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(Errors.UNAUTHORIZED);
    const { provider_id, provider, email, name } = req.body;
    await addProviderToAccount(userId, { provider_id, provider, email, name });
    return res.status(200).json({ message: 'Provider added successfully' });
  } catch (error) {
    next(error);
  }
};

const editProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(Errors.UNAUTHORIZED);
    const { name, timezone, email, currentPassword, password, push_token } = req.body;
    const updated = await editProfileService(userId, { name, timezone, email, currentPassword, password, push_token });
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

export { createAuth, login, deviceLogin, elevateLocal, elevateProvider, addProvider, editProfile, loginWithGoogle };
