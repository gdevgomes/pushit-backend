import { Router } from 'express';
import { createAuth, login, editProfile } from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { RegisterSchema, LoginSchema, EditProfileSchema } from '../schemas';

const authRouter = Router();

authRouter.post('/register', validate(RegisterSchema), createAuth);
authRouter.post('/login', validate(LoginSchema), login);
authRouter.patch('/profile', authMiddleware, validate(EditProfileSchema), editProfile);

export { authRouter };
