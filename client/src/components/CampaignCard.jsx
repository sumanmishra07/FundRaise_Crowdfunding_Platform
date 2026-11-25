import { Link } from 'react-router-dom';
import { CampaignImage, ProgressBar, StatusBadge } from './ui';
import { deadlineLabel, formatINR, percentOf } from '../utils';

export default function CampaignCard({ c, featured = false, showStatus = false }) {
  const pct = c.percent ?? percentOf(c.raised, c.goal);
  return (
    <Link to={`/campaigns/${c._id}`} className={`ccard ${featured ? 'ccard-featured' : ''}`}>
      <div className="ccard-media">
        <CampaignImage campaign={c} />
        <span className="chip chip-onimg">{c.category}</span>
        {showStatus && (
          <span className="ccard-status">
            <StatusBadge status={c.status} />
          </span>
        )}
      </div>
      <div className="ccard-body">
        <h3>{c.title}</h3>
        <p className="ccard-by">by {c.creator?.name || 'Creator'}</p>
        {featured && <p className="ccard-desc">{c.description}</p>}
        <ProgressBar percent={pct} raised={c.raised} goal={c.goal} />
        <div className="ccard-stats">
          <div>
            <strong>{formatINR(c.raised)}</strong>
            <span>raised of {formatINR(c.goal)}</span>
          </div>
          <div>
            <strong>{pct}%</strong>
            <span>{deadlineLabel(c.deadline)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
