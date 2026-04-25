import { Router } from 'express';
import * as groupController from '../controllers/groupController';
import authMiddleware from '../middlewares/authMiddleware';
import requireElevatedAccount from '../middlewares/requireElevatedAccount';
import { validate } from '../middlewares/validate';
import { CreateGroupSchema, UpdateGroupSchema, JoinLeaveGroupSchema, OwnerLeaveSchema, PaginationSchema, UpgradeGroupSchema } from '../schemas';

const groupRouter = Router();

groupRouter.get('/code/:code', groupController.getGroupByCode);
groupRouter.post('/', authMiddleware, requireElevatedAccount, validate(CreateGroupSchema), groupController.createGroup);
groupRouter.put('/:id', authMiddleware, validate(UpdateGroupSchema), groupController.updateGroup);
groupRouter.post('/join', authMiddleware, validate(JoinLeaveGroupSchema), groupController.joinGroup);
groupRouter.post('/leave', authMiddleware, validate(JoinLeaveGroupSchema), groupController.leaveGroup);
groupRouter.get('/user', authMiddleware, validate(PaginationSchema, 'query'), groupController.getUserGroups);
groupRouter.get('/:id/users', authMiddleware, validate(PaginationSchema, 'query'), groupController.getGroupUsers);
groupRouter.delete('/:id/users/:userId', authMiddleware, groupController.kickUser);
groupRouter.post('/:id/leave', authMiddleware, validate(OwnerLeaveSchema), groupController.ownerLeaveGroup);
groupRouter.get('/:id/subscription', authMiddleware, groupController.getSubscription);
groupRouter.post('/:id/upgrade', authMiddleware, requireElevatedAccount, validate(UpgradeGroupSchema), groupController.upgradeGroup);

export { groupRouter };
