import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { colorFor } from '../components/Avatar.jsx';
import { api } from '../lib/api.js';

const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const duration = (a, b) => {
  if (!b) return null;
  const m = Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};

export default function History() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.history().then((d) => setRows(d.meetings)).catch((e) => setError(e.message)); }, []);

  return (
    <Layout>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Your meetings</h1>
      {error && <p role="alert" className="mt-6 text-danger">{error}</p>}
      {!rows && !error && <p className="mt-6 text-muted">Loading…</p>}
      {rows?.length === 0 && <p className="mt-6 text-muted">Nothing here yet. <Link className="font-bold text-sun" to="/dashboard">Start your first meeting</Link>.</p>}
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {rows?.map((m) => (
          <li key={m.code} className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex min-w-0 items-start gap-4">
              <span aria-hidden style={{ background: colorFor(m.code) }} className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-[5px]" />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{m.title}</p>
                <p className="mt-0.5 text-sm text-muted">{fmt(m.startedAt)}{duration(m.startedAt, m.endedAt) && `, ${duration(m.startedAt, m.endedAt)}`}</p>
                <p className="text-sm text-muted">{m.isHost ? 'You hosted' : `Hosted by ${m.hostName}`}, {m.participantCount} {m.participantCount === 1 ? 'person' : 'people'} joined</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link className="btn btn-ghost" to={`/transcript/${m.code}`}>Transcript</Link>
              {m.status === 'active' ? <Link className="btn btn-primary" to={`/meeting/${m.code}`}>Rejoin</Link> : <span className="px-2 text-sm text-muted">Ended</span>}
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
