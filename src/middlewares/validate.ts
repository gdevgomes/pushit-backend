import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const input = source === 'body' ? req.body : req.query;
    const result = schema.safeParse(input);
    if (!result.success) {
      const issue = result.error.issues?.[0] ?? (result.error as any).errors?.[0];
      const field = issue?.path?.join('.') ?? '';
      const message = issue?.message ?? 'Validation error';
      res.status(400).json({
        code: 0,
        key: 'VALIDATION_ERROR',
        message: field ? `${field}: ${message}` : message,
      });
      return;
    }
    if (source === 'body') {
      req.body = result.data;
    } else {
      (req as any).validatedQuery = result.data;
    }
    next();
  };
