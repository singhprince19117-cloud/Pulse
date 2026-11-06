import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { COOKIE, cookieOptions, signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});
export const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    currentPassword: z.string().max(128).optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, { message: 'Current password required', path: ['currentPassword'] });

const startSession = (res, user) => {
  res.cookie(COOKIE, signToken(user.id), cookieOptions);
  return res.json({ user: user.toPublic() });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new HttpError(409, 'Email already registered');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201);
  startSession(res, user);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message for unknown email and wrong password: no account enumeration.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, 'Invalid email or password');
  startSession(res, user);
});

export const logout = (_req, res) => {
  res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
};

export const me = (req, res) => res.json({ user: req.user.toPublic() });

export const updateMe = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (name) user.name = name;
  if (newPassword) {
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new HttpError(400, 'Current password is incorrect');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
  }
  await user.save();
  res.json({ user: user.toPublic() });
});
