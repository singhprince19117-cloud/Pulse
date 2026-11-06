import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, update } = useAuth();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState(null);

  const save = async (e) => {
    e.preventDefault(); setMsg(null);
    const body = { name };
    if (pw.newPassword) Object.assign(body, pw);
    try { await update(body); setPw({ currentPassword: '', newPassword: '' }); setMsg({ ok: true, text: 'Changes saved.' }); }
    catch (err) { setMsg({ ok: false, text: err.message }); }
  };

  return (
    <Layout>
      <div className="flex items-center gap-5"><Avatar name={user.name} size={72} /><div><h1 className="text-4xl font-extrabold tracking-tight">{user.name}</h1><p className="text-muted">{user.email}</p></div></div>
      <form onSubmit={save} className="mt-10 max-w-md space-y-5">
        {msg && <p role="status" className={`rounded-2xl px-4 py-3 text-sm ${msg.ok ? 'bg-mint/15 text-mint' : 'bg-danger/15 text-danger'}`}>{msg.text}</p>}
        <label className="block text-sm font-medium">Display name<input className="input mt-1.5" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required /></label>
        <fieldset className="space-y-3 border-t border-line pt-5">
          <legend className="pr-3 text-sm font-bold">Change password</legend>
          <input className="input" type="password" placeholder="Current password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} aria-label="Current password" />
          <input className="input" type="password" placeholder="New password (8+ characters)" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} aria-label="New password" />
        </fieldset>
        <button className="btn btn-primary">Save changes</button>
      </form>
    </Layout>
  );
}
