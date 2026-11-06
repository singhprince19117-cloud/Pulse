import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { colorFor } from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, extractCode } from '../lib/api.js';

const when = (d) => new Date(d).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [join, setJoin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);

  useEffect(() => { api.history().then((d) => setRecent(d.meetings.slice(0, 4))).catch(() => {}); }, []);

  const create = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { nav(`/meeting/${(await api.createMeeting(title)).meeting.code}`); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  const doJoin = async (e) => {
    e.preventDefault(); setError('');
    const code = extractCode(join);
    if (!code) return setError('Enter a code like abc-defg-hij, or paste an invite link.');
    try { await api.getMeeting(code); nav(`/meeting/${code}`); } catch (err) { setError(err.message); }
  };

  return (
    <Layout>
      <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">Hey {user.name.split(' ')[0]}.<br /><span className="text-muted">Who are you talking to?</span></h1>
      {error && <p role="alert" className="mt-6 rounded-2xl bg-danger/15 px-4 py-3 text-sm text-danger">{error}</p>}

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <form onSubmit={create} className="rounded-[32px] bg-sun p-8 text-night">
          <h2 className="text-3xl font-extrabold">Start a meeting</h2>
          <p className="mt-1 text-night/70">You get a link to share as soon as you’re in.</p>
          <label className="mt-6 block text-sm font-bold">Name it (optional)
            <input className="mt-1.5 w-full rounded-2xl border-2 border-night/20 bg-night/10 px-4 py-3 text-night placeholder:text-night/50 focus:border-night focus:outline-none" placeholder="Chemistry revision" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <button className="btn mt-5 bg-night !px-7 !py-3.5 text-snow hover:bg-plum" disabled={busy}>{busy ? 'Creating…' : 'Create meeting'}</button>
        </form>

        <form onSubmit={doJoin} className="flex flex-col rounded-[32px] border-2 border-dashed border-line p-8">
          <h2 className="text-3xl font-extrabold">Got a code?</h2>
          <p className="mt-1 text-muted">Paste the code or the whole invite link.</p>
          <input className="input mt-6" placeholder="abc-defg-hij" value={join} onChange={(e) => setJoin(e.target.value)} aria-label="Meeting code or link" />
          <button className="btn btn-ghost mt-5 self-start !px-7 !py-3.5">Join meeting</button>
        </form>
      </div>

      <section className="mt-14">
        <div className="flex items-baseline justify-between"><h2 className="text-xl font-bold">Recent</h2><Link to="/history" className="text-sm font-bold text-muted hover:text-snow">All meetings</Link></div>
        {recent.length === 0
          ? <p className="mt-4 text-muted">Your meetings will show up here after your first call.</p>
          : <ul className="mt-3 divide-y divide-line border-y border-line">
              {recent.map((m) => (
                <li key={m.code} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-center gap-4"><span aria-hidden style={{ background: colorFor(m.code) }} className="h-3 w-3 shrink-0 rounded-[4px]" /><span className="truncate font-medium">{m.title}</span><span className="hidden text-sm text-muted sm:inline">{when(m.startedAt)}</span></div>
                  <Link className="text-sm font-bold text-sun" to={m.status === 'active' ? `/meeting/${m.code}` : `/transcript/${m.code}`}>{m.status === 'active' ? 'Rejoin' : 'Transcript'}</Link>
                </li>
              ))}
            </ul>}
      </section>
    </Layout>
  );
}
