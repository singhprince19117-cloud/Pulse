import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Avatar, { colorFor } from '../components/Avatar.jsx';
import { api } from '../lib/api.js';

const time = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function Transcript() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getTranscript(code).then(setData).catch((e) => setError(e.message)); }, [code]);

  const download = () => {
    const lines = data.segments.map((s) => `[${time(s.spokenAt)}] ${s.speakerName}: ${s.text}`);
    const blob = new Blob([`${data.meeting.title} (${code})\n\n${lines.join('\n')}\n`], { type: 'text/plain' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `transcript-${code}.txt` });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Layout>
      <Link to="/history" className="text-sm font-bold text-muted hover:text-snow">Back to meetings</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight">{data ? data.meeting.title : 'Transcript'}</h1>
        {data?.segments.length > 0 && <button className="btn btn-primary" onClick={download}>Download .txt</button>}
      </div>
      {error && <p role="alert" className="mt-6 text-danger">{error}</p>}
      {!data && !error && <p className="mt-6 text-muted">Loading…</p>}
      {data?.segments.length === 0 && <p className="mt-6 max-w-md text-muted">No one was transcribed in this meeting. Transcription works in Chrome and Edge, and only while the mic is on.</p>}
      <ul className="mt-8 space-y-5">
        {data?.segments.map((s) => (
          <li key={s.id} className="flex gap-4">
            <Avatar name={s.speakerName} size={38} />
            <div>
              <p className="text-sm"><b style={{ color: colorFor(s.speakerName) }}>{s.speakerName}</b> <span className="ml-2 text-muted">{time(s.spokenAt)}</span></p>
              <p className="mt-0.5 max-w-prose">{s.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 max-w-prose text-xs text-muted">Written by each person’s browser speech recognition, so accuracy varies.</p>
    </Layout>
  );
}
