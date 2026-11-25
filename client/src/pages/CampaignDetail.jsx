import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket, useSocketEvent } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import PledgeBox from '../components/PledgeBox';
import { AnimatedNumber, CampaignImage, Empty, Modal, PageSpinner, ProgressBar, StatusBadge } from '../components/ui';
import { deadlineLabel, formatDate, formatINR, initialOf, percentOf, timeAgo } from '../utils';

export default function CampaignDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const nav = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [pledges, setPledges] = useState([]);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [freshId, setFreshId] = useState(null);

  const load = useCallback(() => {
    setError('');
    api(`/campaigns/${id}`)
      .then((d) => setCampaign(d.campaign))
      .catch((e) => setError(e.message));
    api(`/campaigns/${id}/pledges`)
      .then((d) => setPledges(d.items))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setCampaign(null);
    load();
  }, [load]);

  // join this campaign's socket room
  useEffect(() => {
    if (!socket) return;
    socket.emit('campaign:join', id);
    return () => socket.emit('campaign:leave', id);
  }, [socket, id]);

  // live progress
  useSocketEvent('pledge:new', (p) => {
    if (p.campaignId !== id) return;
    setCampaign((c) => c && { ...c, raised: p.raised, supportersCount: p.supportersCount, percent: p.percent });
    const key = `${p.pledge.createdAt}-${p.pledge.amount}`;
    setPledges((list) => [{ _id: key, amount: p.pledge.amount, name: p.pledge.name, message: p.pledge.message, createdAt: p.pledge.createdAt }, ...list].slice(0, 15));
    setFreshId(key);
    setTimeout(() => setFreshId(null), 1800);
  });
  useSocketEvent('campaign:status', (p) => {
    if (p.campaignId === id) setCampaign((c) => c && { ...c, status: p.status });
  });

  if (error) {
    return (
      <div className="container page">
        <Empty
          title="Campaign not found"
          text={error}
          action={<Link to="/explore" className="btn btn-primary">Back to all campaigns</Link>}
        />
      </div>
    );
  }
  if (!campaign) return <PageSpinner />;

  const isOwner = user && String(campaign.creator?._id) === String(user._id);
  const isAdmin = user?.role === 'admin';
  const pct = campaign.percent ?? percentOf(campaign.raised, campaign.goal);
  const funded = campaign.raised >= campaign.goal;

  const setStatus = async (status, why = '') => {
    try {
      const d = await api(`/admin/campaigns/${campaign._id}/status`, { method: 'PATCH', body: { status, reason: why } });
      setCampaign((c) => ({ ...c, status: d.campaign.status, rejectionReason: d.campaign.rejectionReason }));
      toast.success(status === 'approved' ? 'Campaign approved and now live.' : 'Campaign rejected.');
      setRejecting(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    try {
      await api(`/campaigns/${campaign._id}`, { method: 'DELETE' });
      toast.success('Campaign deleted.');
      nav(isAdmin ? '/admin' : '/dashboard');
    } catch (e) {
      toast.error(e.message);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="container page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/explore">Explore</Link>
        <span aria-hidden="true">/</span>
        <span>{campaign.category}</span>
      </nav>

      {campaign.status !== 'approved' && (isOwner || isAdmin) && (
        <div className={`banner banner-${campaign.status}`} role="status">
          <StatusBadge status={campaign.status} />
          <span>
            {campaign.status === 'pending' && 'Only you and admins can see this campaign until it is approved.'}
            {campaign.status === 'rejected' &&
              `Rejected${campaign.rejectionReason ? `: ${campaign.rejectionReason}` : '.'} ${isOwner ? 'Edit the campaign to resubmit it for review.' : ''}`}
          </span>
        </div>
      )}

      <div className="detail">
        <div className="detail-main">
          <div className="detail-hero">
            <CampaignImage campaign={campaign} />
          </div>

          <div className="detail-title">
            <span className="chip">{campaign.category}</span>
            <h1>{campaign.title}</h1>
            <p className="muted">
              Created by <strong>{campaign.creator?.name}</strong> on {formatDate(campaign.createdAt)}
            </p>
          </div>

          {(isOwner || isAdmin) && (
            <div className="owner-actions">
              {isAdmin && campaign.status === 'pending' && (
                <>
                  <button className="btn btn-primary" onClick={() => setStatus('approved')}>Approve campaign</button>
                  <button className="btn btn-danger-ghost" onClick={() => setRejecting(true)}>Reject</button>
                </>
              )}
              {isAdmin && campaign.status === 'rejected' && (
                <button className="btn btn-primary" onClick={() => setStatus('approved')}>Approve campaign</button>
              )}
              {isAdmin && campaign.status === 'approved' && (
                <button className="btn btn-danger-ghost" onClick={() => setRejecting(true)}>Take down</button>
              )}
              <Link to={`/campaigns/${campaign._id}/edit`} className="btn btn-ghost">Edit</Link>
              <button className="btn btn-danger-ghost" onClick={() => setConfirmDelete(true)}>Delete</button>
            </div>
          )}

          <section className="prose">
            <h2>About this campaign</h2>
            <p>{campaign.description}</p>
          </section>

          <section className="prose">
            <h2>Recent supporters</h2>
            {pledges.length === 0 ? (
              <p className="muted">No pledges yet. Be the first to back this campaign.</p>
            ) : (
              <ul className="supporters">
                {pledges.map((p) => (
                  <li key={p._id} className={p._id === freshId ? 'fresh' : ''}>
                    <span className="avatar" aria-hidden="true">{initialOf(p.name)}</span>
                    <div>
                      <strong>{p.name}</strong>
                      {p.message && <p>{p.message}</p>}
                      <small>{timeAgo(p.createdAt)}</small>
                    </div>
                    <b>{formatINR(p.amount)}</b>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="detail-side">
          <div className="progress-card">
            <div className="progress-raised">
              <strong>
                <AnimatedNumber value={campaign.raised} />
              </strong>
              <span>raised of {formatINR(campaign.goal)} goal</span>
            </div>
            <ProgressBar percent={pct} raised={campaign.raised} goal={campaign.goal} size="lg" />
            {funded && <p className="goal-hit">Goal reached. Pledges are still open until the deadline.</p>}
            <dl className="progress-facts">
              <div>
                <dt>Funded</dt>
                <dd>{pct}%</dd>
              </div>
              <div>
                <dt>Supporters</dt>
                <dd><AnimatedNumber value={campaign.supportersCount} format={(n) => n} /></dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>{deadlineLabel(campaign.deadline)}</dd>
              </div>
            </dl>
          </div>

          <PledgeBox
            campaign={campaign}
            onPledged={(c) => setCampaign((prev) => ({ ...prev, raised: c.raised, supportersCount: c.supportersCount, percent: c.percent }))}
          />
        </div>
      </div>

      {confirmDelete && (
        <Modal
          title="Delete this campaign?"
          onClose={() => setConfirmDelete(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Keep campaign</button>
              <button className="btn btn-danger" onClick={remove}>Delete campaign</button>
            </>
          }
        >
          <p>This permanently removes “{campaign.title}” and all of its pledges. You cannot undo this.</p>
        </Modal>
      )}

      {rejecting && (
        <Modal
          title={campaign.status === 'approved' ? 'Take down this campaign?' : 'Reject this campaign?'}
          onClose={() => setRejecting(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setRejecting(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => setStatus('rejected', reason)}>
                {campaign.status === 'approved' ? 'Take down' : 'Reject campaign'}
              </button>
            </>
          }
        >
          <label className="field">
            <span>Reason shown to the creator</span>
            <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what needs to change" />
          </label>
        </Modal>
      )}
    </div>
  );
}
