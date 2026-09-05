import { Router } from 'express';
import { userService } from '../services/user.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators/user';
import { ok } from '../utils/api';

export const userRouter = Router();

userRouter.get('/me', authenticate(), async (req, res, next) => {
  try {
    const data = await userService.me(req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});

userRouter.patch('/me', authenticate(), validate(updateProfileSchema), async (req, res, next) => {
  try {
    const data = await userService.updateProfile(req.user!.sub, req.body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

userRouter.post('/me/change-password', authenticate(), validate(changePasswordSchema), async (req, res, next) => {
  try {
    await userService.changePassword(req.user!.sub, req.body);
    res.json(ok({}));
  } catch (e) { next(e); }
});