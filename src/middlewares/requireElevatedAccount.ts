import { Request, Response, NextFunction } from 'express';
import { AppError, Errors } from '../errors';

const requireElevatedAccount = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError(Errors.UNAUTHORIZED));
  if (req.user.accountType === 'device') return next(new AppError(Errors.ELEVATED_ACCOUNT_REQUIRED));
  next();
};

export default requireElevatedAccount;
