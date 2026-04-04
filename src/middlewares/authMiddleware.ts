import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, Errors } from '../errors';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError(Errors.UNAUTHORIZED));

  const token = authHeader.split(' ')[1];
  if (!token || typeof token !== 'string') return next(new AppError(Errors.UNAUTHORIZED));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    next();
  } catch {
    return next(new AppError(Errors.UNAUTHORIZED));
  }
};

export default authMiddleware;
