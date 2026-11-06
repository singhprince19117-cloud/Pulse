import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Layout.jsx';
import TileCollage from '../components/TileCollage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function AuthForm({ mode }) {
  const signup = mode === 'signup';
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/dashboard';
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await (signup ? register(f) : login({ email: f.email, password: f.password }));
      nav(from, { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-plum p-12 lg:flex">
        <Logo />
        <div>
          <TileCollage className="aspect-[5/4] w-full max-w-lg" />
          <p className="mt-8 max-w-sm font-display text-2xl font-bold">Pick a room, hop in, talk it through.</p>
        </div>
        <span />
      </div>
      <div className="flex flex-col justify-center px-6 py-10 sm:px-16">
        <div className="mb-10 lg:hidden"><Logo /></div>
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" noValidate>
          <h1 className="text-4xl font-extrabold tracking-tight">{signup ? 'Make your account' : 'Welcome back'}</h1>
          {error && <p role="alert" className="rounded-2xl bg-danger/15 px-4 py-3 text-sm text-danger">{error}</p>}
          {signup && <label className="block text-sm font-medium">Your name<input className="input mt-1.5" value={f.name} onChange={set('name')} autoComplete="name" required /></label>}
          <label className="block text-sm font-medium">Email<input className="input mt-1.5" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></label>
          <label className="block text-sm font-medium">Password
            <input className="input mt-1.5" type="password" value={f.password} onChange={set('password')} autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 8 : undefined} required />
            {signup && <span className="mt-1.5 block text-xs text-muted">Use at least 8 characters.</span>}
          </label>
          <button className="btn btn-primary w-full !py-3.5" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}</button>
          <p className="text-sm text-muted">
            {signup ? <>Already have an account? <Link className="font-bold text-sun" to="/login">Log in</Link></> : <>New here? <Link className="font-bold text-sun" to="/signup">Create an account</Link></>}
          </p>
        </form>
      </div>
    </div>
  );
}
export const Login = () => <AuthForm mode="login" />;
export const Signup = () => <AuthForm mode="signup" />;
