import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useSocketEvent } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { CampaignImage, CategoryBars, Empty, Modal, PageSpinner, StatusBadge } from '../components/ui';
import { deadlineLabel, formatDate, formatINR, timeAgo } from '../utils';

const TABS = [
  ['pending', 'Awaiting review'],
  ['approved', 'Live'],
  ['rejected', 'Rejected'],
  ['insights', 'Funding insights'],
  ['users', 'Users'],
];

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [list, setList] = useState(null);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadList = useCallback(() => {
    if (!['pending', 'approved', 'rejected'].includes(tab)) return;
    setList(null);
    api(`/admin/campaigns?status=${tab}`)
      .then((d) => {
        setList(d.items);
        setSummary(d.summary);
      })
      .catch((e) => {
        toast.error(e.message);
        setList([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (tab === 'insights') api('/stats/overview').then(setOverview).catch((e) => toast.error(e.message));
    if (tab === 'users') api('/admin/users').then((d) => setUsers(d.items)).catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // a creator just submitted a campaign
  useSocketEvent('campaign:pending', () => {
    if (tab === 'pending') loadList();
    else api('/admin/campaigns?status=pending').then((d) => setSummary(d.summary)).catch(() => {});
  });

  const decide = async (c, status, why = '') => {
    setBusyId(c._id);
    try {
      await api(`/admin/campaigns/${c._id}/status`, { method: 'PATCH', body: { status, reason: why } });
      toast.success(status === 'approved' ? `“${c.title}” is now live.` : `“${c.title}” was rejected.`);
      setRejecting(null);
      setReason('');
      loadList();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container page">
      <header className="page-head">
        <h1>Review campaigns</h1>
        <p className="muted">Approve campaigns to make them visible and open for pledges.</p>
      </header>

      <div className="stat-row">
        <button className={`stat stat-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          <span>Awaiting review</span>
          <strong>{summary.pending}</strong>
        </button>
        <button className={`stat stat-btn ${tab === 'approved' ? 'active' : ''}`} onClick={() => setTab('approved')}>
          <span>Live</span>
          <strong>{summary.approved}</strong>
        </button>
        <button className={`stat stat-btn ${tab === 'rejected' ? 'active' : ''}`} onClick={() => setTab('rejected')}>
          <span>Rejected</span>
          <strong>{summary.rejected}</strong>
        </button>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([v, l]) => (
          <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>
            {l}
          </button>
        ))}
      </div>

      {/* ---------- campaign lists ---------- */}
      {['pending', 'approved', 'rejected'].includes(tab) &&
        (list === null ? (
          <PageSpinner />
        ) : list.length === 0 ? (
          <Empty
            title={tab === 'pending' ? 'Nothing waiting for review' : `No ${tab === 'approved' ? 'live' : 'rejected'} campaigns`}
            text={tab === 'pending' ? 'New submissions appear here the moment a creator sends them.' : undefined}
          />
        ) : (
          <ul className="rows">
            {list.map((c) => (
              <li key={c._id} className="row-card row-card-admin">
                <Link to={`/campaigns/${c._id}`} className="row-thumb" aria-label={`Open ${c.title}`}>
                  <CampaignImage campaign={c} />
                </Link>
                <div className="row-main">
                  <div className="row-title">
                    <Link to={`/campaigns/${c._id}`}>{c.title}</Link>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="row-meta">
                    {c.category} · goal {formatINR(c.goal)} · {deadlineLabel(c.deadline)} · by {c.creator?.name} ({c.creator?.email}) · submitted {timeAgo(c.createdAt)}
                  </p>
                  <p className="row-desc">{c.description}</p>
                  {c.status === 'rejected' && c.rejectionReason && <p className="reject-note">Reason: {c.rejectionReason}</p>}
                  {c.status === 'approved' && (
                    <p className="row-meta"><strong>{formatINR(c.raised)}</strong> raised from {c.supportersCount} supporters</p>
                  )}
                </div>
                <div className="row-actions">
                  {c.status !== 'approved' && (
                    <button className="btn btn-primary btn-sm" disabled={busyId === c._id} onClick={() => decide(c, 'approved')}>
                      Approve
                    </button>
                  )}
                  {c.status !== 'rejected' && (
                    <button className="btn btn-danger-ghost btn-sm" disabled={busyId === c._id} onClick={() => setRejecting(c)}>
                      {c.status === 'approved' ? 'Take down' : 'Reject'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ))}

      {/* ---------- aggregation insights ---------- */}
      {tab === 'insights' &&
        (!overview ? (
          <PageSpinner />
        ) : (
          <div className="insights">
            <div className="stat-row">
              <div className="stat"><span>Total raised</span><strong>{formatINR(overview.totalRaised)}</strong></div>
              <div className="stat"><span>Unique supporters</span><strong>{overview.supportersCount}</strong></div>
              <div className="stat"><span>Pledges</span><strong>{overview.totalPledges}</strong></div>
            </div>
            <div className="panel">
              <h2 className="panel-title">Category-wise funding</h2>
              <CategoryBars data={overview.byCategory} />
            </div>
          </div>
        ))}

      {/* ---------- users ---------- */}
      {tab === 'users' &&
        (!users ? (
          <PageSpinner />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`role role-${u.role}`}>{u.role}</span></td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {rejecting && (
        <Modal
          title={rejecting.status === 'approved' ? 'Take down this campaign?' : 'Reject this campaign?'}
          onClose={() => setRejecting(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setRejecting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => decide(rejecting, 'rejected', reason)}>
                {rejecting.status === 'approved' ? 'Take down' : 'Reject campaign'}
              </button>
            </>
          }
        >
          <p>“{rejecting.title}”</p>
          <label className="field">
            <span>Reason shown to the creator</span>
            <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what needs to change" />
          </label>
        </Modal>
      )}
    </div>
  );
}
