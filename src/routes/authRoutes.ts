import { Router } from 'express';
import { createAuth, login, editUser } from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { RegisterSchema, LoginSchema, EditNameSchema } from '../schemas';

const authRouter = Router();

authRouter.post('/register', validate(RegisterSchema), createAuth);
authRouter.post('/login', validate(LoginSchema), login);
authRouter.patch('/edit-name', authMiddleware, validate(EditNameSchema), editUser);

export { authRouter };
