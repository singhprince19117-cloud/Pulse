import { useState } from 'react';
import {
  LiveKitRoom, RoomAudioRenderer, GridLayout, ParticipantTile,
  useTracks, useParticipants, useChat, useConnectionState, useRoomContext, useLocalParticipant, useTrackToggle,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, ConnectionState, DisconnectReason } from 'livekit-client';
import { api, inviteLink } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranscription } from '../lib/useTranscription.js';
import Avatar, { colorFor } from './Avatar.jsx';
import Ctl from './Ctl.jsx';
import { Icon } from './Icons.jsx';

const DEVICE_MSG = {
  PermissionDenied: 'The browser blocked your camera or microphone. Allow it in the address bar, then toggle the device again.',
  NotFound: 'The selected camera or microphone wasn’t found.',
  DeviceInUse: 'Another app is using your camera or microphone.',
};

const isHostMeta = (p) => { try { return JSON.parse(p.metadata || '{}').isHost === true; } catch { return false; } };

function ConnectionBanner() {
  const state = useConnectionState();
  if (state === ConnectionState.Connected) return null;
  const text = state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting ? 'Connection lost. Reconnecting…' : 'Connecting…';
  return <div role="status" className="bg-sun px-4 py-1.5 text-center text-sm font-bold text-night">{text}</div>;
}

function MediaCtl({ source, icon, label, onError }) {
  const { toggle, enabled, pending } = useTrackToggle({ source, onDeviceError: (e) => onError(e.message) });
  const screen = source === Track.Source.ScreenShare;
  return <Ctl icon={icon} label={`${label} ${enabled ? 'off' : 'on'}`} off={!screen && !enabled} on={screen && enabled} aria-pressed={enabled} disabled={pending} onClick={() => toggle()} />;
}

function People({ code, isHost }) {
  const participants = useParticipants();
  const [err, setErr] = useState('');
  const remove = async (p) => {
    if (!window.confirm(`Remove ${p.name || 'this person'} from the meeting? They won’t be able to rejoin.`)) return;
    try { await api.remove(code, p.identity); } catch (e) { setErr(e.message); }
  };
  return (
    <ul className="space-y-1 p-3">
      {err && <li role="alert" className="mb-2 text-sm text-danger">{err}</li>}
      {participants.map((p) => (
        <li key={p.identity} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-grape">
          <Avatar name={p.name || p.identity} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{p.name || p.identity}{p.isLocal && ' (you)'}</p>
            <p className="text-xs text-muted">{isHostMeta(p) ? 'Host, ' : ''}{p.isMicrophoneEnabled ? (p.isSpeaking ? 'Speaking' : 'Mic on') : 'Muted'}</p>
          </div>
          {isHost && !p.isLocal && <button className="rounded-full bg-grape px-3 py-1.5 text-xs font-bold hover:bg-danger hover:text-night" onClick={() => remove(p)}>Remove</button>}
        </li>
      ))}
    </ul>
  );
}

function Chat({ code }) {
  const { chatMessages, send, isSending } = useChat();
  const [text, setText] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    await send(t);
    api.saveMessage(code, t).catch(() => {}); // persistence is best-effort; live delivery is via LiveKit
  };
  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {chatMessages.length === 0 && <li className="text-sm text-muted">No messages yet. Say hi.</li>}
        {chatMessages.map((m, i) => {
          const mine = m.from?.isLocal;
          const who = mine ? 'You' : m.from?.name || 'Guest';
          return (
            <li key={m.id || i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <span className="text-xs"><b style={{ color: colorFor(m.from?.name) }}>{who}</b> <span className="text-muted">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
              <span className={`mt-1 max-w-[88%] break-words rounded-2xl px-3.5 py-2 text-sm ${mine ? 'rounded-br-md bg-sun text-night' : 'rounded-bl-md bg-grape'}`}>{m.message}</span>
            </li>
          );
        })}
      </ul>
      <form onSubmit={submit} className="flex gap-2 border-t border-line p-3">
        <input className="input" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="Message everyone" aria-label="Chat message" />
        <button className="btn btn-primary !px-4" disabled={isSending || !text.trim()}>Send</button>
      </form>
    </div>
  );
}

