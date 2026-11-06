import crypto from 'node:crypto';

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz';
const part = (n) => Array.from(crypto.randomBytes(n), (b) => ALPHABET[b % ALPHABET.length]).join('');

export const generateRoomCode = () => `${part(3)}-${part(4)}-${part(3)}`;
const CODE_RE = /[a-z]{3}-[a-z]{4}-[a-z]{3}/;

// Accepts a bare code or a full invite URL; returns a normalized code or null.
export function parseRoomCode(input = '') {
  const m = String(input).trim().toLowerCase().match(CODE_RE);
  return m ? m[0] : null;
}
