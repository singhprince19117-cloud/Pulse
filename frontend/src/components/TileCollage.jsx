import { useEffect, useState } from 'react';
import { PALETTE } from './Avatar.jsx';

const TILES = [
  { name: 'Aisha', color: PALETTE[0], cls: 'col-span-2 row-span-2', size: 'text-6xl sm:text-8xl' },
  { name: 'Rohan', color: PALETTE[1], cls: '', size: 'text-3xl sm:text-5xl' },
  { name: 'Mei', color: PALETTE[3], cls: '', size: 'text-3xl sm:text-5xl' },
  { name: 'Dev', color: PALETTE[2], cls: '', size: 'text-3xl sm:text-5xl', muted: true },
  { name: 'Zoya', color: PALETTE[4], cls: 'col-span-2', size: 'text-3xl sm:text-5xl' },
];

// Decorative mock of a call. One tile "speaks" at a time: the one moving part on the page.
export default function TileCollage({ className = '' }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % TILES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`grid grid-cols-3 grid-rows-3 gap-3 ${className}`} role="img" aria-label="Illustration of a video call with five participants">
      {TILES.map((t, i) => (
        <div
          key={t.name}
          style={{ background: t.color, animationDelay: `${i * 90}ms` }}
          className={`relative grid animate-pop place-items-center overflow-hidden rounded-[28px] transition-shadow duration-300 ${t.cls} ${active === i ? 'shadow-[0_0_0_4px_#F4F1FF,0_0_40px_rgba(244,241,255,.35)]' : ''}`}
        >
          <span className={`font-display font-extrabold text-night/80 ${t.size}`}>{t.name[0]}</span>
          <span className="absolute bottom-2 left-2 flex sm:bottom-3 sm:left-3 items-center gap-1.5 rounded-full bg-night/75 px-3 py-1 text-xs font-medium text-snow">
            {t.muted && <span className="text-danger" aria-hidden>●</span>}{t.name}
          </span>
        </div>
      ))}
    </div>
  );
}
