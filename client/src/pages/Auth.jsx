import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/ui';
import { roleHome } from '../utils';

const DEMOS = [
  ['Admin', 'admin@fundraise.com', 'admin123'],
  ['Creator', 'creator@fundraise.com', 'creator123'],
  ['Supporter', 'supporter@fundraise.com', 'supporter123'],
];

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden="true">
        <Logo size={44} id="lg-auth" />
        <h2>Every pledge moves the bar.</h2>
        <p>Create an account to launch a campaign, or to back the ones you believe in.</p>
        <div className="auth-fill">
          <span />
        </div>
      </aside>
      <main className="auth-form">
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="auth-foot">{footer}</p>
      </main>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}.`);
      nav(loc.state?.from || roleHome(u.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Pick up where you left off."
      footer={
        <>
          New to FundRaise? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit}>
        <label className="field">
          <span>Email</span>
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="demo">
        <p>Demo accounts (available after running the seed script)</p>
        <div>
          {DEMOS.map(([label, email, password]) => (
            <button key={label} type="button" className="chip-btn" onClick={() => setForm({ email, password })}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'supporter' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Use a password with at least 6 characters.');
    setBusy(true);
    try {
      const u = await register(form);
      toast.success('Account created. Welcome to FundRaise.');
      nav(roleHome(u.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={submit}>
        <fieldset className="roles">
          <legend>I want to</legend>
          {[
            ['supporter', 'Back campaigns', 'Pledge to causes and ideas'],
            ['creator', 'Raise money', 'Launch and manage campaigns'],
          ].map(([value, title, text]) => (
            <label key={value} className={`role-card ${form.role === value ? 'active' : ''}`}>
              <input type="radio" name="role" value={value} checked={form.role === value} onChange={() => setForm({ ...form, role: value })} />
              <strong>{title}</strong>
              <span>{text}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Full name</span>
          <input required minLength="2" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" required minLength="6" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <small className="muted">At least 6 characters.</small>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
