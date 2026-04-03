import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

//  how to use
//  new AppError('Message', 200);
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

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

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  if (isKnexError(error)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Knex Database Error',
      error,
    });
  }

  console.error('[Unhandled Error]', error);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Internal server error',
    error,
  });
};

export default errorHandler;
