import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET', 'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'];

export function assertEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  livekit: {
    url: process.env.LIVEKIT_URL,
    key: process.env.LIVEKIT_API_KEY,
    secret: process.env.LIVEKIT_API_SECRET,
  },
};
