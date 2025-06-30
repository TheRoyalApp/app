import { Hono } from 'hono';
import { signup, signin, refresh, logout, deleteOwnAccount } from './auth.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createUserSchema, loginSchema, refreshTokenSchema } from '../helpers/validation.schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const authRouter = new Hono();

// Apply validation middleware to routes
authRouter.post('/signup', validateBody(createUserSchema), signup);
authRouter.post('/signin', validateBody(loginSchema), signin);
authRouter.post('/refresh', validateBody(refreshTokenSchema), refresh);
authRouter.post('/logout', validateBody(refreshTokenSchema), logout);

authRouter.delete('/delete-account', authMiddleware, deleteOwnAccount);

export default authRouter;
