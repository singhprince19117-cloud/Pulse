import { z } from 'zod';
import { env } from '../config/env.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { TranscriptSegment } from '../models/TranscriptSegment.js';
import { asyncHandler, HttpError } from '../utils/httpError.js';
import * as svc from '../services/meetingService.js';
import { createJoinToken, removeParticipant, closeRoom } from '../services/livekit.js';

export const createSchema = z.object({ title: z.string().trim().max(100).optional() });
export const removeSchema = z.object({ identity: z.string().regex(/^[a-f0-9]{24}$/) });
export const transcriptSchema = z.object({ text: z.string().trim().min(1).max(2000) });
export const messageSchema = z.object({ text: z.string().trim().min(1).max(2000) });

const view = (m, user) => ({ code: m.code, title: m.title, status: m.status, isHost: svc.isHost(m, user), startedAt: m.startedAt });

export const create = asyncHandler(async (req, res) => {
  const meeting = await svc.createMeeting(req.user, req.body.title);
  res.status(201).json({ meeting: view(meeting, req.user) });
});

export const get = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  res.json({ meeting: view(meeting, req.user) });
});

export const history = asyncHandler(async (req, res) => res.json({ meetings: await svc.historyFor(req.user) }));

// Authorization happens before any token is minted. Host identity comes from the DB, never from the client.
export const token = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  svc.assertCanJoin(meeting, req.user);
  const jwt = await createJoinToken({ roomName: meeting.code, user: req.user.toPublic(), isHost: svc.isHost(meeting, req.user) });
  await svc.startAttendance(meeting, req.user);
  res.json({ token: jwt, serverUrl: env.livekit.url, meeting: view(meeting, req.user) });
});

export const leave = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  await svc.endAttendance(meeting, req.user._id);
  res.json({ ok: true });
});

export const remove = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  if (!svc.isHost(meeting, req.user)) throw new HttpError(403, 'Only the host can remove participants');
  const { identity } = req.body;
  if (meeting.host.equals(identity)) throw new HttpError(400, 'The host cannot be removed');
  if (!meeting.removedUsers.some((id) => id.equals(identity))) {
    meeting.removedUsers.push(identity);
    await meeting.save();
  }
  await removeParticipant(meeting.code, identity);
  await svc.endAttendance(meeting, identity);
  res.json({ ok: true });
});

export const end = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  if (!svc.isHost(meeting, req.user)) throw new HttpError(403, 'Only the host can end the meeting');
  meeting.status = 'ended';
  meeting.endedAt = new Date();
  await meeting.save();
  await closeRoom(meeting.code);
  await svc.endAllAttendance(meeting, meeting.endedAt);
  res.json({ ok: true });
});

// Live chat rides LiveKit data channels; these endpoints persist a copy for history.
// Only users who actually joined (have an attendance record) can read or write.
export const postMessage = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  svc.assertCanJoin(meeting, req.user);
  if (!(await svc.hasAttended(meeting, req.user))) throw new HttpError(403, 'Not a participant');
  const msg = await ChatMessage.create({ meeting: meeting._id, sender: req.user._id, senderName: req.user.name, text: req.body.text });
  res.status(201).json({ id: msg.id });
});

export const listMessages = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  if (!(await svc.hasAttended(meeting, req.user))) throw new HttpError(403, 'Not a participant');
  const rows = await ChatMessage.find({ meeting: meeting._id }).sort({ createdAt: 1 }).limit(500);
  res.json({ messages: rows.map((m) => ({ id: m.id, sender: m.sender, senderName: m.senderName, text: m.text, createdAt: m.createdAt })) });
});

// Free transcripts: each participant's browser transcribes their own mic (Web Speech API) and posts final segments.
export const addTranscript = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  if (meeting.removedUsers.some((id) => id.equals(req.user._id))) throw new HttpError(403, 'You were removed from this meeting');
  if (!(await svc.hasAttended(meeting, req.user))) throw new HttpError(403, 'Not a participant');
  await TranscriptSegment.create({ meeting: meeting._id, speaker: req.user._id, speakerName: req.user.name, text: req.body.text });
  res.status(201).json({ ok: true });
});

export const getTranscript = asyncHandler(async (req, res) => {
  const meeting = await svc.getMeetingOr404(req.params.code);
  if (!(await svc.hasAttended(meeting, req.user))) throw new HttpError(403, 'Only people who joined this meeting can view its transcript');
  const rows = await TranscriptSegment.find({ meeting: meeting._id }).sort({ spokenAt: 1 }).limit(5000);
  res.json({
    meeting: { code: meeting.code, title: meeting.title, startedAt: meeting.startedAt, endedAt: meeting.endedAt },
    segments: rows.map((r) => ({ id: r.id, speakerName: r.speakerName, text: r.text, spokenAt: r.spokenAt })),
  });
});