function Stage({ meeting, isHost }) {
  const room = useRoomContext();
  const [panel, setPanel] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deviceErr, setDeviceErr] = useState('');
  const transcribe = true; // always on for everyone in the meeting (no toggle)
  const { isMicrophoneEnabled } = useLocalParticipant();
  // Only transcribe while the mic is unmuted, so muted speech is never captured.
  const speechErr = useTranscription(meeting.code, transcribe && isMicrophoneEnabled);
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }, { source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );
  const count = useParticipants().length;
  const canShare = typeof navigator.mediaDevices?.getDisplayMedia === 'function';

  const copy = async () => {
    try { await navigator.clipboard.writeText(inviteLink(meeting.code)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  const endAll = async () => {
    if (!window.confirm('End this meeting for everyone?')) return;
    try { await api.end(meeting.code); } catch (e) { setDeviceErr(e.message); }
  };
  const toggle = (id) => setPanel(panel === id ? null : id);
  const err = speechErr || deviceErr;

  return (
    <div className="vc-room flex h-screen flex-col bg-night" data-lk-theme="default">
      <ConnectionBanner />
      <header className="flex items-center justify-between gap-3 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-display text-lg font-bold">{meeting.title}</span>
          <span className="hidden rounded-full bg-plum px-3 py-1 font-mono text-xs text-muted sm:inline">{meeting.code}</span>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm text-muted">
          {transcribe && <span className="flex items-center gap-1.5 text-danger"><span aria-hidden>●</span><span>Transcribing</span></span>}
          <span>{count} in the call</span>
        </div>
      </header>
      {err && <p role="alert" className="mx-5 mb-2 rounded-2xl bg-sun/10 px-4 py-2 text-sm text-sun">{err}</p>}

      <div className="relative flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 px-3 pb-2"><GridLayout tracks={tracks} style={{ height: '100%' }}><ParticipantTile /></GridLayout></main>
        {panel && (
          <aside className="absolute inset-y-0 right-0 z-10 m-3 mt-0 flex w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-[28px] border border-line bg-plum sm:static sm:w-80 sm:shrink-0" aria-label={panel === 'chat' ? 'Chat' : 'People'}>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-lg font-bold">{panel === 'chat' ? 'Chat' : `People (${count})`}</h2>
              <button className="rounded-full p-1 text-muted hover:text-snow" onClick={() => setPanel(null)} aria-label="Close panel"><Icon name="x" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{panel === 'chat' ? <Chat code={meeting.code} /> : <People code={meeting.code} isHost={isHost} />}</div>
          </aside>
        )}
      </div>

      <footer className="flex justify-center px-3 pb-4 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-[32px] border border-line bg-plum p-2">
          <MediaCtl source={Track.Source.Microphone} icon="mic" label="Microphone" onError={setDeviceErr} />
          <MediaCtl source={Track.Source.Camera} icon="video" label="Camera" onError={setDeviceErr} />
          {canShare && <MediaCtl source={Track.Source.ScreenShare} icon="screen" label="Screen share" onError={setDeviceErr} />}
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
          <Ctl icon="users" label="People" on={panel === 'people'} aria-pressed={panel === 'people'} onClick={() => toggle('people')} />
          <Ctl icon="chat" label="Chat" on={panel === 'chat'} aria-pressed={panel === 'chat'} onClick={() => toggle('chat')} />
          <Ctl icon={copied ? 'check' : 'link'} label={copied ? 'Link copied' : 'Copy invite link'} onClick={copy} />
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
          {isHost && <button className="btn btn-ghost !h-12" onClick={endAll}>End for all</button>}
          <Ctl icon="leave" label="Leave meeting" text="Leave" danger onClick={() => room.disconnect()} />
        </div>
      </footer>
      <RoomAudioRenderer />
    </div>
  );
}

export default function Room({ meeting, token, serverUrl, isHost, initial, onExit }) {
  const { user } = useAuth();
  const [deviceMsg, setDeviceMsg] = useState('');

  const disconnected = (reason) => {
    api.leave(meeting.code).catch(() => {});
    if (reason === DisconnectReason.PARTICIPANT_REMOVED) onExit('removed');
    else if (reason === DisconnectReason.ROOM_DELETED) onExit('ended');
    else if (reason === DisconnectReason.CLIENT_INITIATED || reason === undefined) onExit('left');
    else onExit('error');
  };

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      audio={initial.audio}
      video={initial.video}
      onDisconnected={disconnected}
      onMediaDeviceFailure={(f) => setDeviceMsg(DEVICE_MSG[f] || 'A camera or microphone problem occurred.')}
      onError={(e) => console.error('LiveKit error', e)}
      options={{ adaptiveStream: true, dynacast: true }}
      key={user.id}
    >
      {deviceMsg && <p role="alert" className="fixed left-1/2 top-14 z-50 -translate-x-1/2 rounded-2xl bg-sun px-4 py-2 text-sm font-medium text-night">{deviceMsg} <button className="ml-2 font-bold underline" onClick={() => setDeviceMsg('')}>Dismiss</button></p>}
      <Stage meeting={meeting} isHost={isHost} />
    </LiveKitRoom>
  );
}
