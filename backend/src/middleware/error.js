import { env } from '../config/env.js';

export const notFound = (_req, res) => res.status(404).json({ error: 'Not found' });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ error: 'Resource already exists' });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid identifier' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && env.isProd ? 'Internal server error' : err.message });
};
