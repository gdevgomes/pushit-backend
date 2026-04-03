import { Router } from 'express';
import { createAuth, login, editUser } from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';

const authRouter = Router();

authRouter.post('/register', createAuth);
authRouter.post('/login', login);
authRouter.patch('/edit-name', authMiddleware, editUser);

export { authRouter };
