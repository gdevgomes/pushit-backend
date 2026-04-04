import { Router } from 'express';
import * as groupController from '../controllers/groupController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { CreateGroupSchema, UpdateGroupSchema, JoinLeaveGroupSchema, OwnerLeaveSchema, PaginationSchema } from '../schemas';

const groupRouter = Router();

groupRouter.get('/code/:code', groupController.getGroupByCode);
groupRouter.post('/', authMiddleware, validate(CreateGroupSchema), groupController.createGroup);
groupRouter.put('/:id', authMiddleware, validate(UpdateGroupSchema), groupController.updateGroup);
groupRouter.post('/join', authMiddleware, validate(JoinLeaveGroupSchema), groupController.joinGroup);
groupRouter.post('/leave', authMiddleware, validate(JoinLeaveGroupSchema), groupController.leaveGroup);
groupRouter.get('/user', authMiddleware, validate(PaginationSchema, 'query'), groupController.getUserGroups);
groupRouter.get('/:id/users', authMiddleware, validate(PaginationSchema, 'query'), groupController.getGroupUsers);
groupRouter.delete('/:id/users/:userId', authMiddleware, groupController.kickUser);
groupRouter.post('/:id/leave', authMiddleware, validate(OwnerLeaveSchema), groupController.ownerLeaveGroup);
groupRouter.get('/:id/subscription', authMiddleware, groupController.getSubscription);

export { groupRouter };
