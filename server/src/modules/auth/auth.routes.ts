import { Router } from 'express';
import { asyncHandler, sendData } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from './auth.schema';
import * as authService from './auth.service';

const router = Router();

function clientContext(req: { headers: Record<string, unknown>; ip?: string | undefined }) {
  const userAgent = req.headers['user-agent'];
  return {
    userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 255) : undefined,
    ipAddress: req.ip,
  };
}

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, clientContext(req));
    sendData(res, result, 201);
  }),
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, clientContext(req));
    sendData(res, result);
  }),
);

router.post(
  '/refresh',
  validate({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken, clientContext(req));
    sendData(res, result);
  }),
);

router.post(
  '/logout',
  validate({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    sendData(res, { message: 'Signed out' });
  }),
);

router.post(
  '/logout-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user!.id);
    sendData(res, { message: 'Signed out of all devices' });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user!.id);
    sendData(res, { user });
  }),
);

router.post(
  '/change-password',
  requireAuth,
  authLimiter,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    sendData(res, { message: 'Password updated. Please sign in again.' });
  }),
);

export default router;
