import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { inviteLink } from '../lib/api.js';
import Avatar from './Avatar.jsx';
import Ctl from './Ctl.jsx';
import { Icon } from './Icons.jsx';

export function mediaErrorText(err, kind) {
  switch (err?.name) {
    case 'NotAllowedError': return `${kind} access is blocked. Allow it via the lock icon in your browser’s address bar, then reload.`;
    case 'NotFoundError': return `No ${kind.toLowerCase()} was found on this device.`;
    case 'NotReadableError': return `Another app is using your ${kind.toLowerCase()}.`;
    default: return `Couldn’t access your ${kind.toLowerCase()}.`;
  }
}

export default function Lobby({ meeting, onJoin }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camErr, setCamErr] = useState('');
  const [micErr, setMicErr] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Camera preview; stopped on toggle-off/unmount so the camera light turns off.
  useEffect(() => {
    if (!camOn) return;
    let stream; let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCamErr('');
      })
      .catch((e) => { if (!cancelled) { setCamErr(mediaErrorText(e, 'Camera')); setCamOn(false); } });
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [camOn]);

  // One-off microphone permission check.
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then((s) => s.getTracks().forEach((t) => t.stop()))
      .catch((e) => { if (!cancelled) { setMicErr(mediaErrorText(e, 'Microphone')); setMicOn(false); } });
    return () => { cancelled = true; };
  }, []);

  const join = async () => {
    setJoining(true); setError('');
    const msg = await onJoin({ audio: micOn, video: camOn });
    if (msg) { setError(msg); setJoining(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(inviteLink(meeting.code)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <div className="relative aspect-video overflow-hidden rounded-[32px] bg-plum">
          {camOn
            ? <video ref={videoRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            : <div className="grid h-full place-items-center"><Avatar name={user.name} size={112} /></div>}
          <span className="absolute bottom-4 left-4 rounded-full bg-night/75 px-3 py-1 text-sm font-medium">{user.name}</span>
        </div>
        <div className="mt-5 flex justify-center gap-3">
          <Ctl icon="mic" off={!micOn} label={micOn ? 'Turn microphone off' : 'Turn microphone on'} aria-pressed={micOn} onClick={() => !micErr && setMicOn((v) => !v)} />
          <Ctl icon="video" off={!camOn} label={camOn ? 'Turn camera off' : 'Turn camera on'} aria-pressed={camOn} onClick={() => setCamOn((v) => !v)} />
        </div>
        {(camErr || micErr) && (
          <div role="alert" className="mt-5 space-y-1 rounded-2xl bg-sun/10 px-4 py-3 text-sm text-sun">
            {micErr && <p>{micErr}</p>}{camErr && <p>{camErr}</p>}
            <p className="text-sun/70">You can still join and listen.</p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">{meeting.title}</h1>
          <p className="mt-2 text-muted">Joining as {user.name}</p>
          <p className="mt-1 inline-block rounded-full bg-plum px-3 py-1 font-mono text-sm">{meeting.code}</p>
        </div>
        {error && <p role="alert" className="rounded-2xl bg-danger/15 px-4 py-3 text-sm text-danger">{error}</p>}
        <p className="text-sm text-muted">This meeting is transcribed. Your speech is turned into text while your mic is on (Chrome or Edge).</p>
        <button className="btn btn-primary w-full !py-4 text-base" onClick={join} disabled={joining}>{joining ? 'Joining…' : 'Join now'}</button>
        <button className="btn btn-ghost w-full" onClick={copy}><Icon name={copied ? 'check' : 'link'} size={18} />{copied ? 'Link copied' : 'Copy invite link'}</button>
        <Link to="/dashboard" className="block text-center text-sm font-medium text-muted hover:text-snow">Back to home</Link>
      </div>
    </div>
  );
}
