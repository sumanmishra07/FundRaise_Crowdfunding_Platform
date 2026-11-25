import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useSocketEvent } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { CampaignImage, Empty, Modal, PageSpinner, ProgressBar, StatusBadge } from '../components/ui';
import { applyPledge, deadlineLabel, formatINR, percentOf } from '../utils';

export default function CreatorDashboard() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [stats, setStats] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const loadStats = () =>
    api('/stats/creator')
      .then((d) => setStats(d.stats))
      .catch(() => {});

  useEffect(() => {
    api('/campaigns/mine')
      .then((d) => setItems(d.items))
      .catch((e) => {
        toast.error(e.message);
        setItems([]);
      });
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSocketEvent('pledge:new', (p) => {
    setItems((list) => list && list.map((c) => applyPledge(c, p)));
    loadStats();
  });
  useSocketEvent('campaign:status', (p) => {
    setItems((list) => {
      if (!list) return list;
      const hit = list.find((c) => String(c._id) === p.campaignId);
      if (hit && hit.status !== p.status) {
        toast[p.status === 'approved' ? 'success' : 'info'](
          `“${hit.title}” was ${p.status === 'approved' ? 'approved and is now live' : p.status}.`
        );
        api('/campaigns/mine').then((d) => setItems(d.items)).catch(() => {});
      }
      return list;
    });
  });

  const remove = async () => {
    try {
      await api(`/campaigns/${toDelete._id}`, { method: 'DELETE' });
      setItems((l) => l.filter((c) => c._id !== toDelete._id));
      toast.success('Campaign deleted.');
      loadStats();
    } catch (e) {
      toast.error(e.message);
    }
    setToDelete(null);
  };

  if (!items) return <PageSpinner />;

  return (
    <div className="container page">
      <header className="page-head page-head-row">
        <div>
          <h1>My campaigns</h1>
          <p className="muted">Track funding live and manage what you have launched.</p>
        </div>
        <Link to="/campaigns/new" className="btn btn-primary btn-lg">Start a campaign</Link>
      </header>

      <div className="stat-row">
        <div className="stat">
          <span>Total raised</span>
          <strong>{formatINR(stats?.raised || 0)}</strong>
        </div>
        <div className="stat">
          <span>Supporters</span>
          <strong>{stats?.supporters || 0}</strong>
        </div>
        <div className="stat">
          <span>Campaigns</span>
          <strong>{stats?.campaigns || 0}</strong>
        </div>
        <div className="stat">
          <span>Of combined goal</span>
          <strong>{percentOf(stats?.raised || 0, stats?.goal || 0)}%</strong>
        </div>
      </div>

      {items.length === 0 ? (
        <Empty
          title="You have not started a campaign yet"
          text="Set a goal and a deadline. An admin reviews it, then supporters can start pledging."
          action={<Link to="/campaigns/new" className="btn btn-primary">Start your first campaign</Link>}
        />
      ) : (
        <ul className="rows">
          {items.map((c) => {
            const pct = c.percent ?? percentOf(c.raised, c.goal);
            return (
              <li key={c._id} className="row-card">
                <Link to={`/campaigns/${c._id}`} className="row-thumb" aria-label={`Open ${c.title}`}>
                  <CampaignImage campaign={c} />
                </Link>
                <div className="row-main">
                  <div className="row-title">
                    <Link to={`/campaigns/${c._id}`}>{c.title}</Link>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.status === 'rejected' && c.rejectionReason && (
                    <p className="reject-note">Rejected: {c.rejectionReason}</p>
                  )}
                  <ProgressBar percent={pct} raised={c.raised} goal={c.goal} size="sm" />
                  <p className="row-meta">
                    <strong>{formatINR(c.raised)}</strong> of {formatINR(c.goal)} ({pct}%) · {c.supportersCount} supporter
                    {c.supportersCount === 1 ? '' : 's'} · {deadlineLabel(c.deadline)}
                  </p>
                </div>
                <div className="row-actions">
                  <Link to={`/campaigns/${c._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                  <button className="btn btn-danger-ghost btn-sm" onClick={() => setToDelete(c)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {toDelete && (
        <Modal
          title="Delete this campaign?"
          onClose={() => setToDelete(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setToDelete(null)}>Keep campaign</button>
              <button className="btn btn-danger" onClick={remove}>Delete campaign</button>
            </>
          }
        >
          <p>
            “{toDelete.title}” will be removed permanently.
            {toDelete.raised > 0 && ' Campaigns that already received pledges cannot be deleted by creators.'}
          </p>
        </Modal>
      )}
    </div>
  );
}
