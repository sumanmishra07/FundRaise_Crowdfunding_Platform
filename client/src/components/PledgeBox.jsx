import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR, isEnded } from '../utils';

const PRESETS = [500, 1000, 2500, 5000];

export default function PledgeBox({ campaign, onPledged }) {
  const { user } = useAuth();
  const toast = useToast();
  const loc = useLocation();

  const [amount, setAmount] = useState('1000');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [card, setCard] = useState({ number: '4242 4242 4242 4242', expiry: '12/30', cvc: '123' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  /* ----- states where pledging is not possible ----- */
  if (campaign.status !== 'approved') {
    return (
      <aside className="pledge">
        <h3>Pledges are closed for now</h3>
        <p className="muted">
          {campaign.status === 'pending'
            ? 'This campaign is waiting for admin approval. Pledges open as soon as it is approved.'
            : 'This campaign was rejected and cannot receive pledges.'}
        </p>
      </aside>
    );
  }
  if (isEnded(campaign.deadline)) {
    return (
      <aside className="pledge">
        <h3>This campaign has ended</h3>
        <p className="muted">
          It raised {formatINR(campaign.raised)} from {campaign.supportersCount} supporter
          {campaign.supportersCount === 1 ? '' : 's'}. Pledges are closed.
        </p>
        <Link to="/explore" className="btn btn-primary btn-block">
          Find another campaign
        </Link>
      </aside>
    );
  }
  if (!user) {
    return (
      <aside className="pledge">
        <h3>Back this campaign</h3>
        <p className="muted">Log in with a supporter account to make a pledge.</p>
        <Link to="/login" state={{ from: loc.pathname }} className="btn btn-primary btn-block">
          Log in to pledge
        </Link>
        <p className="pledge-alt">
          New here? <Link to="/register">Create a supporter account</Link>
        </p>
      </aside>
    );
  }
  if (user.role !== 'supporter') {
    return (
      <aside className="pledge">
        <h3>Pledging is for supporters</h3>
        <p className="muted">
          You are signed in as {user.role === 'admin' ? 'an admin' : 'a creator'}. Log in with a supporter account to
          back this campaign.
        </p>
      </aside>
    );
  }

  /* ----- success ----- */
  if (done) {
    return (
      <aside className="pledge pledge-done" aria-live="polite">
        <div className="tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h3>You pledged {formatINR(done.amount)}</h3>
        <p className="muted">The progress bar has already moved. Thank you for backing this campaign.</p>
        <p className="txn">
          Transaction ID <code>{done.transactionId}</code>
        </p>
        <button className="btn btn-ghost btn-block" onClick={() => setDone(null)}>
          Pledge again
        </button>
      </aside>
    );
  }

  /* ----- form ----- */
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 1) return setError('Enter a whole-number amount of at least ₹1.');
    if (value > 1000000) return setError('The maximum pledge is ₹10,00,000.');
    if (card.number.replace(/\D/g, '').length < 12) return setError('Enter a card number with at least 12 digits.');

    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 900)); // simulated payment processing
      const data = await api(`/campaigns/${campaign._id}/pledge`, {
        method: 'POST',
        body: { amount: value, message, anonymous, card: { number: card.number } },
      });
      setDone({ amount: value, transactionId: data.transactionId });
      setMessage('');
      onPledged?.(data.campaign);
      toast.success(`Pledged ${formatINR(value)}. Thank you!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="pledge">
      <h3>Make a pledge</h3>
      <form onSubmit={submit} noValidate>
        <div className="presets" role="group" aria-label="Choose an amount">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p}
              className={`preset ${Number(amount) === p ? 'active' : ''}`}
              onClick={() => setAmount(String(p))}
            >
              {formatINR(p)}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Amount (₹)</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Message to the creator (optional)</span>
          <textarea
            rows="2"
            maxLength="200"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something encouraging"
          />
        </label>

        <label className="check">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span>Hide my name from the supporters list</span>
        </label>

        <fieldset className="mockcard">
          <legend>Payment (simulated)</legend>
          <label className="field">
            <span>Card number</span>
            <input
              inputMode="numeric"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
              autoComplete="off"
            />
          </label>
          <div className="row2">
            <label className="field">
              <span>Expiry</span>
              <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
            </label>
            <label className="field">
              <span>CVC</span>
              <input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
            </label>
          </div>
          <small className="muted">No real payment happens. A card number ending in 0000 simulates a declined payment.</small>
        </fieldset>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? 'Processing payment…' : `Pledge ${formatINR(Number(amount) || 0)}`}
        </button>
      </form>
    </aside>
  );
}
