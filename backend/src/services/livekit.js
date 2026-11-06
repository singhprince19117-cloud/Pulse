import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { env } from '../config/env.js';

const httpUrl = () => env.livekit.url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
const roomService = () => new RoomServiceClient(httpUrl(), env.livekit.key, env.livekit.secret);
const ignoreMissing = (e) => {
  if (!/not found|does not exist/i.test(e.message)) throw e;
};

export async function createJoinToken({ roomName, user, isHost }) {
  const at = new AccessToken(env.livekit.key, env.livekit.secret, {
    identity: user.id,
    name: user.name,
    ttl: '2h',
    metadata: JSON.stringify({ isHost }),
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
  });
  return at.toJwt();
}

export const removeParticipant = (room, identity) => roomService().removeParticipant(room, identity).catch(ignoreMissing);
export const closeRoom = (room) => roomService().deleteRoom(room).catch(ignoreMissing);
