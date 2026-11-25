import { useEffect, useRef, useState } from 'react';
import { formatINR } from '../utils';

/* ---------- Logo: a rounded square being filled by a wave ---------- */
export function Logo({ size = 30, id = 'lg' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect width="28" height="28" rx="8" />
        </clipPath>
      </defs>
      <rect width="28" height="28" rx="8" fill="var(--pine)" />
      <g clipPath={`url(#${id})`}>
        <path d="M0 16Q7 11 14 16T28 16V28H0Z" fill="var(--marigold)" />
      </g>
    </svg>
  );
}

/* ---------- Progress bar (pulses when the value changes live) ---------- */
export function ProgressBar({ percent = 0, raised = 0, goal = 1, size = 'md' }) {
  const [pulse, setPulse] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1200);
    return () => clearTimeout(t);
  }, [raised]);

  const pct = Math.max(0, Math.min(100, percent));
  const funded = raised >= goal;
  return (
    <div
      className={`pbar pbar-${size} ${pulse ? 'pulse' : ''} ${funded ? 'funded' : ''}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Funding progress"
    >
      <span style={{ '--w': `${pct}%` }} />
    </div>
  );
}

/* ---------- Number that counts up to its new value ---------- */
export function AnimatedNumber({ value = 0, format = formatINR, duration = 900 }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = a + (value - a) * eased;
      setShown(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(Math.round(shown))}</>;
}

/* ---------- Campaign image with a designed fallback ---------- */
const FALLBACKS = [
  ['#0c3b3a', '#1f7a6d'],
  ['#14425b', '#2f7fa6'],
  ['#3d2c5c', '#7a5fb0'],
  ['#5a2f2a', '#c4684f'],
  ['#2e4a22', '#6f9a4a'],
  ['#4a3a14', '#c49a2e'],
  ['#0f3f4a', '#3ba3a0'],
  ['#3a2a40', '#a05a86'],
];

export function CampaignImage({ campaign, className = '' }) {
  const [failed, setFailed] = useState(false);
  const idx = Math.abs([...(campaign.title || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0)) % FALLBACKS.length;
  const [c1, c2] = FALLBACKS[idx];

  if (!campaign.imageUrl || failed) {
    return (
      <div className={`img-fallback ${className}`} style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        <span aria-hidden="true">{(campaign.title || '?')[0].toUpperCase()}</span>
      </div>
    );
  }
  return <img className={className} src={campaign.imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

/* ---------- Status badge ---------- */
export function StatusBadge({ status }) {
  const label = { pending: 'Awaiting review', approved: 'Live', rejected: 'Rejected' }[status] || status;
  return <span className={`badge badge-${status}`}>{label}</span>;
}

/* ---------- Spinner / skeleton ---------- */
export function PageSpinner() {
  return (
    <div className="page-spinner" role="status" aria-label="Loading">
      <span className="spinner" />
    </div>
  );
}

export function CardSkeletons({ count = 6 }) {
  return (
    <div className="grid-cards">
      {Array.from({ length: count }).map((_, i) => (
        <div className="ccard skeleton-card" key={i}>
          <div className="sk sk-img" />
          <div className="ccard-body">
            <div className="sk sk-line w80" />
            <div className="sk sk-line w40" />
            <div className="sk sk-line w100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <rect x="4" y="4" width="48" height="48" rx="14" fill="var(--mint)" />
        <path d="M4 34Q16 26 28 34T52 34V38a14 14 0 0 1-14 14H18A14 14 0 0 1 4 38Z" fill="var(--marigold)" />
      </svg>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ title, children, onClose, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('textarea, input, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h3>{title}</h3>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Category funding bars (from the aggregation endpoint) ---------- */
export function CategoryBars({ data = [], format = formatINR }) {
  if (!data.length) {
    return <p className="muted">No pledges yet. Category funding appears here after the first pledge.</p>;
  }
  const max = Math.max(...data.map((d) => d.raised), 1);
  return (
    <ul className="catbars">
      {data.map((d) => (
        <li key={d.category}>
          <div className="catbars-head">
            <span>{d.category}</span>
            <strong>{format(d.raised)}</strong>
          </div>
          <div className="catbars-track">
            <span style={{ '--w': `${(d.raised / max) * 100}%` }} />
          </div>
          <small>
            {d.pledges} pledge{d.pledges === 1 ? '' : 's'} across {d.campaigns} campaign{d.campaigns === 1 ? '' : 's'}
          </small>
        </li>
      ))}
    </ul>
  );
}
