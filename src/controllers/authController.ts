import { Request, Response, NextFunction } from 'express';
import {
  createNewUser,
  loginUser,
  editUserName as editUserNameService,
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

const editUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;
    if (!userId) throw new AppError(Errors.UNAUTHORIZED);
    const updated = await editUserNameService(userId, name);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export { createAuth, login, editUser };
