// Each person gets a stable color from their name. Used for avatars, chat names and list dots.
export const PALETTE = ['#FF5C8A', '#6C8CFF', '#FFC83D', '#38E0B0', '#A678FF', '#FF8A3D'];
export const colorFor = (s = '') => PALETTE[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

export default function Avatar({ name = '?', size = 36 }) {
  return (
    <span
      aria-hidden
      style={{ background: colorFor(name), width: size, height: size, fontSize: size * 0.45 }}
      className="grid shrink-0 place-items-center rounded-full font-display font-extrabold text-night"
    >
      {name.trim()[0]?.toUpperCase() || '?'}
    </span>
  );
}
