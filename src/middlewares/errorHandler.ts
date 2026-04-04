import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export { AppError } from '../errors';

export interface KnexError extends Error {
  code?: string;
  errno?: number;
  detail?: string;
  table?: string;
  constraint?: string;
}

export function isKnexError(error: unknown): error is KnexError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

import { AppError } from '../errors';

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      key: error.key,
      message: error.message,
      ...(error.detail && { detail: error.detail }),
      ...(isDev && { stack: error.stack }),
    });
  }

  if (isKnexError(error)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      code: 0,
      key: 'DATABASE_ERROR',
      message: 'Database error',
      ...(isDev && { detail: error.message, stack: error.stack }),
    });
  }

  console.error('[Unhandled Error]', error);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    code: 0,
    key: 'INTERNAL_ERROR',
    message: 'Internal server error',
    ...(isDev && { stack: (error as Error).stack }),
  });
};

export default errorHandler;
