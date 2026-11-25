export const CATEGORIES = ['Technology', 'Education', 'Health', 'Art', 'Environment', 'Community', 'Sports', 'Other'];

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatINR = (n) => inr.format(Number(n) || 0);

export function compactINR(n) {
  n = Number(n) || 0;
  const trim = (v) => v.toFixed(1).replace(/\.0$/, '');
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
  if (n >= 1e3) return `₹${trim(n / 1e3)}K`;
  return `₹${n}`;
}

export const percentOf = (raised, goal) => (goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0);

export const isEnded = (deadline) => new Date(deadline).getTime() <= Date.now();

export function deadlineLabel(deadline) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const days = Math.ceil(ms / 864e5);
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function timeAgo(date) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(date);
}

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const initialOf = (name = '?') => (name.trim()[0] || '?').toUpperCase();

// merges a "pledge:new" socket payload into a campaign object
export const applyPledge = (c, p) =>
  c && String(c._id) === String(p.campaignId)
    ? { ...c, raised: p.raised, supportersCount: p.supportersCount, percent: p.percent }
    : c;

export const roleHome = (role) => (role === 'admin' ? '/admin' : role === 'creator' ? '/dashboard' : '/explore');
