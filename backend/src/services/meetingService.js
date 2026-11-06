import { Meeting } from '../models/Meeting.js';
import { Attendance } from '../models/Attendance.js';
import { generateRoomCode, parseRoomCode } from '../utils/roomCode.js';
import { HttpError } from '../utils/httpError.js';

export async function createMeeting(host, title) {
  for (let i = 0; i < 5; i++) {
    try {
      return await Meeting.create({ code: generateRoomCode(), title: title || undefined, host: host._id });
    } catch (e) {
      if (e.code !== 11000) throw e; // retry only on code collision
    }
  }
  throw new HttpError(500, 'Could not allocate a room code');
}

export async function getMeetingOr404(rawCode) {
  const code = parseRoomCode(rawCode);
  if (!code) throw new HttpError(400, 'Invalid meeting code');
  const meeting = await Meeting.findOne({ code });
  if (!meeting) throw new HttpError(404, 'Meeting not found');
  return meeting;
}

export const isHost = (meeting, user) => meeting.host.equals(user._id);

export function assertCanJoin(meeting, user) {
  if (meeting.status === 'ended') throw new HttpError(410, 'This meeting has ended');
  if (meeting.removedUsers.some((id) => id.equals(user._id))) {
    throw new HttpError(403, 'You were removed from this meeting by the host');
  }
}

export const hasAttended = (meeting, user) => Attendance.exists({ meeting: meeting._id, user: user._id });

export async function startAttendance(meeting, user) {
  await endAttendance(meeting, user._id);
  return Attendance.create({ meeting: meeting._id, user: user._id, role: isHost(meeting, user) ? 'host' : 'participant' });
}

export const endAttendance = (meeting, userId) =>
  Attendance.updateMany({ meeting: meeting._id, user: userId, leftAt: null }, { leftAt: new Date() });

export const endAllAttendance = (meeting, at) => Attendance.updateMany({ meeting: meeting._id, leftAt: null }, { leftAt: at });

export async function historyFor(user) {
  const joined = await Attendance.distinct('meeting', { user: user._id });
  const meetings = await Meeting.find({ $or: [{ host: user._id }, { _id: { $in: joined } }] })
    .sort({ startedAt: -1 })
    .limit(100)
    .populate('host', 'name');
  const counts = await Attendance.aggregate([
    { $match: { meeting: { $in: meetings.map((m) => m._id) } } },
    { $group: { _id: { m: '$meeting', u: '$user' } } },
    { $group: { _id: '$_id.m', n: { $sum: 1 } } },
  ]);
  const byId = Object.fromEntries(counts.map((c) => [c._id.toString(), c.n]));
  return meetings.map((m) => ({
    code: m.code,
    title: m.title,
    hostName: m.host?.name,
    isHost: !!m.host?._id.equals(user._id),
    status: m.status,
    startedAt: m.startedAt,
    endedAt: m.endedAt,
    participantCount: byId[m._id.toString()] || 0,
  }));
}
