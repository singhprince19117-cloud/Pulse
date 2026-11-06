import { assertEnv, env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

assertEnv();
await connectDb();
createApp().listen(env.port, () => console.log(`API listening on :${env.port}`));
