import { Link } from 'react-router-dom';
import { Logo } from '../components/Layout.jsx';
import TileCollage from '../components/TileCollage.jsx';
import { PALETTE } from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  ['Share your screen', 'Show slides, code or a doc to everyone in one click.'],
  ['Chat while you talk', 'Drop links and notes without interrupting anyone.'],
  ['Get the transcript', 'Everything said in the call is written down for you afterwards.'],
  ['Host controls', 'Remove someone or end the call for everybody.'],
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          {user ? <Link className="btn btn-primary" to="/dashboard">Open huddle</Link> : (
            <>
              <Link className="px-3 text-sm font-bold text-muted hover:text-snow" to="/login">Log in</Link>
              <Link className="btn btn-primary" to="/signup">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1fr_1.05fr] lg:pt-16">
        <div>
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">Your study group, one link away.</h1>
          <p className="mt-6 max-w-md text-lg text-muted">Start a call in a click, share the link, and talk. Screen share, chat and a written transcript are built in.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary !px-8 !py-4 text-base">Start a meeting</Link>
            {!user && <Link to="/login" className="btn btn-ghost !px-8 !py-4 text-base">I have an account</Link>}
          </div>
        </div>
        <TileCollage className="aspect-[5/4] w-full" />
      </section>

      <section className="border-t border-line">
        <dl className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([t, d], i) => (
            <div key={t}>
              <dt className="flex items-center gap-3 font-display text-lg font-bold">
                <span aria-hidden style={{ background: PALETTE[i] }} className="h-3 w-3 rounded-[4px]" />{t}
              </dt>
              <dd className="mt-2 text-sm text-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
