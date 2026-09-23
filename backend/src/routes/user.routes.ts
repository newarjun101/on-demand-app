import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators/user';
import { userController } from '../controllers/user.controller';

export const userRouter = Router();

userRouter.get('/me', authenticate(), userController.me);

userRouter.patch('/me', authenticate(), validate(updateProfileSchema), userController.updateProfile);

userRouter.post('/me/change-password', authenticate(), validate(changePasswordSchema), userController.changePassword);