import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { CampaignImage, Empty, PageSpinner, ProgressBar } from '../components/ui';
import { deadlineLabel, formatDate, formatINR, percentOf } from '../utils';

export default function MyPledges() {
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/pledges/mine')
      .then(setData)
      .catch((e) => {
        toast.error(e.message);
        setData({ items: [], total: 0 });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <PageSpinner />;
  const campaignsBacked = new Set(data.items.map((p) => p.campaign?._id)).size;

  return (
    <div className="container page">
      <header className="page-head">
        <h1>My pledges</h1>
        <p className="muted">Everything you have backed, in one place.</p>
      </header>

      <div className="stat-row">
        <div className="stat">
          <span>Total pledged</span>
          <strong>{formatINR(data.total)}</strong>
        </div>
        <div className="stat">
          <span>Pledges made</span>
          <strong>{data.items.length}</strong>
        </div>
        <div className="stat">
          <span>Campaigns backed</span>
          <strong>{campaignsBacked}</strong>
        </div>
      </div>

      {data.items.length === 0 ? (
        <Empty
          title="You have not pledged yet"
          text="Find a campaign you believe in and make your first pledge."
          action={<Link to="/explore" className="btn btn-primary">Explore campaigns</Link>}
        />
      ) : (
        <ul className="rows">
          {data.items.map((p) => {
            const c = p.campaign;
            return (
              <li key={p._id} className="row-card">
                {c ? (
                  <Link to={`/campaigns/${c._id}`} className="row-thumb" aria-label={`Open ${c.title}`}>
                    <CampaignImage campaign={c} />
                  </Link>
                ) : (
                  <div className="row-thumb" />
                )}
                <div className="row-main">
                  <div className="row-title">
                    {c ? <Link to={`/campaigns/${c._id}`}>{c.title}</Link> : <span>Campaign removed</span>}
                  </div>
                  {c && <ProgressBar percent={percentOf(c.raised, c.goal)} raised={c.raised} goal={c.goal} size="sm" />}
                  <p className="row-meta">
                    Pledged on {formatDate(p.createdAt)} · card ending {p.payment?.last4} · {c ? deadlineLabel(c.deadline) : ''}
                  </p>
                  {p.message && <p className="row-msg">“{p.message}”</p>}
                </div>
                <div className="row-amount">
                  <strong>{formatINR(p.amount)}</strong>
                  <small>{p.payment?.transactionId}</small>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
