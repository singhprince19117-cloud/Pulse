import { Link } from 'react-router-dom';
import { PALETTE } from '../components/Avatar.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <div className="flex justify-center gap-3" role="img" aria-label="404">
          {['4', '0', '4'].map((c, i) => (
            <span key={i} style={{ background: PALETTE[[0, 2, 3][i]], animationDelay: `${i * 100}ms` }} className="grid h-28 w-24 animate-pop place-items-center rounded-[28px] font-display text-7xl font-extrabold text-night sm:h-36 sm:w-32 sm:text-8xl">{c}</span>
          ))}
        </div>
        <h1 className="mt-10 text-3xl font-extrabold">This room doesn’t exist</h1>
        <p className="mt-2 text-muted">The link might be mistyped, or the page has moved.</p>
        <Link to="/" className="btn btn-primary mt-8">Go to the home page</Link>
      </div>
    </div>
  );
}
