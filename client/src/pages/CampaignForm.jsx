import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { CampaignImage, PageSpinner } from '../components/ui';
import { CATEGORIES, formatINR } from '../utils';

const tomorrow = () => {
  const d = new Date(Date.now() + 864e5);
  return d.toISOString().slice(0, 10);
};

export default function CampaignForm() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [raised, setRaised] = useState(0);
  const [form, setForm] = useState({
    title: '',
    category: 'Technology',
    goal: '',
    deadline: '',
    imageUrl: '',
    description: '',
  });

  useEffect(() => {
    if (!editing) return;
    api(`/campaigns/${id}`)
      .then(({ campaign: c }) => {
        setRaised(c.raised);
        setForm({
          title: c.title,
          category: c.category,
          goal: String(c.goal),
          deadline: new Date(c.deadline).toISOString().slice(0, 10),
          imageUrl: c.imageUrl || '',
          description: c.description,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.title.trim().length < 5) return setError('The title needs at least 5 characters.');
    if (form.description.trim().length < 20) return setError('Describe the campaign in at least 20 characters.');
    if (!(Number(form.goal) >= 100)) return setError('The goal must be at least ₹100.');
    if (editing && Number(form.goal) < raised) return setError(`The goal cannot be lower than the ${formatINR(raised)} already raised.`);
    if (!form.deadline) return setError('Choose a deadline.');

    const body = {
      ...form,
      goal: Number(form.goal),
      deadline: new Date(`${form.deadline}T23:59:59`).toISOString(),
    };

    setBusy(true);
    try {
      if (editing) {
        await api(`/campaigns/${id}`, { method: 'PUT', body });
        toast.success('Campaign updated.');
        nav(`/campaigns/${id}`);
      } else {
        await api('/campaigns', { method: 'POST', body });
        toast.success('Campaign submitted. An admin will review it shortly.');
        nav('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="container page narrow">
      <header className="page-head">
        <h1>{editing ? 'Edit campaign' : 'Start a campaign'}</h1>
        <p className="muted">
          {editing
            ? 'Update your details. A rejected campaign goes back to review when you save.'
            : 'Tell supporters what you are raising money for. An admin reviews every campaign before it goes live.'}
        </p>
      </header>

      <form className="form-card" onSubmit={submit} noValidate>
        <label className="field">
          <span>Campaign title</span>
          <input value={form.title} onChange={set('title')} maxLength="100" placeholder="Solar power for 20 village schools" />
        </label>

        <div className="row2">
          <label className="field">
            <span>Category</span>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Funding goal (₹)</span>
            <input type="number" min="100" step="1" value={form.goal} onChange={set('goal')} placeholder="250000" />
          </label>
        </div>

        <label className="field">
          <span>Deadline</span>
          <input type="date" min={tomorrow()} value={form.deadline} onChange={set('deadline')} />
        </label>

        <label className="field">
          <span>Cover image link (optional)</span>
          <input type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" />
        </label>
        {form.imageUrl && (
          <div className="img-preview">
            <CampaignImage campaign={{ title: form.title || 'Preview', imageUrl: form.imageUrl }} />
          </div>
        )}

        <label className="field">
          <span>Description</span>
          <textarea rows="7" value={form.description} onChange={set('description')} maxLength="4000" placeholder="What is the idea, who benefits, and how will the money be used?" />
          <small className="muted">{form.description.length} / 4000</small>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>Cancel</button>
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Submit for review'}
          </button>
        </div>
      </form>
    </div>
  );
}
