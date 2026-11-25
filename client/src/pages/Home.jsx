import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';
import CampaignCard from '../components/CampaignCard';
import { AnimatedNumber, CardSkeletons, CategoryBars } from '../components/ui';
import { applyPledge, compactINR, formatINR, initialOf, timeAgo } from '../utils';

export default function Home() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState(null);
  const [feed, setFeed] = useState([]);
  const [freshId, setFreshId] = useState(null);

  const loadOverview = () => api('/stats/overview').then(setOverview).catch(() => {});

  useEffect(() => {
    loadOverview();
    api('/campaigns?sort=raised&limit=5')
      .then((d) => setCampaigns(d.items))
      .catch(() => setCampaigns([]));
    api('/stats/recent')
      .then((d) => setFeed(d.items))
      .catch(() => {});
  }, []);

  // live: a pledge arrives anywhere on the platform
  useSocketEvent('pledge:new', (p) => {
    setCampaigns((list) => list && list.map((c) => applyPledge(c, p)));
    const id = `${p.campaignId}-${p.pledge.createdAt}`;
    setFeed((f) => [{ _id: id, name: p.pledge.name, amount: p.pledge.amount, title: p.title, createdAt: p.pledge.createdAt }, ...f].slice(0, 6));
    setFreshId(id);
    setTimeout(() => setFreshId(null), 1800);
    loadOverview();
  });

  const startLink = user?.role === 'creator' ? '/campaigns/new' : user ? '/explore' : '/register';

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Back an idea. Watch it fill up.</h1>
            <p className="hero-lead">
              FundRaise connects creators with supporters across India. Pledge any amount and the campaign's progress
              bar moves the moment you do.
            </p>
            <div className="hero-cta">
              <Link to="/explore" className="btn btn-primary btn-lg">
                Explore campaigns
              </Link>
              <Link to={startLink} className="btn btn-outline-light btn-lg">
                {user?.role === 'creator' ? 'Start a campaign' : user ? 'See what is trending' : 'Start a campaign'}
              </Link>
            </div>

            <dl className="hero-stats">
              <div>
                <dt>Raised so far</dt>
                <dd>{overview ? <AnimatedNumber value={overview.totalRaised} format={compactINR} /> : '—'}</dd>
              </div>
              <div>
                <dt>Supporters</dt>
                <dd>{overview ? <AnimatedNumber value={overview.supportersCount} format={(n) => n.toLocaleString('en-IN')} /> : '—'}</dd>
              </div>
              <div>
                <dt>Live campaigns</dt>
                <dd>{overview ? <AnimatedNumber value={overview.campaigns.approved} format={(n) => n.toLocaleString('en-IN')} /> : '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="livepanel" aria-label="Latest pledges">
            <div className="livepanel-head">
              <span className="pulse-dot" aria-hidden="true" />
              <h2>Happening now</h2>
            </div>
            {feed.length === 0 ? (
              <p className="livepanel-empty">No pledges yet. The first one will appear here instantly.</p>
            ) : (
              <ul>
                {feed.map((f) => (
                  <li key={f._id} className={f._id === freshId ? 'fresh' : ''}>
                    <span className="avatar avatar-gold" aria-hidden="true">
                      {initialOf(f.name)}
                    </span>
                    <div className="livepanel-text">
                      <strong>{f.name}</strong> pledged to <em>{f.title}</em>
                      <small>{timeAgo(f.createdAt)}</small>
                    </div>
                    <b>{formatINR(f.amount)}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <svg className="hero-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40Q180 0 360 40T720 40T1080 40T1440 40V80H0Z" fill="var(--mist)" />
        </svg>
      </section>

      {/* ---------- trending ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Most funded right now</h2>
              <p className="muted">Campaigns drawing the most support. Bars update live.</p>
            </div>
            <Link to="/explore" className="btn btn-ghost">
              See all campaigns
            </Link>
          </div>

          {campaigns === null ? (
            <CardSkeletons count={4} />
          ) : campaigns.length === 0 ? (
            <p className="muted">No approved campaigns yet. Check back soon.</p>
          ) : (
            <div className="grid-cards grid-home">
              {campaigns.map((c, i) => (
                <CampaignCard key={c._id} c={c} featured={i === 0} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- category funding ---------- */}
      <section className="section section-white">
        <div className="container split">
          <div className="split-copy">
            <h2>Where the money goes</h2>
            <p>
              Every pledge is counted by category, so you can see which causes people care about most. These totals
              are calculated live from all pledges on the platform.
            </p>
            {overview && (
              <ul className="mini-stats">
                <li>
                  <strong>{formatINR(overview.totalRaised)}</strong>
                  <span>total raised</span>
                </li>
                <li>
                  <strong>{overview.totalPledges.toLocaleString('en-IN')}</strong>
                  <span>pledges made</span>
                </li>
                <li>
                  <strong>{overview.supportersCount.toLocaleString('en-IN')}</strong>
                  <span>unique supporters</span>
                </li>
              </ul>
            )}
          </div>
          <div className="panel">
            <CategoryBars data={overview?.byCategory || []} />
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>How FundRaise works</h2>
            </div>
          </div>
          <ol className="steps">
            <li>
              <span className="step-no">1</span>
              <h3>Creators submit a campaign</h3>
              <p>Set a goal, a deadline and a category. Tell people what the money will do.</p>
            </li>
            <li>
              <span className="step-no">2</span>
              <h3>An admin reviews it</h3>
              <p>Approved campaigns go live. Rejected ones come back with a reason so you can fix and resubmit.</p>
            </li>
            <li>
              <span className="step-no">3</span>
              <h3>Supporters pledge</h3>
              <p>Pick an amount, pay through the simulated checkout, and see the progress bar move for everyone watching.</p>
            </li>
          </ol>
        </div>
      </section>

      {!user && (
        <section className="container">
          <div className="cta-band">
            <div>
              <h2>Ready to fill the first bar?</h2>
              <p>Join as a creator to raise money, or as a supporter to back what you believe in.</p>
            </div>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create an account
              </Link>
              <Link to="/login" className="btn btn-outline-light btn-lg">
                Log in
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
