import 'express';
import 'http';

export interface AuthUser {
  id: number;
  email: string;
  iat: number;
  exp: number;
}

declare module 'http' {
  interface IncomingMessage {
    rawBody?: string;
  }
}

declare module 'express' {
  export interface Request {
    user?: AuthUser;
    validatedQuery?: Record<string, unknown>;
  }
}
