import { Request, Response, NextFunction } from 'express';
import {
  createNewUser,
  loginUser,
  editUserName as editUserNameService,
} from '../services/userService';
import { AppError } from '../middlewares/errorHandler';

const createAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await createNewUser(req.body);
    return res.status(201).json(user);
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(error.message || 'Erro ao criar usuário', 400));
    }
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);
    return res.status(200).json(user);
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(error.message || 'Erro ao fazer login', 400));
    }
  }
};

const editUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;
    if (!userId) throw new AppError('Unauthorized', 401);
    const updated = await editUserNameService(userId, name);
    return res.status(200).json(updated);
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(error.message || 'Erro ao editar nome', 400));
    }
  }
};

export { createAuth, login, editUser };
