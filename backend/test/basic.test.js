import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

// Env must be set before importing app modules. No DB is needed for these tests.
Object.assign(process.env, {
  MONGODB_URI: 'mongodb://127.0.0.1:1/unused',
  JWT_SECRET: 'test-secret',
  LIVEKIT_URL: 'wss://example.livekit.cloud',
  LIVEKIT_API_KEY: 'devkey',
  LIVEKIT_API_SECRET: 'devsecret-devsecret-devsecret-123456',
});
const { createApp } = await import('../src/app.js');
const { createJoinToken } = await import('../src/services/livekit.js');
const { parseRoomCode, generateRoomCode } = await import('../src/utils/roomCode.js');

let server, base;
before(async () => {
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (path, body) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('health endpoint', async () => {
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
});

test('register rejects invalid input before touching the DB', async () => {
  const res = await post('/api/auth/register', { name: '', email: 'nope', password: 'short' });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).details.length >= 3);
});

test('meeting routes require authentication', async () => {
  assert.equal((await post('/api/meetings', {})).status, 401);
  assert.equal((await post('/api/meetings/abc-defg-hij/token', {})).status, 401);
  assert.equal((await fetch(`${base}/api/meetings/history`)).status, 401);
});

test('transcript routes require authentication', async () => {
  assert.equal((await post('/api/meetings/abc-defg-hij/transcript', { text: 'hi' })).status, 401);
  assert.equal((await fetch(`${base}/api/meetings/abc-defg-hij/transcript`)).status, 401);
});

test('forged session cookie is rejected', async () => {
  const forged = jwt.sign({ sub: 'x' }, 'wrong-secret');
  const res = await fetch(`${base}/api/meetings/history`, { headers: { cookie: `vc_token=${forged}` } });
  assert.equal(res.status, 401);
});

test('room codes round-trip and parse from invite URLs', () => {
  const code = generateRoomCode();
  assert.equal(parseRoomCode(code), code);
  assert.equal(parseRoomCode(`https://app.example.com/meeting/${code}`), code);
  assert.equal(parseRoomCode('garbage'), null);
});

test('LiveKit token carries the right identity, room and host grant', async () => {
  const t = await createJoinToken({ roomName: 'abc-defg-hij', user: { id: 'u1', name: 'Ada' }, isHost: true });
  const p = jwt.verify(t, process.env.LIVEKIT_API_SECRET);
  assert.equal(p.sub, 'u1');
  assert.equal(p.video.room, 'abc-defg-hij');
  assert.equal(p.video.roomJoin, true);
  assert.equal(p.video.roomAdmin, true);
  const g = jwt.verify(await createJoinToken({ roomName: 'abc-defg-hij', user: { id: 'u2', name: 'Bo' }, isHost: false }), process.env.LIVEKIT_API_SECRET);
  assert.ok(!g.video.roomAdmin);
});

test('unknown route returns JSON 404', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.equal(res.status, 404);
});
