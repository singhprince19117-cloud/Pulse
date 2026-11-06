import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';

export const COOKIE = 'vc_token';
export const cookieOptions = {
  httpOnly: true,
  sameSite: env.isProd ? 'none' : 'lax',
  secure: env.isProd,
  maxAge: 7 * 24 * 3600 * 1000,
};

export const signToken = (userId) => jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) throw new HttpError(401, 'Authentication required');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, 'Invalid or expired session');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'User no longer exists');
  req.user = user;
  next();
});
