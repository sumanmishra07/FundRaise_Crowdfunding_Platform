import { useEffect, useState } from 'react';
import { api } from '../api';
import { useSocketEvent } from '../context/SocketContext';
import CampaignCard from '../components/CampaignCard';
import { CardSkeletons, Empty } from '../components/ui';
import { applyPledge, CATEGORIES } from '../utils';

const SORTS = [
  ['newest', 'Newest'],
  ['raised', 'Most funded'],
  ['popular', 'Most supporters'],
  ['ending', 'Ending soon'],
];
const STATUSES = [
  ['', 'All campaigns'],
  ['active', 'Still open'],
  ['funded', 'Goal reached'],
  ['ended', 'Ended'],
];

export default function Browse() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setData(null);
    setError('');
    const qs = new URLSearchParams({ sort, page, limit: 9 });
    if (debounced) qs.set('search', debounced);
    if (category !== 'All') qs.set('category', category);
    if (status) qs.set('status', status);
    api(`/campaigns?${qs}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [debounced, category, sort, status, page]);

  useSocketEvent('pledge:new', (p) =>
    setData((d) => d && { ...d, items: d.items.map((c) => applyPledge(c, p)) })
  );

  const reset = () => {
    setSearch('');
    setCategory('All');
    setStatus('');
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="container page">
      <header className="page-head">
        <h1>Explore campaigns</h1>
        <p className="muted">Find something worth backing. Every card updates live as pledges come in.</p>
      </header>

      <div className="filters">
        <label className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input type="search" placeholder="Search by campaign title" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search campaigns" />
        </label>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort campaigns">
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="chips" role="group" aria-label="Category">
        {['All', ...CATEGORIES].map((c) => (
          <button key={c} className={`chip-btn ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setPage(1); }}>
            {c}
          </button>
        ))}
      </div>

      {error ? (
        <p className="form-error" role="alert">{error}</p>
      ) : !data ? (
        <CardSkeletons count={6} />
      ) : data.items.length === 0 ? (
        <Empty
          title="No campaigns match these filters"
          text="Try a different category or clear the search."
          action={<button className="btn btn-primary" onClick={reset}>Clear filters</button>}
        />
      ) : (
        <>
          <p className="result-count">
            {data.total} campaign{data.total === 1 ? '' : 's'}
          </p>
          <div className="grid-cards">
            {data.items.map((c) => (
              <CampaignCard key={c._id} c={c} />
            ))}
          </div>
          {data.pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {data.page} of {data.pages}</span>
              <button className="btn btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
