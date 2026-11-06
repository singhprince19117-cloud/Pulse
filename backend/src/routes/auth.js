import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as c from '../controllers/authController.js';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const r = Router();
r.post('/register', limiter, validate(c.registerSchema), c.register);
r.post('/login', limiter, validate(c.loginSchema), c.login);
r.post('/logout', c.logout);
r.get('/me', requireAuth, c.me);
r.patch('/me', requireAuth, validate(c.updateSchema), c.updateMe);
export default r;
