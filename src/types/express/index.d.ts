import 'express';

export interface AuthUser {
  id: number;
  email: string;
  iat: number;
  exp: number;
}

declare module 'express' {
  export interface Request {
    user?: AuthUser;
    validatedQuery?: Record<string, unknown>;
  }
}
