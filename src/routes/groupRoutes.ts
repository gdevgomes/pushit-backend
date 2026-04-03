import { Router } from 'express';
import * as groupController from '../controllers/groupController';
import authMiddleware from '../middlewares/authMiddleware';

const groupRouter = Router();

// criar grupo
groupRouter.post('/', authMiddleware, groupController.createGroup);
// editar nome/descricao do grupo
groupRouter.put('/:id', authMiddleware, groupController.updateGroup);
// entrar em grupo
groupRouter.post('/join', authMiddleware, groupController.joinGroup);
// sair do grupo
groupRouter.post('/leave', authMiddleware, groupController.leaveGroup);
// buscar grupos de usuário
groupRouter.get('/user', authMiddleware, groupController.getUserGroups);
// buscar usuários de grupo
groupRouter.get('/:id/users', authMiddleware, groupController.getGroupUsers);
// dono remove membro do grupo
groupRouter.delete('/:id/users/:userId', authMiddleware, groupController.kickUser);
// assinatura do grupo
groupRouter.get('/:id/subscription', authMiddleware, groupController.getSubscription);

export { groupRouter };
