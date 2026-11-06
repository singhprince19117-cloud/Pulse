import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar, { PALETTE } from './Avatar.jsx';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight">
      <span className="grid h-7 w-7 grid-cols-2 gap-[3px]" aria-hidden>
        {PALETTE.slice(0, 4).map((c) => <i key={c} style={{ background: c }} className="rounded-[6px]" />)}
      </span>
      Pulse
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const link = ({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-sun text-night' : 'text-muted hover:text-snow'}`;
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Main">
          <div className="flex rounded-full bg-plum p-1">
            <NavLink to="/dashboard" className={link}>Home</NavLink>
            <NavLink to="/history" className={link}>History</NavLink>
          </div>
          <NavLink to="/profile" aria-label="Profile and settings" className="rounded-full focus-visible:outline-offset-4"><Avatar name={user?.name} size={40} /></NavLink>
          <button className="px-2 text-sm font-medium text-muted hover:text-snow" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6">{children}</main>
    </div>
  );
}
