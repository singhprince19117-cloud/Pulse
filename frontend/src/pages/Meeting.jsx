import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import Lobby from '../components/Lobby.jsx';
const Room = lazy(() => import('../components/Room.jsx')); // keeps the LiveKit SDK out of the initial bundle

const OVER = {
  removed: ['You were removed', 'The host removed you from this meeting.', false],
  ended: ['Meeting ended', 'The host ended this meeting for everyone.', false],
  left: ['You left the meeting', 'You can rejoin while the meeting is still active.', true],
  error: ['Connection lost', 'We couldn’t keep the connection alive. Check your network and try again.', true],
};

function Notice({ title, text, children }) {
  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div className="max-w-md">
        <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted">{text}</p>
        <div className="mt-8 flex justify-center gap-3">{children}</div>
      </div>
    </div>
  );
}

export default function Meeting() {
  const { code } = useParams();
  const nav = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('lobby');
  const [conn, setConn] = useState(null);
  const [prefs, setPrefs] = useState({ audio: true, video: true });
  const [overReason, setOverReason] = useState('left');

  useEffect(() => {
    api.getMeeting(code).then((d) => setMeeting(d.meeting)).catch((e) => setError(e.message));
  }, [code]);

  const join = async (p) => {
    try {
      const d = await api.token(code); // server authorizes before minting a LiveKit token
      setPrefs(p); setConn(d); setPhase('room');
      return '';
    } catch (e) { return e.message; }
  };

  if (error) return <Notice title="Can’t open this meeting" text={error}><Link className="btn btn-primary" to="/dashboard">Back to home</Link></Notice>;
  if (!meeting) return <div className="grid min-h-screen place-items-center text-muted">Loading meeting…</div>;
  if (meeting.status === 'ended') return <Notice title="Meeting ended" text="This meeting is no longer active."><Link className="btn btn-primary" to="/dashboard">Back to home</Link></Notice>;

  if (phase === 'lobby') return <Lobby meeting={meeting} onJoin={join} />;

  if (phase === 'over') {
    const [title, text, canRejoin] = OVER[overReason] || OVER.left;
    return (
      <Notice title={title} text={text}>
        {canRejoin && <button className="btn btn-ghost" onClick={() => setPhase('lobby')}>Rejoin</button>}
        <button className="btn btn-primary" onClick={() => nav('/dashboard')}>Back to home</button>
      </Notice>
    );
  }

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Connecting…</div>}>
    <Room
      meeting={meeting}
      token={conn.token}
      serverUrl={conn.serverUrl}
      isHost={conn.meeting.isHost}
      initial={prefs}
      onExit={(reason) => { setOverReason(reason); setPhase('over'); }}
    />
    </Suspense>
  );
}
