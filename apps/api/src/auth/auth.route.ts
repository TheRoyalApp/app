import { Hono } from 'hono';
import { signup, signin, refresh, logout, deleteOwnAccount, requestPasswordReset, verifyResetToken, resetPassword } from './auth.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createUserSchema, loginSchema, refreshTokenSchema, requestPasswordResetSchema, verifyResetTokenSchema, resetPasswordSchema } from '../helpers/validation.schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const authRouter = new Hono();

// Apply validation middleware to routes
authRouter.post('/signup', validateBody(createUserSchema), signup);
authRouter.post('/signin', validateBody(loginSchema), signin);
authRouter.post('/refresh', validateBody(refreshTokenSchema), refresh);
authRouter.post('/logout', validateBody(refreshTokenSchema), logout);

// Password reset routes
authRouter.post('/request-password-reset', validateBody(requestPasswordResetSchema), requestPasswordReset);
authRouter.post('/verify-reset-token', validateBody(verifyResetTokenSchema), verifyResetToken);
authRouter.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

authRouter.delete('/delete-account', authMiddleware, deleteOwnAccount);

export default authRouter;
