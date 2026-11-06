import { Icon } from './Icons.jsx';

// Round icon button used in the lobby and the meeting control bar.
export default function Ctl({ icon, label, text, off = false, on = false, danger = false, ...rest }) {
  const tone = danger ? 'bg-danger text-night hover:brightness-95' : off ? 'bg-danger text-night' : on ? 'bg-sun text-night' : 'bg-grape text-snow hover:bg-line';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-12 items-center justify-center gap-2 rounded-full font-bold transition disabled:opacity-50 ${text ? 'px-5' : 'w-12'} ${tone}`}
      {...rest}
    >
      <Icon name={icon} off={off} />
      {text && <span className="text-sm">{text}</span>}
    </button>
  );
}
