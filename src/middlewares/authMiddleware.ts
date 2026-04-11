import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, Errors } from '../errors';
import { env } from '../config/env';
import { AuthUser } from '../types/express';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError(Errors.UNAUTHORIZED));

  const token = authHeader.split(' ')[1];
  if (!token || typeof token !== 'string')
    return next(new AppError(Errors.UNAUTHORIZED));

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === 'string') return next(new AppError(Errors.UNAUTHORIZED));
    req.user = decoded as AuthUser;
    next();
  } catch {
    return next(new AppError(Errors.UNAUTHORIZED));
  }
};

export default authMiddleware;
