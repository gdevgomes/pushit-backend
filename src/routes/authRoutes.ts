import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuth, login, editProfile, loginWithGoogle } from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { RegisterSchema, LoginSchema, EditProfileSchema } from '../schemas';

const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env['NODE_ENV'] === 'test',
  message: { code: 429, key: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later' },
});

authRouter.post('/register', authRateLimit, validate(RegisterSchema), createAuth);
authRouter.post('/login', authRateLimit, validate(LoginSchema), login);
authRouter.post('/google', authRateLimit, loginWithGoogle);
authRouter.patch('/profile', authMiddleware, validate(EditProfileSchema), editProfile);

export { authRouter };
